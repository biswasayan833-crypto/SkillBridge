import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto 5rem', textAlign: 'center' }}>
      <div className="card" style={{ padding: '3.5rem 2rem' }}>
        <h1
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            lineHeight: 1,
            margin: '0 0 1rem',
            background: 'linear-gradient(135deg, var(--primary-400) 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link to="/" className="btn btn-primary" style={{ padding: '0.7rem 1.5rem' }}>
          &larr; Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
