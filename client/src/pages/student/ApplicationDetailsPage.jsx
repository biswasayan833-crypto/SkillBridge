import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';

const STAGES = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected'];

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await applicationService.getApplicationById(id);
        if (res.success && res.data) {
          setApplication(res.data);
        } else {
          setErrorMessage('Application could not be found.');
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load application details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchApplication();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '3rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>Loading application details...</p>
      </div>
    );
  }

  if (errorMessage || !application) {
    return (
      <div style={{ maxWidth: '860px', margin: '3rem auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
          }}
        >
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Application Not Found
          </h3>
          <p style={{ color: 'var(--danger-text)', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
            {errorMessage || 'This application does not exist or you do not have permission to view it.'}
          </p>
          <Link to="/student/applications" className="btn btn-secondary">
            &larr; Back to My Applications
          </Link>
        </div>
      </div>
    );
  }

  const { opportunity = {}, status, appliedAt, statusUpdatedAt, coverLetter } = application;

  const currentStageIndex = STAGES.indexOf(status);
  const isRejected = status === 'Rejected';

  return (
    <div style={{ maxWidth: '860px', margin: '1.5rem auto 3.5rem' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/student/applications"
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
        >
          &larr; Back to My Applications
        </Link>
      </div>

      {/* Main Status & Header Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary-400)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              Application Record
            </span>
            <h1 style={{ fontSize: '1.875rem', margin: '0.25rem 0 0.4rem 0', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {opportunity.title || 'Opportunity'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {opportunity.company}{' '}
              {opportunity.location && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>• {opportunity.location}</span>
              )}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.4rem' }}>
              <ApplicationStatusBadge status={status} />
            </div>
            {statusUpdatedAt && (
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block' }}>
                Updated: {new Date(statusUpdatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Opportunity Summary Badges */}
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {opportunity.type && (
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              {opportunity.type}
            </span>
          )}
          {opportunity.workMode && (
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                textTransform: 'capitalize',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {opportunity.workMode}
            </span>
          )}
          {(opportunity.stipend || opportunity.salary) && (
            <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 500 }}>
              {opportunity.stipend ? `Stipend: ${opportunity.stipend}` : `Salary: ${opportunity.salary}`}
            </span>
          )}
        </div>
      </div>

      {/* Visual Application Stepper Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.75rem 2rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1.5rem 0' }}>
          Hiring Pipeline Progression
        </h3>

        {/* 5-Stage Stepper Bar */}
        <div style={{ position: 'relative', marginBottom: isRejected ? '1.5rem' : '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {/* Background Connector Line */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                right: '20px',
                height: '2px',
                backgroundColor: 'var(--border-subtle)',
                zIndex: 0,
              }}
            />

            {/* Active Connector Progress Line */}
            {!isRejected && currentStageIndex >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '20px',
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 92}%`,
                  height: '2px',
                  backgroundColor: 'var(--primary-500)',
                  zIndex: 0,
                  transition: 'width 0.3s ease',
                }}
              />
            )}

            {STAGES.map((stage, idx) => {
              const isPassed = !isRejected && currentStageIndex > idx;
              const isCurrent = !isRejected && currentStageIndex === idx;

              return (
                <div
                  key={stage}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    minWidth: '65px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      margin: '0 auto 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      backgroundColor: isPassed
                        ? 'var(--primary-600)'
                        : isCurrent
                        ? '#0A0E14'
                        : 'var(--bg-card)',
                      border: `2px solid ${
                        isPassed
                          ? 'var(--primary-500)'
                          : isCurrent
                          ? 'var(--primary-400)'
                          : 'var(--border-subtle)'
                      }`,
                      color: isPassed
                        ? '#FFFFFF'
                        : isCurrent
                        ? 'var(--primary-400)'
                        : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent
                        ? 'var(--text-primary)'
                        : isPassed
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)',
                      display: 'block',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal Rejected Banner if status is Rejected */}
        {isRejected && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: 'var(--danger-text)', fontSize: '0.875rem' }}>
                Application Concluded (Rejected)
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                The employer has reviewed this application and selected not to advance this candidate at this time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submission Timestamps & Cover Letter */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          Application Details
        </h3>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Submitted On
            </span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
              {appliedAt ? `${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}` : 'N/A'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Original Posting
            </span>
            {opportunity._id ? (
              <Link
                to={`/opportunities/${opportunity._id}`}
                style={{ fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.925rem' }}
              >
                View Original Listing &rarr;
              </Link>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Archived</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cover Letter / Submitted Statement
          </span>
          {coverLetter ? (
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              {coverLetter}
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              No cover letter was included with this application.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;
