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
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading opportunity details...</p>
      </div>
    );
  }

  if (errorMessage || !opportunity) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: 'var(--danger-text)', marginBottom: '0.5rem' }}>Opportunity Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
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
    <div style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/opportunities" className="btn btn-secondary btn-sm">
          &larr; Back to Opportunities
        </Link>
      </div>

      {/* Main Opportunity Header Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2.25rem', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
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
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'capitalize',
                  }}
                >
                  {workMode}
                </span>
              )}
              {!isActive && (
                <span className="badge badge-warning">Inactive</span>
              )}
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {title}
            </h1>

            <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>
              🏢 {company} {location && <span style={{ color: 'var(--text-muted)' }}>• 📍 {location}</span>}
            </p>
          </div>

          {/* Quick Compensation & Deadline Box */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              minWidth: '220px',
            }}
          >
            {(stipend || salary) && (
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Compensation
                </span>
                <div style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '1rem', marginTop: '0.15rem' }}>
                  💰 {stipend ? `Stipend: ${stipend}` : `Salary: ${salary}`}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
                Deadline
              </span>
              <div style={{ fontWeight: 600, color: isDeadlinePassed ? 'var(--danger-text)' : 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.15rem' }}>
                📅 {applicationDeadline ? new Date(applicationDeadline).toLocaleDateString() : 'Rolling Application'}
                {isDeadlinePassed && <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--danger-text)' }}>(Deadline Passed)</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Skills Required */}
        {skills && skills.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
              Required Competencies
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
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

      {/* Description & Eligibility Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2.25rem', border: '1px solid var(--border-subtle)' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.25rem' }}>
          Role Description
        </h3>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: '2.25rem' }}>
          {description}
        </div>

        {eligibility && (
          <>
            <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1rem', fontSize: '1.25rem' }}>
              Eligibility Criteria
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {eligibility}
            </p>
          </>
        )}
      </div>

      {/* Application Call to Action Section */}
      <div className="card" style={{ padding: '2.25rem', border: '1px solid var(--border-highlight)' }}>
        <h3 style={{ marginBottom: '0.85rem', fontSize: '1.3rem' }}>Submit Your Application</h3>

        {/* Guest View */}
        {!isAuthenticated && (
          <div
            style={{
              padding: '1.75rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <p style={{ marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Interested in this position? Sign in or register as a student to submit your resume and cover letter.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                Sign In to Apply &rarr;
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.65rem 1.5rem' }}>
                Register as Student
              </Link>
            </div>
          </div>
        )}

        {/* Recruiter / Admin Notice */}
        {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') && (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--info-text)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              ℹ️ <strong>Recruiter Notice:</strong> Applications can only be submitted by student accounts.
              Review candidate submissions for this listing in{' '}
              <Link to={`/recruiter/opportunities/${_id}/applicants`} style={{ fontWeight: 600, color: '#93c5fd', textDecoration: 'underline' }}>
                Manage Applicants
              </Link>.
            </p>
          </div>
        )}

        {/* Student Application View */}
        {isAuthenticated && user?.role === 'student' && (
          <div>
            {isDeadlinePassed ? (
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--warning-bg)',
                  border: '1px solid var(--warning-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--warning-text)',
                }}
              >
                ⚠️ <strong>Applications Closed:</strong> The deadline for this opportunity was{' '}
                {new Date(applicationDeadline).toLocaleDateString()}. New submissions are no longer accepted.
              </div>
            ) : !showApplyForm ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Click below to submit your profile resume and an optional tailored cover letter to the hiring team.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => setShowApplyForm(true)}
                >
                  Apply for this Role &rarr;
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Applying for: {title} at {company}
                  </p>
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
                    // Success state handled inside ApplicationForm
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityDetailPage;
