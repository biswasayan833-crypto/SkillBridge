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
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading application details...</p>
      </div>
    );
  }

  if (errorMessage || !application) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            backgroundColor: 'var(--danger-bg)',
            borderColor: 'var(--danger-border)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '0.5rem', fontWeight: 700 }}>
            Application Not Found
          </h3>
          <p style={{ color: 'var(--danger-text)', marginBottom: '1.5rem' }}>
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
    <div style={{ maxWidth: '850px', margin: '1.5rem auto 3rem' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/student/applications"
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.875rem' }}
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
                fontSize: '0.8rem',
                color: 'var(--primary-400)',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              Applied Opportunity
            </span>
            <h1 style={{ fontSize: '2rem', margin: '0.25rem 0 0.5rem 0', fontWeight: 800 }}>
              {opportunity.title || 'Opportunity'}
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
              {opportunity.company}{' '}
              {opportunity.location && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>• {opportunity.location}</span>
              )}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <ApplicationStatusBadge status={status} />
            </div>
            {statusUpdatedAt && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                Status updated: {new Date(statusUpdatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Opportunity Summary Badges */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                textTransform: 'capitalize',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {opportunity.workMode}
            </span>
          )}
          {(opportunity.stipend || opportunity.salary) && (
            <span style={{ fontSize: '0.875rem', color: 'var(--success-text)', fontWeight: 600 }}>
              💰 {opportunity.stipend ? `Stipend: ${opportunity.stipend}` : `Salary: ${opportunity.salary}`}
            </span>
          )}
        </div>
      </div>

      {/* Visual Application Stepper Card */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>
          Application Progress Funnel
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
                top: '18px',
                left: '20px',
                right: '20px',
                height: '3px',
                backgroundColor: 'var(--border-subtle)',
                zIndex: 0,
              }}
            />

            {/* Active Connector Progress Line */}
            {!isRejected && currentStageIndex >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '18px',
                  left: '20px',
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 92}%`,
                  height: '3px',
                  background: 'linear-gradient(90deg, var(--primary-500), #06b6d4)',
                  zIndex: 0,
                  transition: 'width 0.4s ease',
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
                    minWidth: '70px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      margin: '0 auto 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      backgroundColor: isPassed
                        ? 'var(--primary-600)'
                        : isCurrent
                        ? '#0a0e17'
                        : 'var(--bg-overlay)',
                      border: `2px solid ${
                        isPassed
                          ? 'var(--primary-500)'
                          : isCurrent
                          ? '#06b6d4'
                          : 'var(--border-subtle)'
                      }`,
                      color: isPassed
                        ? '#ffffff'
                        : isCurrent
                        ? '#06b6d4'
                        : 'var(--text-muted)',
                      boxShadow: isCurrent ? '0 0 16px rgba(6, 182, 212, 0.4)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 500,
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
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🛑</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger-text)', fontSize: '0.925rem' }}>
                Application Concluded (Rejected)
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                The employer reviewed this application and decided not to proceed further at this time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submission Timestamps & Cover Letter */}
      <div className="card" style={{ padding: '2rem' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          Application Details
        </h3>

        <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Submitted On
            </span>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {appliedAt ? `${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}` : 'N/A'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Original Posting
            </span>
            {opportunity._id ? (
              <Link
                to={`/opportunities/${opportunity._id}`}
                style={{ fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none', fontSize: '0.95rem' }}
              >
                View Original Listing &rarr;
              </Link>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Archived</span>
            )}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Cover Letter / Submitted Statement
          </span>
          {coverLetter ? (
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: 'var(--bg-overlay)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                fontSize: '0.925rem',
              }}
            >
              {coverLetter}
            </div>
          ) : (
            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>
              No cover letter was included with this application.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPage;
