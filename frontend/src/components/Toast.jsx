import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon text-success" size={20} color="var(--status-success)" />;
      case 'error':
        return <AlertCircle className="toast-icon text-danger" size={20} color="var(--status-danger)" />;
      default:
        return <Info className="toast-icon text-info" size={20} color="var(--status-info)" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container floating top-right */}
      <div style={containerStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} style={toastStyle(toast.type)} className="glass-panel animate-slide-up">
            <div style={contentStyle}>
              {getIcon(toast.type)}
              <span style={textStyle}>{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Inline styling for the Toast components (top-right placement)
const containerStyle = {
  position: 'fixed',
  top: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  zIndex: 9999,
  maxWidth: '400px',
  width: 'calc(100% - 48px)',
};

const toastStyle = (type) => {
  let borderLeftColor = 'var(--status-info)'; 
  if (type === 'success') borderLeftColor = 'var(--status-success)';
  if (type === 'error') borderLeftColor = 'var(--status-danger)';

  return {
    background: 'var(--bg-card)',
    borderLeft: `4px solid ${borderLeftColor}`,
    borderTop: '1px solid var(--border-light)',
    borderRight: '1px solid var(--border-light)',
    borderBottom: '1px solid var(--border-light)',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'var(--radius-sm)',
  };
};

const contentStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  gap: '12px',
};

const textStyle = {
  fontSize: '0.9rem',
  fontWeight: '500',
  color: 'var(--text-primary)',
  flexGrow: 1,
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '4px',
  transition: 'background 0.2s',
  outline: 'none',
};
