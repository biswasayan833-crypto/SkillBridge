import React from 'react';
import { Link } from 'react-router-dom';

const TYPE_CONFIG = {
  'internship': { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.3)' },
  'full-time': { bg: 'rgba(16, 185, 129, 0.15)', text: '#a7f3d0', border: 'rgba(16, 185, 129, 0.3)' },
  'part-time': { bg: 'rgba(245, 158, 11, 0.15)', text: '#fde68a', border: 'rgba(245, 158, 11, 0.3)' },
  'contract': { bg: 'rgba(139, 92, 246, 0.15)', text: '#ddd6fe', border: 'rgba(139, 92, 246, 0.3)' },
};

const OpportunityCard = ({ opportunity }) => {
  if (!opportunity) return null;

  const {
    _id,
    title,
    company,
    type,
    workMode,
    location,
    skills = [],
    stipend,
    salary,
    applicationDeadline,
  } = opportunity;

  const typeStyle = TYPE_CONFIG[type?.toLowerCase()] || {
    bg: 'rgba(255, 255, 255, 0.08)',
    text: 'var(--text-secondary)',
    border: 'var(--border-subtle)',
  };

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
      }}
    >
      <div>
        {/* Top Badges & Deadline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: typeStyle.bg,
                color: typeStyle.text,
                border: `1px solid ${typeStyle.border}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                textTransform: 'capitalize',
                letterSpacing: '0.02em',
              }}
            >
              {type || 'Opportunity'}
            </span>
            {workMode && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'capitalize',
                }}
              >
                {workMode}
              </span>
            )}
          </div>

          {applicationDeadline && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              📅 {new Date(applicationDeadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Opportunity Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '0.35rem',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>

        {/* Company & Location */}
        <p style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.925rem' }}>
          🏢 {company} {location && <span style={{ color: 'var(--text-muted)' }}>• 📍 {location}</span>}
        </p>

        {/* Compensation Tag */}
        {(stipend || salary) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.825rem',
              color: 'var(--success-text)',
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            <span>💰</span>
            <span>{stipend ? `Stipend: ${stipend}` : `Salary: ${salary}`}</span>
          </div>
        )}

        {/* Skills Tag Pills */}
        {skills && skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
            {skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', padding: '0.2rem' }}>
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
        <Link
          to={`/opportunities/${_id}`}
          className="btn btn-outline"
          style={{ width: '100%', fontSize: '0.875rem', padding: '0.55rem' }}
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};

export default OpportunityCard;
