import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';

const ALLOWED_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
];

const ApplicantsPage = () => {
  const { id: opportunityId } = useParams();

  const [opportunityInfo, setOpportunityInfo] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusNotice, setStatusNotice] = useState({ type: '', text: '' });
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await applicationService.getOpportunityApplications(opportunityId);
      if (res.success) {
        setApplicants(res.data || []);
        if (res.opportunity) {
          setOpportunityInfo(res.opportunity);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load applicants for this opportunity.');
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingAppId(applicationId);
    setStatusNotice({ type: '', text: '' });

    try {
      const res = await applicationService.updateApplicationStatus(applicationId, newStatus);
      if (res.success) {
        setStatusNotice({
          type: 'success',
          text: `Candidate status updated to "${newStatus}".`,
        });
        // Update local applicant in state
        setApplicants((prev) =>
          prev.map((app) =>
            app._id === applicationId
              ? { ...app, status: newStatus, statusUpdatedAt: new Date().toISOString() }
              : app
          )
        );
      }
    } catch (err) {
      setStatusNotice({
        type: 'danger',
        text: err.message || 'Failed to update candidate status.',
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '1.5rem auto 3rem' }}>
      {/* Top Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/recruiter/opportunities"
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.875rem' }}
        >
          &larr; Back to My Opportunities
        </Link>
      </div>

      {/* Opportunity Overview Banner */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
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
              Candidate Review Pipeline
            </span>
            <h1 style={{ fontSize: '2rem', margin: '0.25rem 0 0.5rem 0', fontWeight: 800 }}>
              {opportunityInfo?.title || 'Opportunity'}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {opportunityInfo?.company}{' '}
              {opportunityInfo?.location && (
                <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>• {opportunityInfo.location}</span>
              )}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-300)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 700,
                fontSize: '1.15rem',
                padding: '0.45rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
              }}
            >
              {applicants.length} {applicants.length === 1 ? 'Applicant' : 'Applicants'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusNotice.text && (
        <div
          style={{
            backgroundColor: statusNotice.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: statusNotice.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${
              statusNotice.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{statusNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{statusNotice.text}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading candidates...</p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No Applicants Yet</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '440px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.6,
            }}
          >
            No candidates have submitted applications for this opportunity yet. Submissions will appear here as students apply.
          </p>
          <Link to="/recruiter/opportunities" className="btn btn-secondary">
            &larr; Back to Listings
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-overlay)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Candidate
                  </th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Academic Background
                  </th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Skills & Resume
                  </th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Cover Letter
                  </th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Applied Date
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.25rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      minWidth: '200px',
                    }}
                  >
                    API-Driven Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app) => {
                  const student = app.student || {};
                  const isUpdating = updatingAppId === app._id;

                  return (
                    <tr
                      key={app._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Candidate Name & Contact */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {student.name || 'Anonymous Student'}
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {student.email}
                        </div>
                        {student.phone && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            📞 {student.phone}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                          {student.github && (
                            <a
                              href={student.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary-400)', textDecoration: 'none' }}
                            >
                              GitHub ↗
                            </a>
                          )}
                          {student.linkedin && (
                            <a
                              href={student.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary-400)', textDecoration: 'none' }}
                            >
                              LinkedIn ↗
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Academic Background */}
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {student.college || 'College not specified'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {student.degree || 'Degree not specified'}
                        </div>
                        {student.graduationYear && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                            Class of {student.graduationYear}
                          </div>
                        )}
                      </td>

                      {/* Skills & Resume */}
                      <td style={{ padding: '1rem' }}>
                        {student.skills && student.skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                            {student.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.725rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {skill}
                              </span>
                            ))}
                            {student.skills.length > 3 && (
                              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                +{student.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {student.resume && student.resume.url ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${student.resume.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            📄 View Resume
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No Resume</span>
                        )}
                      </td>

                      {/* Cover Letter */}
                      <td style={{ padding: '1rem' }}>
                        {app.coverLetter ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setSelectedCoverLetter({ name: student.name, text: app.coverLetter })}
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Read Statement
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>

                      {/* Applied Date */}
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Status Selector */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <select
                            value={app.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(app._id, e.target.value)}
                            className="form-control"
                            style={{
                              padding: '0.45rem 0.6rem',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              cursor: isUpdating ? 'wait' : 'pointer',
                              width: '100%',
                            }}
                          >
                            {ALLOWED_STATUSES.map((st) => (
                              <option key={st} value={st} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                                {st}
                              </option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ApplicationStatusBadge status={app.status} />
                            {isUpdating && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)' }}>
                                Updating...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {selectedCoverLetter && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedCoverLetter(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '2.5rem 2rem',
              position: 'relative',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              boxShadow: 'var(--shadow-glow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.875rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Statement from {selectedCoverLetter.name || 'Candidate'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCoverLetter(null)}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }}
                aria-label="Close statement modal"
              >
                ✕ Close
              </button>
            </div>

            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                backgroundColor: 'var(--bg-overlay)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {selectedCoverLetter.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantsPage;
