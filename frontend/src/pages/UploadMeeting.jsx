import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const UploadMeeting = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      showToast(`Unsupported file format. Please upload: ${ALLOWED_EXTENSIONS.join(', ')}`, 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast(`File is too large. Max size is 50MB. Your file: ${(file.size / (1024*1024)).toFixed(1)}MB`, 'error');
      return;
    }

    setSelectedFile(file);
    // Auto populate title from filename if empty
    if (!title) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.'))
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      setTitle(cleanName);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file first.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (title.trim()) {
      formData.append('title', title);
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Post request tracking upload progress
      await api.post('/meetings/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          if (percentCompleted === 100) {
            // Transition to processing state
            setUploading(false);
            setProcessing(true);
            triggerProcessingSteps();
          }
        }
      });
      
      showToast('Audio uploaded successfully! AI pipeline running.', 'success');
      
      // Delay navigation a bit to show processing animations, then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 6000);

    } catch (error) {
      setUploading(false);
      setProcessing(false);
      const errMsg = error.response?.data?.detail || 'Failed to upload audio file. Please try again.';
      showToast(errMsg, 'error');
    }
  };

  const triggerProcessingSteps = () => {
    // Simulated steps to inform the user of backend activities
    setTimeout(() => setProcessingStep(1), 1200); // transcribing
    setTimeout(() => setProcessingStep(2), 2400); // clustering
    setTimeout(() => setProcessingStep(3), 3600); // summarizing
    setTimeout(() => setProcessingStep(4), 4800); // finalizing
  };

  return (
    <div style={containerStyle}>
      <div style={backHeaderStyle}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          Back to Dashboard
        </button>
      </div>

      <div style={cardStyle}>
        {!processing ? (
          <>
            <h2 style={cardTitleStyle}>Upload Meeting</h2>
            <p style={cardSubStyle}>Upload meeting audio records (MP3, WAV, M4A) up to 50MB. For optimal processing speed, testing with smaller files is highly recommended.</p>

            <form onSubmit={handleUploadSubmit} style={formStyle}>
              {/* Drag and Drop Zone */}
              <div 
                style={{
                  ...dropZoneStyle,
                  borderColor: dragActive ? 'var(--accent-purple)' : 'var(--border-light)',
                  background: dragActive ? 'rgba(109, 74, 255, 0.04)' : 'transparent',
                }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept={ALLOWED_EXTENSIONS.join(',')}
                />
                
                {selectedFile ? (
                  <div style={fileDetailsStyle}>
                    <File size={40} color="var(--accent-purple)" />
                    <span style={fileNameStyle}>{selectedFile.name}</span>
                    <span style={fileSizeStyle}>{(selectedFile.size / (1024*1024)).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div style={dropContentStyle}>
                    <UploadCloud size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>Drag & drop your recording here</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or click to browse local files</p>
                  </div>
                )}
              </div>

              {/* Title input */}
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Meeting Title (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q3 Sales & Budget Review" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  disabled={uploading}
                />
              </div>

              {/* Upload Button or Progress Bar */}
              {uploading ? (
                <div style={progressContainerStyle}>
                  <div style={progressHeaderStyle}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Uploading Audio Log...</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{uploadProgress}%</span>
                  </div>
                  <div style={progressBarBgStyle}>
                    <div style={{ ...progressBarFillStyle, width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={submitBtnStyle}
                  disabled={!selectedFile}
                >
                  <Sparkles size={18} />
                  <span>Start Uploading & Process</span>
                </button>
              )}
            </form>
          </>
        ) : (
          <div style={processingContainerStyle} className="animate-fade-in">
            <div style={processingIconStyle}>
              <Sparkles size={36} color="var(--accent-purple)" className="animate-pulse-placeholder" />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>File Upload Complete</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
              MeetMind has securely saved your audio. The AI pipeline is now executing.
            </p>

            {/* Steps Timeline Indicator */}
            <div style={stepsListStyle}>
              <div style={stepItemStyle(processingStep >= 0)}>
                <CheckCircle2 size={16} color={processingStep > 0 ? 'var(--status-success)' : 'currentColor'} />
                <span>Audio log saved securely on host database</span>
              </div>
              
              <div style={stepItemStyle(processingStep >= 1)}>
                <CheckCircle2 size={16} color={processingStep > 1 ? 'var(--status-success)' : 'currentColor'} />
                <span className={processingStep === 1 ? 'animate-pulse-placeholder' : ''}>Transcribing speech dialogues locally (faster-whisper CPU)</span>
              </div>

              <div style={stepItemStyle(processingStep >= 2)}>
                <CheckCircle2 size={16} color={processingStep > 2 ? 'var(--status-success)' : 'currentColor'} />
                <span className={processingStep === 2 ? 'animate-pulse-placeholder' : ''}>Distinguishing speaker voice footprints (Agglomerative clustering)</span>
              </div>

              <div style={stepItemStyle(processingStep >= 3)}>
                <CheckCircle2 size={16} color={processingStep > 3 ? 'var(--status-success)' : 'currentColor'} />
                <span className={processingStep === 3 ? 'animate-pulse-placeholder' : ''}>Extracting summary topics & action checklist (Local NLP Engine)</span>
              </div>

              <div style={stepItemStyle(processingStep >= 4)}>
                <CheckCircle2 size={16} color={processingStep >= 4 ? 'var(--status-success)' : 'currentColor'} />
                <span>Compiling printable executive report PDF</span>
              </div>
            </div>

            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={dashBtnStyle}>
              Go to Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadMeeting;

// Upload Page Styles
const containerStyle = {
  width: '100%',
  maxWidth: '680px',
  margin: '0 auto',
};

const backHeaderStyle = {
  marginBottom: '20px',
};

const cardStyle = {
  padding: '40px 0px',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  border: 'none',
};

const cardTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '700',
  marginBottom: '8px',
  color: 'var(--text-primary)',
};

const cardSubStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.9rem',
  marginBottom: '32px',
  lineHeight: '1.4',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const dropZoneStyle = {
  border: '1px dashed var(--border-light)',
  borderRadius: 'var(--radius-md)',
  padding: '48px 24px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const dropContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const fileDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
};

const fileNameStyle = {
  fontWeight: '600',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  maxWidth: '280px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const fileSizeStyle = {
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: 'var(--text-secondary)',
};

const submitBtnStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '0.95rem',
};

const progressContainerStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const progressHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  color: 'var(--text-secondary)',
};

const progressBarBgStyle = {
  width: '100%',
  height: '6px',
  background: 'var(--bg-elevated)',
  borderRadius: '3px',
  overflow: 'hidden',
};

const progressBarFillStyle = {
  height: '100%',
  background: 'var(--accent-purple)',
  borderRadius: '3px',
  transition: 'width 0.2s',
};

const processingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: '20px 0',
};

const processingIconStyle = {
  background: 'var(--bg-elevated)',
  padding: '16px',
  borderRadius: '50%',
  marginBottom: '24px',
  border: '1px solid var(--border-light)',
};

const stepsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  maxWidth: '420px',
  textAlign: 'left',
  marginBottom: '36px',
  background: 'transparent',
  padding: '20px 0px',
  borderTop: '1px solid var(--border-light)',
  borderBottom: '1px solid var(--border-light)',
};

// Function style inside JS
const stepItemStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '0.88rem',
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  fontWeight: active ? '600' : '400',
  opacity: active ? 1 : 0.45,
  transition: 'all 0.3s',
});

const dashBtnStyle = {
  width: '100%',
  maxWidth: '220px',
  padding: '12px',
  fontWeight: '600',
};
