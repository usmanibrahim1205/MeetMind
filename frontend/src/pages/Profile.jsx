import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, ShieldCheck, Save } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const Profile = () => {
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial fetch of profile details
    const savedUser = JSON.parse(localStorage.getItem('meetmind_user') || '{}');
    if (savedUser.username) {
      setUsername(savedUser.username);
      setEmail(savedUser.email);
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      showToast('Username and email cannot be empty.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/me', { username, email });
      localStorage.setItem('meetmind_user', JSON.stringify(response.data));
      showToast('Profile details updated successfully.', 'success');
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to update profile details.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/me', {
        current_password: currentPassword,
        new_password: newPassword
      });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to change password. Make sure current password is correct.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={pageTitleStyle}>My Profile</h1>
      <p style={pageSubStyle}>Update your account details and manage credentials.</p>

      <div style={twoColStyle}>
        {/* Profile Card */}
        <div className="glass-panel" style={formCardStyle}>
          <h2 style={formTitleStyle}>
            <User size={18} color="var(--accent-purple)" />
            <span>Profile Details</span>
          </h2>
          <form onSubmit={handleUpdateProfile} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Username</label>
              <div style={inputWrapperStyle}>
                <User size={18} style={iconStyle} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={saveBtnStyle}
              disabled={loading}
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {/* Password Management Card */}
        <div className="glass-panel" style={formCardStyle}>
          <h2 style={formTitleStyle}>
            <Lock size={18} color="var(--accent-purple)" />
            <span>Security Credentials</span>
          </h2>
          <form onSubmit={handleUpdatePassword} style={formStyle}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Current Password</label>
              <div style={inputWrapperStyle}>
                <Lock size={18} style={iconStyle} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>New Password</label>
              <div style={inputWrapperStyle}>
                <ShieldCheck size={18} style={iconStyle} />
                <input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={inputWrapperStyle}>
                <Lock size={18} style={iconStyle} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '44px' }}
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={saveBtnStyle}
              disabled={loading}
            >
              <Save size={16} />
              <span>{loading ? 'Changing Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

// Profile Page Styles
const containerStyle = {
  width: '100%',
};

const pageTitleStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  marginBottom: '4px',
  color: 'var(--text-primary)',
};

const pageSubStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
  marginBottom: '32px',
};

const twoColStyle = {
  display: 'flex',
  gap: '48px',
  flexWrap: 'wrap',
};

const formCardStyle = {
  flex: '1 1 300px',
  padding: '32px 0px',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  border: 'none',
};

const formTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-primary)',
  gap: '8px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-light)',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  flexGrow: 1,
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
};

const saveBtnStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '0.9rem',
  marginTop: 'auto',
  paddingTop: '12px',
};
