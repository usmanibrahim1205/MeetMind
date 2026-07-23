import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Video, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Show session expired toast if redirected
  React.useEffect(() => {
    if (searchParams.get('expired')) {
      showToast('Your session has expired. Please sign in again.', 'info');
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate user
      const response = await api.post('/auth/login', { username, password });
      const { access_token } = response.data;
      
      // Save Token
      localStorage.setItem('meetmind_token', access_token);
      
      // 2. Fetch User Profile info
      const userResponse = await api.get('/auth/me');
      localStorage.setItem('meetmind_user', JSON.stringify(userResponse.data));

      showToast(`Welcome back, ${userResponse.data.username}!`, 'success');
      navigate('/dashboard');
    } catch (error) {
      let errMsg = 'Authentication failed. Please check credentials.';
      if (error.response?.data) {
        if (typeof error.response.data.detail === 'string') {
          errMsg = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errMsg = error.response.data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        } else if (error.response.data.message) {
          errMsg = error.response.data.message;
        }
      } else if (error.message) {
        errMsg = `Connection error: ${error.message}`;
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Brand Header */}
        <div style={brandStyle} onClick={() => navigate('/')}>
          <div style={logoIconStyle}>
            <Video size={20} color="#ffffff" />
          </div>
          <span style={brandNameStyle}>MeetMind</span>
        </div>

        <div style={headerStyle}>
          <h2 style={titleStyle}>Welcome Back</h2>
          <p style={subTitleStyle}>Sign in to manage your meetings and view insights</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Username or Email</label>
            <div style={inputWrapperStyle}>
              <Mail size={18} style={iconStyle} />
              <input 
                type="text" 
                placeholder="you@example.com" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Password</label>
            </div>
            <div style={inputWrapperStyle}>
              <Lock size={18} style={iconStyle} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={btnStyle}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>

        <div style={footerStyle}>
          <span style={footerTextStyle}>Don't have an account?</span>
          <Link to="/register" style={linkStyle}>
            Create one <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

// Login Layout Styles
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
  padding: '40px 0px',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '32px',
  cursor: 'pointer',
  justifyContent: 'center',
};

const logoIconStyle = {
  background: 'var(--accent-purple)',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const brandNameStyle = {
  fontSize: '1.25rem',
  fontWeight: '800',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '28px',
};

const titleStyle = {
  fontSize: '1.6rem',
  fontWeight: '800',
  color: 'var(--text-primary)',
  marginBottom: '8px',
};

const subTitleStyle = {
  fontSize: '0.88rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
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

const inputWrapperStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle = {
  position: 'absolute',
  left: '16px',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
};

const inputStyle = {
  paddingLeft: '46px',
};

const btnStyle = {
  width: '100%',
  marginTop: '10px',
  padding: '12px',
  fontSize: '0.95rem',
};

const footerStyle = {
  marginTop: '28px',
  paddingTop: '20px',
  borderTop: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontSize: '0.9rem',
};

const footerTextStyle = {
  color: 'var(--text-muted)',
};

const linkStyle = {
  color: 'var(--accent-purple)',
  textDecoration: 'none',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
};
