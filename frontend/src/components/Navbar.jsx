import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, User } from 'lucide-react';

const Navbar = ({ toggleMobileSidebar, isCollapsed, toggleDesktopSidebar, pageTitle = "Dashboard" }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('meetmind_theme') || 'light';
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Sync theme with DOM on mount
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('meetmind_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Read current user
    const savedUser = localStorage.getItem('meetmind_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const getInitials = () => {
    if (!user || !user.username) return 'U';
    return user.username.substring(0, 2).toUpperCase();
  };

  // Show toggle button on mobile always, on desktop only when sidebar is collapsed
  const [showToggle, setShowToggle] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setShowToggle(window.innerWidth < 1024 || isCollapsed);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  return (
    <header className="glass-panel" style={navbarStyle}>
      <div style={leftSectionStyle}>
        {showToggle && (
          <button 
            onClick={window.innerWidth < 1024 ? toggleMobileSidebar : toggleDesktopSidebar} 
            style={menuBtnStyle}
            className="mobile-toggle-btn btn-secondary"
            title="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <h2 style={titleStyle}>{pageTitle}</h2>
      </div>
      
      <div style={rightSectionStyle}>
        {/* Dark/Light mode toggle */}
        <button onClick={toggleTheme} style={themeBtnStyle} className="btn-secondary">
          {theme === 'dark' ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="var(--text-secondary)" />}
        </button>
        
        {/* User avatar/profile info */}
        <div style={profileStyle} onClick={() => navigate('/profile')}>
          <div style={avatarStyle}>
            {user ? getInitials() : <User size={16} />}
          </div>
          <span className="navbar-username" style={usernameStyle}>{user ? user.username : 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

// Inline Styles for Navbar
const navbarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 24px',
  height: '70px',
  marginBottom: '24px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
};

const leftSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const menuBtnStyle = {
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  background: 'var(--bg-elevated)',
  cursor: 'pointer',
  display: 'flex',
};

const titleStyle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const rightSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const themeBtnStyle = {
  padding: '8px',
  borderRadius: '8px',
  border: '1px solid var(--border-light)',
  background: 'var(--bg-elevated)',
  cursor: 'pointer',
  display: 'flex',
  outline: 'none',
};

const profileStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  transition: 'all 0.2s',
};

const avatarStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'var(--accent-purple)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.85rem',
  fontWeight: '700',
};

const usernameStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: 'var(--text-primary)',
};
