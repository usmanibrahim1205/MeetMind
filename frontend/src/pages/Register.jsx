import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Video, Mail, Lock, UserPlus, ArrowRight, User } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Field Validations
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters long.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Register User
      await api.post('/auth/register', { username, email, password });
      
      showToast('Account created successfully! Logging you in...', 'success');

      // 2. Immediate auto login for frictionless onboarding
      const loginResponse = await api.post('/auth/login', { username, password });
      const { access_token } = loginResponse.data;
      
      localStorage.setItem('meetmind_token', access_token);

      // 3. Fetch Profile info
      const userResponse = await api.get('/auth/me');
      localStorage.setItem('meetmind_user', JSON.stringify(userResponse.data));

      showToast(`Welcome to MeetMind, ${userResponse.data.username}!`, 'success');
      navigate('/dashboard');
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Registration failed. Username or email might be taken.';
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
          <h2 style={titleStyle}>Create Account</h2>
          <p style={subTitleStyle}>Sign up to transcribe and analyze your meetings</p>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Username</label>
            <div style={inputWrapperStyle}>
              <User size={18} style={iconStyle} />
              <input 
                type="text" 
                placeholder="johndoe" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <div style={inputWrapperStyle}>
              <Mail size={18} style={iconStyle} />
              <input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Password</label>
            <div style={inputWrapperStyle}>
              <Lock size={18} style={iconStyle} />
              <input 
                type="password" 
                placeholder="Min 6 characters" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Confirm Password</label>
            <div style={inputWrapperStyle}>
              <Lock size={18} style={iconStyle} />
              <input 
                type="password" 
                placeholder="Re-enter password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Sign Up'}
            {!loading && <UserPlus size={18} />}
          </button>
        </form>

        <div style={footerStyle}>
          <span style={footerTextStyle}>Already have an account?</span>
          <Link to="/login" style={linkStyle}>
            Sign In <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

// Styles match login page for consistency
const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '24px',
};

const cardStyle = {
  width: '100%',
  maxWidth: '440px',
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
  gap: '18px',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
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
