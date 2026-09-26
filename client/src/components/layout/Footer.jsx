import React from 'react';

const Footer = () => {
  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', padding: '1.75rem 0' }}>
      <div className="container footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19L12 5L20 19" />
              <path d="M7.5 13H16.5" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontSize: '0.925rem' }}>
            SkillBridge
          </span>
          <span style={{ color: 'var(--border-default)' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            Internship & Career Management Platform
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
            &copy; {new Date().getFullYear()} SkillBridge Platform. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
