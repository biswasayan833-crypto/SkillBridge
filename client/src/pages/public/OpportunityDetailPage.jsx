import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import opportunityService from '../../services/opportunityService';
import { useAuth } from '../../context/AuthContext';
import ApplicationForm from '../../components/applications/ApplicationForm';

const OpportunityDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await opportunityService.getOpportunityById(id);
        if (res.success && res.data) {
          setOpportunity(res.data);
        } else {
          setErrorMessage('Opportunity details could not be found.');
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load opportunity details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading opportunity details...</p>
      </div>
    );
  }

  if (errorMessage || !opportunity) {
    return (
      <div style={{ maxWidth: '640px', margin: '4rem auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--danger-border)',
          }}
        >
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Opportunity Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {errorMessage || 'This opportunity may have been removed or is no longer publicly active.'}
          </p>
          <Link to="/opportunities" className="btn btn-secondary">
            &larr; Back to All Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const {
    _id,
    title,
    company,
    description,
    type,
    workMode,
    location,
    skills = [],
    stipend,
    salary,
    eligibility,
    applicationDeadline,
    isActive,
  } = opportunity;

  const isDeadlinePassed = applicationDeadline ? new Date() > new Date(applicationDeadline) : false;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/opportunities" className="btn btn-secondary btn-sm">
          &larr; Back to Opportunities
        </Link>
      </div>

      {/* Editorial Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* =================================================================
            LEFT COLUMN: Editorial Role Details
            ================================================================= */}
        <div style={{ minWidth: 0 }}>
          {/* Header Block */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--primary-400)',
                  textTransform: 'capitalize',
                }}
              >
                {type || 'Opportunity'}
              </span>
              {workMode && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {workMode}
                  </span>
                </>
              )}
              {!isActive && (
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>
                  Inactive
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                lineHeight: 1.25,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </h1>

            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>
              {company} {location && <span style={{ color: 'var(--text-muted)' }}>• {location}</span>}
            </p>
          </div>

          {/* Description Block */}
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              marginBottom: '1.5rem',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
              }}
            >
              Role Overview
            </h3>
            <div
              style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                fontSize: '0.9375rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {description}
            </div>
          </div>

          {/* Eligibility Block (if present) */}
          {eligibility && (
            <div
              style={{
                padding: '2rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '1.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                }}
              >
                Candidate Eligibility
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  fontSize: '0.9375rem',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}
              >
                {eligibility}
              </p>
            </div>
          )}

          {/* Skills Required Block */}
          {skills && skills.length > 0 && (
            <div
              style={{
                padding: '2rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '1.5rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '1rem',
                }}
              >
                Required Competencies
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =================================================================
            RIGHT COLUMN: Sidebar / Apply Panel (Sticky on Desktop)
            ================================================================= */}
        <aside
          style={{
            position: 'sticky',
            top: '4.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Key Facts Summary Card */}
          <div
            style={{
              padding: '1.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <h4
              style={{
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              Opportunity Summary
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role Type</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {type || 'Internship'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Work Arrangement</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {workMode || 'Not specified'}
                </div>
              </div>

              {location && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {location}
                  </div>
                </div>
              )}

              {(stipend || salary) && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compensation</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success-text)' }}>
                    {stipend ? `Stipend: ${stipend}` : `Salary: ${salary}`}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Application Deadline</div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isDeadlinePassed ? 'var(--danger-text)' : 'var(--text-primary)',
                  }}
                >
                  {applicationDeadline ? new Date(applicationDeadline).toLocaleDateString() : 'Rolling Application'}
                  {isDeadlinePassed && <span style={{ display: 'block', fontSize: '0.75rem' }}>(Deadline Passed)</span>}
                </div>
              </div>
            </div>

            {/* Application CTA within Sidebar */}
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              {!isAuthenticated ? (
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                    Sign in to submit your verified profile and resume.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                    Sign In to Apply &rarr;
                  </Link>
                </div>
              ) : isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <p style={{ marginBottom: '0.65rem' }}>
                    You are logged in as an employer. Manage this opportunity and view candidate submissions.
                  </p>
                  <Link
                    to={`/recruiter/opportunities/${_id}/applicants`}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                  >
                    View Applicants &rarr;
                  </Link>
                </div>
              ) : isAuthenticated && user?.role === 'student' ? (
                <div>
                  {isDeadlinePassed ? (
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--warning-text)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Applications closed on {new Date(applicationDeadline).toLocaleDateString()}.
                    </div>
                  ) : !showApplyForm ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                      onClick={() => setShowApplyForm(true)}
                    >
                      Apply for this Role &rarr;
                    </button>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Statement</span>
                        <button
                          type="button"
                          onClick={() => setShowApplyForm(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <ApplicationForm
                        opportunityId={_id}
                        onSuccess={() => {
                          // Handled inside ApplicationForm
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default OpportunityDetailPage;
