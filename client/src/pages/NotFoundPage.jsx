import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ maxWidth: '460px', margin: '4.5rem auto 5rem', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3.5rem 2rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1,
            margin: '0 0 1rem',
            color: 'var(--primary-400)',
            letterSpacing: '-0.04em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          404
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
          The requested route does not exist or has been relocated within the platform.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}>
          &larr; Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
