import React from 'react';

/**
 * Reusable accessible loading spinner for suspense fallbacks and asynchronous components.
 */
const LoadingSpinner = ({ text = 'Loading content...', fullScreen = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: fullScreen ? '70vh' : '200px',
        padding: '2.5rem',
        gap: '0.85rem',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.08)',
          borderTopColor: 'var(--primary-500)',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
        {text}
      </p>
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          border: 0,
        }}
      >
        Loading
      </span>
    </div>
  );
};

export default LoadingSpinner;
