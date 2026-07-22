import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationDialog = ({ 
  isOpen, 
  title = "Are you sure?", 
  message = "This action cannot be undone. Please confirm.", 
  confirmText = "Delete", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div className="glass-panel animate-slide-up" style={modalStyle}>
        <div style={headerStyle}>
          <div style={titleContainerStyle}>
            {isDanger && <AlertTriangle size={20} color="var(--status-danger)" />}
            <h3 style={titleStyle}>{title}</h3>
          </div>
          <button onClick={onCancel} style={closeBtnStyle}>
            <X size={18} />
          </button>
        </div>
        
        <div style={bodyStyle}>
          <p style={messageStyle}>{message}</p>
        </div>
        
        <div style={footerStyle}>
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;

// Styles for Confirmation Modal
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(3, 7, 18, 0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '16px',
};

const modalStyle = {
  background: 'var(--bg-card)',
  width: '100%',
  maxWidth: '440px',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xl)', // 20px
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const titleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const titleStyle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
};

const bodyStyle = {
  marginBottom: '24px',
};

const messageStyle = {
  fontSize: '0.95rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};
