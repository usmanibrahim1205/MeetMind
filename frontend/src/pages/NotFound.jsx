import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('meetmind_token');

  return (
    <div style={containerStyle}>
      <div className="glass-panel animate-slide-up" style={cardStyle}>
        <div style={iconWrapperStyle}>
          <HelpCircle size={48} color="var(--accent-purple)" className="animate-pulse-placeholder" />
        </div>
        <h1 style={titleStyle}>404</h1>
        <h2 style={subTitleStyle}>Page Not Found</h2>
        <p style={descStyle}>
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
        <button 
          onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')} 
          className="btn btn-primary"
          style={btnStyle}
        >
          <ArrowLeft size={16} />
          <span>{isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;

// 404 Styles
const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '24px',
};

const cardStyle = {
  width: '100%',
  maxWidth: '420px',
  padding: '48px 32px',
  background: 'var(--bg-card)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
};

const iconWrapperStyle = {
  background: 'rgba(167, 139, 250, 0.1)',
  padding: '16px',
  borderRadius: '50%',
  marginBottom: '24px',
};

const titleStyle = {
  fontSize: '4.5rem',
  fontWeight: '900',
  lineHeight: '1',
  background: 'var(--accent-gradient)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '8px',
};

const subTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
  marginBottom: '12px',
};

const descStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
  marginBottom: '32px',
  maxWidth: '300px',
};

const btnStyle = {
  width: '100%',
  maxWidth: '220px',
  padding: '12px',
};
