import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, User, Settings, LogOut, Video, ChevronLeft } from 'lucide-react';

const Sidebar = ({ isMobileOpen, toggleMobileSidebar, isCollapsed, toggleDesktopSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('meetmind_token');
    localStorage.removeItem('meetmind_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Upload Meeting', path: '/upload', icon: <UploadCloud size={20} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div style={overlayStyle} onClick={toggleMobileSidebar} />
      )}
      
      <div 
        className="glass-panel sidebar-container"
        style={{
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-light)',
        }}
      >
        {/* Brand Logo Header container */}
        <div style={brandHeaderContainerStyle}>
          <div style={brandStyle} onClick={() => navigate('/dashboard')}>
            <div style={logoIconStyle}>
              <Video size={22} color="#ffffff" />
            </div>
            <span style={brandNameStyle}>MeetMind</span>
          </div>
          
          {/* Collapse Button for Desktop */}
          <button 
            onClick={toggleDesktopSidebar} 
            style={collapseBtnStyle}
            title="Collapse Sidebar"
            className="btn-secondary"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation list */}
        <nav style={navStyle}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={isMobileOpen ? toggleMobileSidebar : undefined}
              style={({ isActive }) => ({
                ...linkStyle,
                background: isActive ? 'var(--accent-purple)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '400',
                border: 'none',
              })}
              className="sidebar-link-hover"
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Logout action */}
        <div style={footerStyle}>
          <button onClick={handleLogout} style={logoutBtnStyle}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

// Inline styles for Sidebar sub-components
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  zIndex: 999,
};

const brandHeaderContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  width: '100%',
};

const brandStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
};

const logoIconStyle = {
  background: 'var(--accent-purple)',
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const brandNameStyle = {
  fontSize: '1.4rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
};

const collapseBtnStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
};

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flexGrow: 1,
};

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontSize: '0.95rem',
  transition: 'all 0.2s ease',
};

const footerStyle = {
  paddingTop: '16px',
  borderTop: '1px solid var(--border-light)',
};

const logoutBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-light)',
  background: 'rgba(239, 68, 68, 0.05)',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '600',
  transition: 'all 0.2s',
  outline: 'none',
};
