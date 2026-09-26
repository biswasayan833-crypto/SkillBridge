import React from 'react';
import { Link } from 'react-router-dom';

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

  return (
    <article
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '1.5rem',
      }}
    >
      <div>
        {/* Top Company & Meta Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '0.75rem',
            marginBottom: '0.6rem',
          }}
        >
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.01em',
            }}
          >
            {company}
          </span>

          {applicationDeadline && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              Deadline: {new Date(applicationDeadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Opportunity Title */}
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            marginBottom: '0.45rem',
            color: 'var(--text-primary)',
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>

        {/* Location & Work Mode Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
          }}
        >
          {location && <span>{location}</span>}
          {location && workMode && <span style={{ opacity: 0.4 }}>•</span>}
          {workMode && (
            <span style={{ textTransform: 'capitalize' }}>
              {workMode}
            </span>
          )}
          {type && (
            <>
              <span style={{ opacity: 0.4 }}>•</span>
              <span
                style={{
                  textTransform: 'capitalize',
                  color: 'var(--primary-400)',
                }}
              >
                {type}
              </span>
            </>
          )}
        </div>

        {/* Compensation Tag */}
        {(stipend || salary) && (
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}
          >
            {stipend ? `Stipend: ${stipend}` : `Salary: ${salary}`}
          </div>
        )}

        {/* Skills List */}
        {skills && skills.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.35rem',
              marginBottom: '1rem',
            }}
          >
            {skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.6875rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 500,
                }}
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  alignSelf: 'center',
                  padding: '0.15rem 0.35rem',
                }}
              >
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          marginTop: '0.75rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Link
          to={`/opportunities/${_id}`}
          className="btn btn-outline btn-sm"
          style={{ width: '100%' }}
        >
          View Details &rarr;
        </Link>
      </div>
    </article>
  );
};

export default OpportunityCard;
