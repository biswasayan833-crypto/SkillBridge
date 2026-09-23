import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🌉</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SkillBridge
          </span>
          <span style={{ color: 'var(--text-subtle)' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Internship & Career Management Platform
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            SkillBridge Platform
          </span>
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} SkillBridge. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};


export default Footer;
