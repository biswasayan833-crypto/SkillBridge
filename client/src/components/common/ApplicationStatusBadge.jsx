import React from 'react';

/**
 * Reusable badge component displaying application status with restrained, editorial styling.
 * Supported statuses: 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'
 */
const STATUS_CONFIG = {
  'Applied': {
    bg: 'var(--status-applied-bg)',
    color: '#93c5fd',
    border: 'var(--status-applied-border)',
    dot: '#3b82f6',
  },
  'Under Review': {
    bg: 'var(--status-under-review-bg)',
    color: '#fde68a',
    border: 'var(--status-under-review-border)',
    dot: '#f59e0b',
  },
  'Shortlisted': {
    bg: 'var(--status-shortlisted-bg)',
    color: '#ddd6fe',
    border: 'var(--status-shortlisted-border)',
    dot: '#8b5cf6',
  },
  'Interview': {
    bg: 'var(--status-interview-bg)',
    color: '#c7d2fe',
    border: 'var(--status-interview-border)',
    dot: '#6366f1',
  },
  'Selected': {
    bg: 'var(--status-selected-bg)',
    color: '#a7f3d0',
    border: 'var(--status-selected-border)',
    dot: '#10b981',
  },
  'Rejected': {
    bg: 'var(--status-rejected-bg)',
    color: '#fca5a5',
    border: 'var(--status-rejected-border)',
    dot: '#ef4444',
  },
};

const ApplicationStatusBadge = ({ status }) => {
  const normalizedStatus = status || 'Applied';
  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG['Applied'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.2rem 0.55rem',
        fontSize: '0.6875rem',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        border: `1px solid ${config.border}`,
        backgroundColor: config.bg,
        color: config.color,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {normalizedStatus}
    </span>
  );
};

export default ApplicationStatusBadge;
