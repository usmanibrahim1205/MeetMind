import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadMeeting from './pages/UploadMeeting';
import MeetingDetails from './pages/MeetingDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

// Protected Route Wrapper
const ProtectedRoute = ({ children, pageTitle }) => {
  const token = localStorage.getItem('meetmind_token');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('meetmind_sidebar_collapsed') === 'true';
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    localStorage.setItem('meetmind_sidebar_collapsed', String(nextVal));
  };

  return (
    <div 
      className={`app-container ${isMobileSidebarOpen ? 'sidebar-mobile-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={appContainerStyle}
    >
      {/* Sidebar Navigation */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        toggleMobileSidebar={toggleMobileSidebar} 
        isCollapsed={isSidebarCollapsed}
        toggleDesktopSidebar={toggleDesktopSidebar}
      />
      
      {/* Main Content Area */}
      <div className="app-main-layout" style={mainContentWrapperStyle}>
        <Navbar 
          toggleMobileSidebar={toggleMobileSidebar} 
          isCollapsed={isSidebarCollapsed}
          toggleDesktopSidebar={toggleDesktopSidebar}
          pageTitle={pageTitle}
        />
        <main style={{ flexGrow: 1, paddingBottom: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  // Sync theme with DOM on app load (default to light mode)
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('meetmind_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute pageTitle="Dashboard">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute pageTitle="Upload Recording">
                <UploadMeeting />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meetings/:id" 
            element={
              <ProtectedRoute pageTitle="Meeting Details">
                <MeetingDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute pageTitle="My Profile">
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute pageTitle="Settings">
                <Settings />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;

// Layout Styling
const appContainerStyle = {
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  background: 'var(--bg-body)',
};

const mainContentWrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  width: '100%',
  padding: '24px',
  transition: 'margin-left var(--transition-normal)',
};
