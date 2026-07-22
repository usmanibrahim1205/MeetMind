import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Sparkles, FileDown, Search, ArrowRight, Video, Info } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(() => {
    return !sessionStorage.getItem('meetmind_showcase_dismissed');
  });

  const handleDismissNotice = () => {
    sessionStorage.setItem('meetmind_showcase_dismissed', 'true');
    setShowNotice(false);
  };

  const features = [
    {
      icon: <Mic size={24} color="var(--accent-purple)" />,
      title: "Local Speech Transcription",
      description: "Powered by a local offline faster-whisper CPU model to convert meeting recordings and audio logs into timestamps with 98% accuracy."
    },
    {
      icon: <Sparkles size={24} color="var(--status-info)" />,
      title: "Voice Speaker Diarization",
      description: "Clusters and distinguishes speakers using local voice frequency Agglomerative clustering algorithms."
    },
    {
      icon: <Search size={24} color="var(--status-success)" />,
      title: "Local NLP Summarization",
      description: "Uses a local heuristic parsing engine to extract key objectives, critical decisions, discussion points, and checkbox action items offline."
    },
    {
      icon: <FileDown size={24} color="var(--accent-purple-hover)" />,
      title: "Professional PDF Reports",
      description: "Generate beautifully formatted, corporate-ready PDF reports with summaries and action items in one click."
    }
  ];

  const steps = [
    { num: "01", title: "Upload Recording", desc: "Drag & drop your meeting MP3, WAV, or M4A audio files directly into the browser dashboard." },
    { num: "02", title: "Offline Transcription", desc: "Our local faster-whisper pipeline transcribes dialogue chronologically while diarization identifies speakers." },
    { num: "03", title: "Local NLP Analysis", desc: "Our local parser structures summaries, extracts sentiment, and creates interactive checklist action items." }
  ];

  return (
    <div style={containerStyle}>
      {/* Header Bar */}
      <header style={headerStyle}>
        <div style={logoContainerStyle} onClick={() => navigate('/')}>
          <div style={logoIconStyle}>
            <Video size={20} color="#ffffff" />
          </div>
          <span style={logoTextStyle}>MeetMind</span>
        </div>
        <div style={navLinksStyle}>
          <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ padding: '8px 16px' }}>Sign In</button>
          <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '8px 16px' }}>Sign Up</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-grid">
        <div style={heroContentStyle}>
          <div style={badgeWrapperStyle}>
            <span style={heroBadgeStyle}>⚡ Automated Meeting Intelligence</span>
          </div>
          <h1 style={heroHeadingStyle}>
            Transform meeting recordings into organized knowledge.
          </h1>
          <p style={heroSubStyle}>
            MeetMind automatically transcribes audio offline, identifies speakers, structures summaries, and extracts checkbox action items using local NLP algorithms. Focus on building, not note-taking.
          </p>
          <div style={ctaGroupStyle}>
            <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              Start for Free <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* CSS Mock Interface Illustration (wow factor, flat SaaS look) */}
        <div style={mockupContainerStyle} className="glass-panel">
          <div style={mockupHeaderStyle}>
            <div style={mockupDotsStyle}>
              <span style={{...dotStyle, background: 'var(--status-danger)'}}></span>
              <span style={{...dotStyle, background: 'var(--status-warning)'}}></span>
              <span style={{...dotStyle, background: 'var(--status-success)'}}></span>
            </div>
            <div style={mockupTitleStyle}>MeetMind Dashboard</div>
          </div>
          <div style={mockupBodyStyle}>
            <div style={mockupStatsStyle}>
              <div style={mockupCardStyle} className="glass-panel">
                <span style={mockLabelStyle}>Total Meetings</span>
                <span style={mockValStyle}>24</span>
              </div>
              <div style={mockupCardStyle} className="glass-panel">
                <span style={mockLabelStyle}>Hours Logged</span>
                <span style={mockValStyle}>12.5 hrs</span>
              </div>
              <div style={mockupCardStyle} className="glass-panel">
                <span style={mockLabelStyle}>Pending Tasks</span>
                <span style={mockValStyle}>8</span>
              </div>
            </div>
            
            <div style={mockTableStyle} className="glass-panel">
              <div style={tableHeaderRowStyle}>
                <span>Meeting Title</span>
                <span>Date</span>
                <span>Sentiment</span>
              </div>
              <div style={tableRowStyle}>
                <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>Q3 Product Planning Sync</span>
                <span>Today, 10:15 AM</span>
                <span style={posBadgeStyle}>Positive</span>
              </div>
              <div style={tableRowStyle}>
                <span style={{fontWeight: '600', color: 'var(--text-primary)'}}>DevOps Infrastructure Call</span>
                <span>Yesterday, 2:30 PM</span>
                <span style={neuBadgeStyle}>Neutral</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={featuresSectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Powerful Features for Modern Teams</h2>
          <p style={sectionSubStyle}>Everything you need to streamline post-meeting operations and keep everyone in sync.</p>
        </div>
        <div style={featuresGridStyle}>
          {features.map((f, idx) => (
            <div key={idx} className="glass-panel glass-panel-hover" style={featureCardStyle}>
              <div style={featureIconWrapperStyle}>{f.icon}</div>
              <h3 style={featureTitleStyle}>{f.title}</h3>
              <p style={featureDescStyle}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section style={howItWorksStyle} className="glass-panel">
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>How MeetMind Works</h2>
          <p style={sectionSubStyle}>From raw audio to formatted executive briefings in three simple steps.</p>
        </div>
        <div style={stepsContainerStyle}>
          {steps.map((s, idx) => (
            <div key={idx} style={stepCardStyle}>
              <div style={stepNumStyle}>{s.num}</div>
              <h3 style={stepTitleStyle}>{s.title}</h3>
              <p style={stepDescStyle}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerBottomStyle}>
          <span>&copy; {new Date().getFullYear()} Usman Ibrahim. All rights reserved.</span>
          <div style={footerLinksStyle}>
            <a href="#" style={footerLinkStyle}>Terms</a>
            <a href="#" style={footerLinkStyle}>Privacy</a>
            <a href="#" style={footerLinkStyle}>Support</a>
          </div>
        </div>
      </footer>

      {/* Developer Showcase Notice Modal */}
      {showNotice && (
        <div style={noticeOverlayStyle}>
          <div style={noticeDialogStyle} className="animate-fade-in">
            <div style={noticeHeaderStyle}>
              <Info size={22} color="var(--accent-purple)" />
              <h3 style={noticeTitleStyle}>Developer Showcase Notice</h3>
            </div>
            
            <p style={noticeBodyStyle}>
              This application is an engineering prototype developed to showcase developer capabilities in local speech-to-text processing (faster-whisper), Agglomerative voice clustering (MFCC diarization), and custom offline NLP engines. It is not a production-ready product.
            </p>
            
            <p style={noticeBodyStyle}>
              Please note: there is no real-time email verification process. Accounts are created instantly using any entered email address for testing convenience.
            </p>

            <p style={{ ...noticeBodyStyle, color: "black" }}>
              <strong>It is highly recommended to test the system with smaller audio files only, as it was developed as an offline evaluation showcase rather than a production-scale system.</strong>
            </p>
            
            <div style={noticeFooterStyle}>
              <button onClick={handleDismissNotice} className="btn btn-primary" style={noticeBtnStyle}>
                Explore Prototype
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

// Landing Page Styles
const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 24px',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '80px',
  borderBottom: '1px solid var(--border-light)',
};

const logoContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
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

const logoTextStyle = {
  fontSize: '1.25rem',
  fontWeight: '800',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const navLinksStyle = {
  display: 'flex',
  gap: '12px',
};

const heroContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  textAlign: 'left',
};

const badgeWrapperStyle = {
  marginBottom: '16px',
};

const heroBadgeStyle = {
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--accent-purple)',
  border: '1px solid var(--border-light)',
  background: 'var(--bg-card)',
};

const heroHeadingStyle = {
  fontSize: 'clamp(2.3rem, 5vw, 3.2rem)',
  fontWeight: '800',
  lineHeight: '1.15',
  color: 'var(--text-primary)',
  marginBottom: '20px',
  letterSpacing: '-0.025em',
};

const heroSubStyle = {
  fontSize: '1.05rem',
  lineHeight: '1.6',
  color: 'var(--text-secondary)',
  marginBottom: '32px',
  maxWidth: '540px',
};

const ctaGroupStyle = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
};

const mockupContainerStyle = {
  width: '100%',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  border: '1px solid var(--border-light)',
  background: 'var(--bg-card)',
};

const mockupHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 18px',
  background: 'var(--bg-elevated)',
  borderBottom: '1px solid var(--border-light)',
};

const mockupDotsStyle = {
  display: 'flex',
  gap: '6px',
  flexGrow: 1,
};

const dotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  display: 'inline-block',
};

const mockupTitleStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginRight: 'auto',
  paddingRight: '60px',
};

const mockupBodyStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const mockupStatsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
};

const mockupCardStyle = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  background: 'var(--bg-elevated)',
};

const mockLabelStyle = {
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  fontWeight: '600',
};

const mockValStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const mockTableStyle = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  background: 'var(--bg-elevated)',
};

const tableHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: 'var(--text-muted)',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--border-light)',
};

const tableRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.8rem',
  paddingBottom: '6px',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--border-light)',
};

const posBadgeStyle = {
  padding: '2px 8px',
  background: 'var(--sentiment-pos-bg)',
  color: 'var(--sentiment-pos-text)',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: '700',
};

const neuBadgeStyle = {
  padding: '2px 8px',
  background: 'var(--sentiment-neu-bg)',
  color: 'var(--sentiment-neu-text)',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: '700',
};

const featuresSectionStyle = {
  padding: '100px 0 60px',
};

const sectionHeaderStyle = {
  textAlign: 'center',
  marginBottom: '60px',
};

const sectionTitleStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  marginBottom: '16px',
  color: 'var(--text-primary)',
};

const sectionSubStyle = {
  fontSize: '1.05rem',
  color: 'var(--text-secondary)',
  maxWidth: '600px',
  margin: '0 auto',
};

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
};

const featureCardStyle = {
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  background: 'var(--bg-card)',
};

const featureIconWrapperStyle = {
  background: 'var(--bg-elevated)',
  padding: '12px',
  borderRadius: '12px',
  marginBottom: '20px',
  border: '1px solid var(--border-light)',
};

const featureTitleStyle = {
  fontSize: '1.15rem',
  fontWeight: '700',
  marginBottom: '12px',
  color: 'var(--text-primary)',
};

const featureDescStyle = {
  fontSize: '0.9rem',
  lineHeight: '1.5',
  color: 'var(--text-secondary)',
};

const howItWorksStyle = {
  padding: '60px 24px',
  marginBottom: '100px',
  background: 'var(--bg-card)',
};

const stepsContainerStyle = {
  display: 'flex',
  gap: '32px',
  flexWrap: 'wrap',
  marginTop: '40px',
};

const stepCardStyle = {
  flex: '1 1 250px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '16px',
};

const stepNumStyle = {
  fontSize: '2.5rem',
  fontWeight: '900',
  lineHeight: '1',
  marginBottom: '16px',
  color: 'var(--accent-purple)',
};

const stepTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '700',
  marginBottom: '8px',
  color: 'var(--text-primary)',
};

const stepDescStyle = {
  fontSize: '0.9rem',
  lineHeight: '1.5',
  color: 'var(--text-secondary)',
};

const footerStyle = {
  marginTop: 'auto',
  padding: '40px 0',
  borderTop: '1px solid var(--border-light)',
};

const footerBottomStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  flexWrap: 'wrap',
  gap: '16px',
};

const footerLinksStyle = {
  display: 'flex',
  gap: '24px',
};

const footerLinkStyle = {
  color: 'var(--text-muted)',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

const noticeOverlayStyle = {
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

const noticeDialogStyle = {
  width: '100%',
  maxWidth: '460px',
  background: 'var(--bg-card)',
  display: 'flex',
  flexDirection: 'column',
  padding: '28px',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xl)',
  gap: '16px',
};

const noticeHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid var(--border-light)',
  paddingBottom: '12px',
};

const noticeTitleStyle = {
  fontSize: '1.2rem',
  fontWeight: '700',
  color: 'var(--text-primary)',
};

const noticeBodyStyle = {
  fontSize: '0.92rem',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
};

const noticeFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
};

const noticeBtnStyle = {
  padding: '10px 20px',
  fontSize: '0.9rem',
};
