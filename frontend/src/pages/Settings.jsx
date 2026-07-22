import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Sun, Moon, ShieldAlert } from 'lucide-react';
import { useToast } from '../components/Toast';
import api from '../services/api';
import ConfirmationDialog from '../components/ConfirmationDialog';

const Settings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [theme, setTheme] = useState(() => localStorage.getItem('meetmind_theme') || 'light');
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('meetmind_theme', theme);
  }, [theme]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    
    // Clean up any stale keys
    localStorage.removeItem('meetmind_custom_openai_key');
    localStorage.removeItem('meetmind_custom_gemini_key');
    localStorage.removeItem('meetmind_ai_provider');

    showToast('Application preferences saved successfully.', 'success');
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/me');
      showToast('Your account has been permanently deleted.', 'success');
      
      // Clear token & user credentials
      localStorage.removeItem('meetmind_token');
      localStorage.removeItem('meetmind_user');
      
      // Redirect to onboarding
      navigate('/register');
    } catch (error) {
      showToast('Failed to delete account. Please try again.', 'error');
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={pageTitleStyle}>Settings</h1>
      <p style={pageSubStyle}>Manage your application preferences and color theme.</p>

      <div style={formLayoutStyle}>
        <div style={{ maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Preferences Settings */}
          <form onSubmit={handleSaveSettings} className="glass-panel" style={cardStyle}>
            <h2 style={cardTitleStyle}>
              <SettingsIcon size={18} color="var(--status-info)" />
              <span>Theme Preferences</span>
            </h2>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Color Theme</label>
              <div style={themeToggleGroupStyle}>
                <button 
                  type="button" 
                  onClick={() => setTheme('light')} 
                  style={themeTabStyle(theme === 'light')}
                >
                  <Sun size={18} />
                  <span>Light Mode</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setTheme('dark')} 
                  style={themeTabStyle(theme === 'dark')}
                >
                  <Moon size={18} />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>
            
            <div style={submitContainerStyle}>
              <button type="submit" className="btn btn-primary" style={saveBtnStyle}>
                Save Preferences
              </button>
            </div>
          </form>

          {/* Danger Zone Settings */}
          <div className="glass-panel" style={cardStyle}>
            <h2 style={{ ...cardTitleStyle, borderBottom: '1px solid rgba(239, 68, 68, 0.15)', color: 'var(--status-danger)' }}>
              <ShieldAlert size={18} color="var(--status-danger)" />
              <span>Danger Zone</span>
            </h2>

            <div style={inputGroupStyle}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Permanently delete your account and all associated meetings, transcripts, and AI reports. This action cannot be undone.
              </p>
              <button 
                type="button" 
                onClick={() => setDeleteOpen(true)} 
                className="btn" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  color: 'var(--status-danger)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  width: 'fit-content', 
                  marginTop: '12px',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={deleteOpen}
        title="Delete Account Permanently?"
        message="Are you sure you want to delete your account? This is irreversible and will immediately wipe all your meetings logs, whisper speech transcripts, and summaries from our system."
        confirmText="Permanently Delete My Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default Settings;

// Settings Styles
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

const formLayoutStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const cardStyle = {
  padding: '32px 0px',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  border: 'none',
};

const cardTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-primary)',
  gap: '8px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border-light)',
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

const themeToggleGroupStyle = {
  display: 'flex',
  gap: '10px',
};

const themeTabStyle = (active) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  border: active ? '1px solid var(--accent-purple)' : '1px solid var(--border-light)',
  background: active ? 'rgba(109, 74, 255, 0.08)' : 'var(--bg-elevated)',
  color: active ? 'var(--accent-purple)' : 'var(--text-primary)',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  outline: 'none',
});

const submitContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const saveBtnStyle = {
  padding: '14px 28px',
  fontSize: '0.95rem',
};
