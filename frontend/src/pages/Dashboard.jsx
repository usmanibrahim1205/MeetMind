import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Sparkles, CheckSquare, Search, 
  UploadCloud, ArrowRight, Download, Trash2, Calendar
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { StatsSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import ConfirmationDialog from '../components/ConfirmationDialog';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteMeetingId, setDeleteMeetingId] = useState(null);

  // Read current user
  const user = JSON.parse(localStorage.getItem('meetmind_user') || '{}');

  const fetchData = async (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    try {
      // Parallel requests for stats and meetings
      const [statsRes, meetingsRes] = await Promise.all([
        api.get('/stats'),
        api.get(`/meetings${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`)
      ]);
      setStats(statsRes.data);
      setMeetings(meetingsRes.data);
    } catch (error) {
      showToast('Failed to retrieve dashboard content.', 'error');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // Fetch on mount and when search query changes
  useEffect(() => {
    fetchData(true);
  }, [searchQuery]);

  // Set up polling (every 5s) if any meeting is in a processing state
  useEffect(() => {
    const hasProcessing = meetings.some(m => 
      ['uploading', 'transcribing', 'summarizing'].includes(m.status)
    );

    if (hasProcessing) {
      const interval = setInterval(() => {
        fetchData(false); // background fetch, no loading skeletons
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [meetings]);

  const handleDeleteConfirm = async () => {
    if (!deleteMeetingId) return;
    try {
      await api.delete(`/meetings/${deleteMeetingId}`);
      showToast('Meeting deleted successfully.', 'success');
      setDeleteMeetingId(null);
      fetchData(false);
    } catch (e) {
      showToast('Failed to delete meeting.', 'error');
    }
  };

  const handleDownloadPDF = async (e, meetingId, title) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      showToast('Generating report PDF...', 'info', 2000);
      const response = await api.get(`/meetings/${meetingId}/pdf`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `MeetMind_Report_${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      showToast('Failed to download PDF report.', 'error');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      case 'uploading':
        return <span className="badge badge-secondary animate-pulse-placeholder">Uploading...</span>;
      case 'transcribing':
        return <span className="badge animate-pulse-placeholder" style={{ background: 'var(--bg-elevated)', color: 'var(--status-info)' }}>Transcribing...</span>;
      case 'summarizing':
        return <span className="badge animate-pulse-placeholder" style={{ background: 'var(--bg-elevated)', color: 'var(--accent-purple)' }}>Summarizing...</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={welcomeHeaderStyle}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>Welcome Back, {user.username || 'User'}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Track meeting summaries and check off outstanding tasks.</p>
        </div>
        <button onClick={() => navigate('/upload')} className="btn btn-primary">
          <UploadCloud size={18} />
          <span>Upload Recording</span>
        </button>
      </div>

      {loading && !stats ? (
        <StatsSkeleton />
      ) : (
        stats && (
          <div style={statsGridStyle}>
            <div style={cardStyle}>
              <div style={iconWrapperStyle}>
                <FileText size={20} color="var(--accent-purple)" />
              </div>
              <span style={statLabelStyle}>Total Meetings</span>
              <span style={statValStyle}>{stats.total_meetings}</span>
            </div>
            
            <div style={cardStyle}>
              <div style={iconWrapperStyle}>
                <Clock size={20} color="var(--status-info)" />
              </div>
              <span style={statLabelStyle}>Audio Logged</span>
              <span style={statValStyle}>{stats.total_hours} hrs</span>
            </div>

            <div style={cardStyle}>
              <div style={iconWrapperStyle}>
                <Sparkles size={20} color="var(--accent-purple-hover)" />
              </div>
              <span style={statLabelStyle}>AI Summaries</span>
              <span style={statValStyle}>{stats.summaries_generated}</span>
            </div>

            <div style={cardStyle}>
              <div style={iconWrapperStyle}>
                <CheckSquare size={20} color="var(--status-success)" />
              </div>
              <span style={statLabelStyle}>Pending Tasks</span>
              <span style={statValStyle}>{stats.pending_action_items}</span>
            </div>
          </div>
        )
      )}

      {/* Main Section */}
      <div style={tableHeaderContainerStyle}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Recent Meetings</h2>
        <div style={searchWrapperStyle}>
          <Search size={18} style={searchIconStyle} />
          <input 
            type="text" 
            placeholder="Search title, transcripts, topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '44px' }}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : meetings.length === 0 ? (
        <div className="animate-slide-up" style={emptyStateStyle}>
          <div style={emptyIconStyle}>
            <UploadCloud size={48} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {searchQuery ? 'No matching meetings found' : 'No meetings uploaded yet'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '320px', textAlign: 'center' }}>
            {searchQuery 
              ? 'Try adjusting your search keywords or clean the filter query.' 
              : 'Upload your first meeting recording to begin generating transcriptions and summaries.'}
          </p>
          {!searchQuery && (
            <button onClick={() => navigate('/upload')} className="btn btn-primary">
              Upload Your First Audio
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="animate-fade-in" style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeadStyle}>
                <th style={{ ...thStyle, width: '45%' }}>Meeting Title</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Duration</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr 
                  key={meeting.id} 
                  style={trStyle} 
                  onClick={() => {
                    if (['completed', 'failed'].includes(meeting.status)) {
                      navigate(`/meetings/${meeting.id}`);
                    }
                  }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={meetingTitleStyle}>{meeting.title}</span>
                      <span style={meetingFileStyle}>{meeting.filename}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={dateColStyle}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span>{formatDate(meeting.upload_date)}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>{formatDuration(meeting.duration)}</td>
                  <td style={tdStyle}>{renderStatusBadge(meeting.status)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={actionColStyle}>
                      {meeting.status === 'completed' && (
                        <button 
                          onClick={(e) => handleDownloadPDF(e, meeting.id, meeting.title)} 
                          style={actionBtnStyle}
                          className="btn-secondary"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDeleteMeetingId(meeting.id);
                        }} 
                        style={{ ...actionBtnStyle, color: 'var(--status-danger)' }}
                        className="btn-secondary"
                        title="Delete Meeting"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog 
        isOpen={deleteMeetingId !== null}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This will permanently delete the audio log, transcript, summary notes, and generated PDF."
        confirmText="Confirm Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteMeetingId(null)}
      />
    </div>
  );
};

export default Dashboard;

// Dashboard Styles
const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

const welcomeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '24px',
  marginBottom: '40px',
};

const cardStyle = {
  padding: '16px 0px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  background: 'transparent',
  border: 'none',
};

const iconWrapperStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  marginBottom: '12px',
};

const statLabelStyle = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  fontWeight: '600',
  marginBottom: '4px',
};

const statValStyle = {
  fontSize: '1.75rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const tableHeaderContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  flexWrap: 'wrap',
  gap: '16px',
};

const searchWrapperStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '340px',
};

const searchIconStyle = {
  position: 'absolute',
  left: '16px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};

const emptyStateStyle = {
  padding: '60px 40px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-lg)',
  background: 'transparent',
  border: '1px dashed var(--border-light)',
};

const emptyIconStyle = {
  background: 'transparent',
  padding: '12px',
  marginBottom: '16px',
};

const tableContainerStyle = {
  overflowX: 'auto',
  background: 'transparent',
  border: 'none',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
};

const tableHeadStyle = {
  borderBottom: '1px solid var(--border-light)',
  background: 'transparent',
};

const thStyle = {
  padding: '16px 20px',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const trStyle = {
  borderBottom: '1px solid var(--border-light)',
  cursor: 'pointer',
  transition: 'background var(--transition-fast)',
};

const tdStyle = {
  padding: '16px 20px',
  fontSize: '0.9rem',
  verticalAlign: 'middle',
  color: 'var(--text-primary)',
};

const meetingTitleStyle = {
  fontWeight: '600',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
};

const meetingFileStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
};

const dateColStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const actionColStyle = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
};

const actionBtnStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
  padding: '8px',
  borderRadius: '6px',
  display: 'inline-flex',
  cursor: 'pointer',
  transition: 'all 0.2s',
  outline: 'none',
  color: 'var(--text-primary)',
};
