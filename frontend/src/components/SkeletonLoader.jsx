import React from 'react';

// Stat Card Skeleton
export const StatsSkeleton = () => {
  return (
    <div style={statsGridStyle}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-panel" style={cardStyle}>
          <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '8px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '60%', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '40%', height: '24px' }} />
        </div>
      ))}
    </div>
  );
};

// Meeting List Table Skeleton
export const TableSkeleton = () => {
  return (
    <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div className="skeleton-box" style={{ width: '200px', height: '20px', marginBottom: '24px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
            <div className="skeleton-box" style={{ width: '30%', height: '16px' }} />
            <div className="skeleton-box" style={{ width: '20%', height: '16px' }} />
            <div className="skeleton-box" style={{ width: '15%', height: '16px' }} />
            <div className="skeleton-box" style={{ width: '20%', height: '16px' }} />
            <div className="skeleton-box" style={{ width: '15%', height: '16px' }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Meeting Details Skeleton
export const DetailsSkeleton = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="skeleton-box" style={{ width: '50%', height: '28px', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton-box" style={{ width: '100px', height: '16px' }} />
          <div className="skeleton-box" style={{ width: '80px', height: '16px' }} />
          <div className="skeleton-box" style={{ width: '120px', height: '16px' }} />
        </div>
      </div>
      <div style={twoColStyle}>
        <div className="glass-panel" style={{ padding: '24px', flex: 2, background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div className="skeleton-box" style={{ width: '150px', height: '20px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '95%', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '92%', height: '14px', marginBottom: '24px' }} />
          
          <div className="skeleton-box" style={{ width: '180px', height: '20px', marginBottom: '16px' }} />
          <div className="skeleton-box" style={{ width: '85%', height: '14px', marginBottom: '8px' }} />
          <div className="skeleton-box" style={{ width: '70%', height: '14px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="skeleton-box" style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[1, 2, 3, 4].map((x) => (
                <div key={x} className="skeleton-box" style={{ width: '60px', height: '22px', borderRadius: '12px' }} />
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div className="skeleton-box" style={{ width: '120px', height: '18px', marginBottom: '16px' }} />
            <div className="skeleton-box" style={{ width: '50px', height: '22px', borderRadius: '12px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '90%', height: '12px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '24px',
  marginBottom: '32px'
};

const cardStyle = {
  padding: '24px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-lg)'
};

const twoColStyle = {
  display: 'flex',
  gap: '24px',
  flexWrap: 'wrap'
};
