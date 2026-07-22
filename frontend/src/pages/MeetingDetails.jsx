import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, RefreshCw, Trash2, Calendar, Clock, 
  Sparkles, FileText, CheckSquare 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { DetailsSkeleton } from '../components/SkeletonLoader';
import ConfirmationDialog from '../components/ConfirmationDialog';
import confetti from 'canvas-confetti';

const MeetingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const fetchMeeting = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get(`/meetings/${id}`);
      setMeeting(response.data);
    } catch (error) {
      showToast('Failed to retrieve meeting details.', 'error');
      navigate('/dashboard');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting(true);
  }, [id]);

  const handleToggleActionItem = async (itemId, currentStatus) => {
    try {
      const response = await api.post(`/meetings/${id}/action-items/${itemId}/toggle`);
      const updatedItem = response.data;
      
      // Update local state
      setMeeting((prevMeeting) => {
        const updatedItems = prevMeeting.action_items.map((item) => 
          item.id === itemId ? { ...item, completed: updatedItem.completed } : item
        );
        
        // Trigger confetti if all items are now checked!
        const allCompleted = updatedItems.every(item => item.completed);
        if (allCompleted && !currentStatus && updatedItems.length > 0) {
          triggerSuccessConfetti();
          showToast('All action items completed! Awesome job.', 'success');
        }

        return { ...prevMeeting, action_items: updatedItems };
      });
    } catch (error) {
      showToast('Failed to update action item.', 'error');
    }
  };

  const triggerSuccessConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDownloadPDF = async () => {
    if (!meeting) return;
    try {
      showToast('Compiling report PDF...', 'info', 2000);
      const response = await api.get(`/meetings/${id}/pdf`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `MeetMind_Report_${meeting.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('PDF downloaded successfully.', 'success');
    } catch (error) {
      showToast('Failed to download PDF report.', 'error');
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      showToast('Submitting transcript to AI model...', 'info', 3000);
      await api.post(`/meetings/${id}/analyze`);
      showToast('Re-analysis started. Updates will load automatically.', 'success');
      
      // Setup small interval to poll status until complete
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await api.get(`/meetings/${id}`);
          if (pollRes.data.status === 'completed' || pollRes.data.status === 'failed') {
            setMeeting(pollRes.data);
            setReanalyzing(false);
            clearInterval(pollInterval);
            showToast('Analysis reload completed!', 'success');
          }
        } catch (e) {
          clearInterval(pollInterval);
          setReanalyzing(false);
        }
      }, 3000);
      
    } catch (error) {
      setReanalyzing(false);
      showToast('Failed to start re-analysis.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/meetings/${id}`);
      showToast('Meeting deleted successfully.', 'success');
      navigate('/dashboard');
    } catch (e) {
      showToast('Failed to delete meeting.', 'error');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Safe custom lightweight Markdown parser
  const renderSummaryMarkdown = (markdown) => {
    if (!markdown) return <p>No summary generated.</p>;
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: '8px' }}></div>;
      
      // H3
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} style={h3Style}>{trimmed.replace('###', '').trim()}</h3>;
      }
      // H2
      if (trimmed.startsWith('##')) {
        return <h2 key={idx} style={h2Style}>{trimmed.replace('##', '').trim()}</h2>;
      }
      // Bullet list
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const text = trimmed.substring(1).trim();
        // Replace bold **text** with standard strong tags
        const formattedText = parseBoldText(text);
        return <li key={idx} style={liStyle} dangerouslySetInnerHTML={{ __html: formattedText }} />;
      }
      
      const formattedText = parseBoldText(trimmed);
      return <p key={idx} style={pStyle} dangerouslySetInnerHTML={{ __html: formattedText }} />;
    });
  };

  const parseBoldText = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  if (loading) return <DetailsSkeleton />;
  if (!meeting) return null;

  const sentimentColor = () => {
    const s = meeting.summary?.sentiment?.toLowerCase();
    if (s === 'positive') return 'var(--status-success)'; 
    if (s === 'negative') return 'var(--status-danger)'; 
    return 'var(--text-secondary)'; 
  };

  const sentimentBg = () => {
    const s = meeting.summary?.sentiment?.toLowerCase();
    if (s === 'positive') return 'var(--sentiment-pos-bg)'; 
    if (s === 'negative') return 'var(--sentiment-neg-bg)'; 
    return 'var(--sentiment-neu-bg)'; 
  };

  return (
    <div style={containerStyle}>
      {/* Action Header */}
      <div style={actionHeaderStyle}>
        <button onClick={() => navigate('/dashboard')} style={backBtnStyle} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>

        <div style={actionGroupStyle}>
          <button 
            onClick={handleDownloadPDF} 
            className="btn btn-secondary"
            disabled={reanalyzing}
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
          
          <button 
            onClick={handleReanalyze} 
            className="btn btn-secondary"
            disabled={reanalyzing}
          >
            <RefreshCw size={16} className={reanalyzing ? 'animate-spin-placeholder' : ''} />
            <span>{reanalyzing ? 'Processing...' : 'Re-Analyze'}</span>
          </button>

          <button 
            onClick={() => setDeleteOpen(true)} 
            className="btn btn-danger"
            disabled={reanalyzing}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Title Card */}
      <div style={titleCardStyle}>
        <h1 style={titleStyle}>{meeting.title}</h1>
        
        <div style={metaGridStyle}>
          <div style={metaItemStyle}>
            <Calendar size={16} color="var(--text-muted)" />
            <span>{formatDate(meeting.upload_date)}</span>
          </div>
          <div style={metaItemStyle}>
            <Clock size={16} color="var(--text-muted)" />
            <span>Duration: {formatDuration(meeting.duration)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout Section */}
      <div style={twoColLayoutStyle}>
        <div style={{ flex: 2.2, minWidth: '320px' }}>
          {/* Tab Navigation header */}
          <div style={tabHeaderStyle}>
            <button 
              onClick={() => setActiveTab('summary')} 
              style={tabBtnStyle(activeTab === 'summary')}
            >
              <Sparkles size={16} />
              <span>AI Summary</span>
            </button>
            <button 
              onClick={() => setActiveTab('action_items')} 
              style={tabBtnStyle(activeTab === 'action_items')}
            >
              <CheckSquare size={16} />
              <span>Action Items</span>
            </button>
            <button 
              onClick={() => setActiveTab('transcript')} 
              style={tabBtnStyle(activeTab === 'transcript')}
            >
              <FileText size={16} />
              <span>Transcript</span>
            </button>
          </div>

          {/* Tab contents */}
          <div style={tabContentStyle}>
            {activeTab === 'summary' && (
              <div className="animate-fade-in" style={summaryWrapperStyle}>
                {meeting.summary ? (
                  renderSummaryMarkdown(meeting.summary.summary)
                ) : (
                  <p style={emptyTextStyle}>Summary not generated yet. Click Re-Analyze to trigger.</p>
                )}
              </div>
            )}

            {activeTab === 'action_items' && (
              <div className="animate-fade-in" style={actionListStyle}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <CheckSquare size={18} color="var(--accent-purple)" />
                  <span>Checklist Tasks</span>
                </h3>
                {meeting.action_items && meeting.action_items.length > 0 ? (
                  meeting.action_items.map((item) => (
                    <div 
                      key={item.id} 
                      style={actionItemWrapperStyle}
                      onClick={() => handleToggleActionItem(item.id, item.completed)}
                    >
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => {}} // Handled by outer click
                        style={checkboxStyle}
                      />
                      <span style={actionTextStyle(item.completed)}>
                        {item.item}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={emptyTextStyle}>No action items extracted from this meeting transcript.</p>
                )}
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="animate-fade-in" style={transcriptContainerStyle}>
                {meeting.transcript ? (
                  meeting.transcript.transcript.split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    // Dialog check: "[00:12] User: Hello"
                    if (trimmed.startsWith('[') && trimmed.includes(':')) {
                      const endTs = trimmed.indexOf(']');
                      const ts = trimmed.substring(1, endTs);
                      const rest = trimmed.substring(endTs + 1).trim();
                      const endSpeaker = rest.indexOf(':');
                      const speaker = rest.substring(0, endSpeaker);
                      const msg = rest.substring(endSpeaker + 1).trim();
                      
                      return (
                        <div key={idx} style={dialogRowStyle}>
                          <span style={tsStyle}>{ts}</span>
                          <span style={speakerStyle}>{speaker}:</span>
                          <span style={msgStyle}>{msg}</span>
                        </div>
                      );
                    }
                    
                    return <p key={idx} style={{ ...pStyle, margin: '8px 0' }}>{trimmed}</p>;
                  })
                ) : (
                  <p style={emptyTextStyle}>No transcription text available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets Column */}
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Sentiment Widget */}
          <div style={widgetCardStyle}>
            <h3 style={widgetTitleStyle}>Meeting Sentiment</h3>
            <div style={sentimentRowStyle}>
              <span 
                className="badge" 
                style={{ 
                  background: sentimentBg(), 
                  color: sentimentColor(), 
                  border: `1px solid ${sentimentColor()}30`,
                  padding: '6px 12px',
                  fontSize: '0.85rem'
                }}
              >
                {meeting.summary?.sentiment || 'Neutral'}
              </span>
            </div>
            {meeting.summary?.sentiment_explanation && (
              <p style={sentimentDescStyle}>{meeting.summary.sentiment_explanation}</p>
            )}
          </div>

          {/* Topics Widget */}
          <div style={widgetCardStyle}>
            <h3 style={widgetTitleStyle}>Discussion Topics</h3>
            {meeting.topics && meeting.topics.length > 0 ? (
              <div style={tagCloudStyle}>
                {meeting.topics.map((t) => (
                  <span key={t.id} style={tagStyle}>
                    #{t.name}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ ...emptyTextStyle, fontSize: '0.85rem' }}>No topics extracted.</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={deleteOpen}
        title="Delete Meeting permanently?"
        message="This is an irreversible action. This meeting recording, transcription logs, and executive summary notes will be erased from the server disk."
        confirmText="Yes, delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};

export default MeetingDetails;

// Details Layout Styles
const containerStyle = {
  width: '100%',
};

const actionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
};

const backBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
};

const actionGroupStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const titleCardStyle = {
  padding: '28px 0px',
  background: 'transparent',
  marginBottom: '24px',
  border: 'none',
};

const titleStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
  marginBottom: '12px',
  lineHeight: '1.3',
};

const metaGridStyle = {
  display: 'flex',
  gap: '24px',
  flexWrap: 'wrap',
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
};

const metaItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const twoColLayoutStyle = {
  display: 'flex',
  gap: '24px',
  flexWrap: 'wrap-reverse',
};

const tabHeaderStyle = {
  display: 'flex',
  padding: '0px',
  marginBottom: '24px',
  background: 'transparent',
  borderBottom: '1px solid var(--border-light)',
  gap: '20px',
};

const tabBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 0px',
  border: 'none',
  borderBottom: active ? '2px solid var(--accent-purple)' : '2px solid transparent',
  background: 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontWeight: active ? '600' : '400',
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

const tabContentStyle = {
  padding: '16px 0px',
  background: 'transparent',
  border: 'none',
  minHeight: '380px',
};

const summaryWrapperStyle = {
  lineHeight: '1.6',
  color: 'var(--text-primary)',
};

const h2Style = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginTop: '20px',
  marginBottom: '10px',
  color: 'var(--accent-purple)',
  borderBottom: '1px solid var(--border-light)',
  paddingBottom: '6px',
};

const h3Style = {
  fontSize: '1.05rem',
  fontWeight: '600',
  marginTop: '16px',
  marginBottom: '8px',
  color: 'var(--status-info)',
};

const pStyle = {
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  marginBottom: '12px',
};

const liStyle = {
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  marginLeft: '20px',
  marginBottom: '8px',
  listStyleType: 'disc',
};

const actionListStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const actionItemWrapperStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px 0px',
  cursor: 'pointer',
  transition: 'background var(--transition-fast)',
  borderBottom: '1px solid var(--border-light)',
};

const checkboxStyle = {
  marginTop: '4px',
  cursor: 'pointer',
  width: '16px',
  height: '16px',
  accentColor: 'var(--accent-purple)',
};

const actionTextStyle = (completed) => ({
  fontSize: '0.95rem',
  color: completed ? 'var(--text-muted)' : 'var(--text-primary)',
  textDecoration: completed ? 'line-through' : 'none',
  transition: 'all 0.15s',
});

const transcriptContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxHeight: '600px',
  overflowY: 'auto',
  paddingRight: '12px',
};

const dialogRowStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 100px 1fr',
  gap: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--border-light)',
};

const tsStyle = {
  fontSize: '0.85rem',
  fontFamily: 'monospace',
  color: 'var(--accent-purple)',
  fontWeight: '600',
};

const speakerStyle = {
  fontSize: '0.88rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const msgStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
};

const widgetCardStyle = {
  padding: '24px 0px',
  background: 'transparent',
  borderBottom: '1px solid var(--border-light)',
};

const widgetTitleStyle = {
  fontSize: '1.05rem',
  fontWeight: '600',
  marginBottom: '16px',
  color: 'var(--text-primary)',
};

const sentimentRowStyle = {
  marginBottom: '12px',
};

const sentimentDescStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
};

const tagCloudStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const tagStyle = {
  padding: '4px 10px',
  fontSize: '0.8rem',
  borderRadius: '4px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
};

const emptyTextStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  textAlign: 'center',
  padding: '40px 0',
};
