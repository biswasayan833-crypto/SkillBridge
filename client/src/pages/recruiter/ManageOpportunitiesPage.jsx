import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import opportunityService from '../../services/opportunityService';

const ManageOpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionNotice, setActionNotice] = useState({ type: '', text: '' });
  const [deactivatingId, setDeactivatingId] = useState(null);

  useEffect(() => {
    fetchMyOpportunities();
  }, []);

  const fetchMyOpportunities = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await opportunityService.getMyOpportunities();
      if (res.success) {
        setOpportunities(res.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load your opportunities.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${title}"? It will no longer be visible to students for public discovery or applications.`
    );
    if (!confirmed) return;

    setDeactivatingId(id);
    setActionNotice({ type: '', text: '' });

    try {
      const res = await opportunityService.deleteOpportunity(id);
      if (res.success) {
        setActionNotice({
          type: 'success',
          text: `"${title}" has been successfully deactivated.`,
        });
        // Update local opportunity list to show inactive status
        setOpportunities((prev) =>
          prev.map((opp) => (opp._id === id ? { ...opp, isActive: false } : opp))
        );
      }
    } catch (err) {
      setActionNotice({
        type: 'danger',
        text: err.message || 'Failed to deactivate opportunity.',
      });
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '1.5rem auto 3rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
            Manage Opportunities
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Create, edit, deactivate, and review candidate applicant pools for your organization.
          </p>
        </div>

        <Link
          to="/recruiter/opportunities/create"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.35rem', fontSize: '0.925rem' }}
        >
          + Post New Opportunity
        </Link>
      </div>

      {/* Action Notification */}
      {actionNotice.text && (
        <div
          style={{
            backgroundColor: actionNotice.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: actionNotice.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${
              actionNotice.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{actionNotice.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Fetch Error Message */}
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
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your posted opportunities...</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No Opportunities Posted Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Get started by posting an internship or full-time position to discover student talent.
          </p>
          <Link to="/recruiter/opportunities/create" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
            + Post Your First Opportunity
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Position & Company</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type & Mode</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</th>
                  <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr
                    key={opp._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: opp.isActive ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        <Link to={`/opportunities/${opp._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {opp.title}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {opp.company} {opp.location && `• ${opp.location}`}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {opp.type}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {opp.workMode}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {opp.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span
                          className="badge"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}
                        >
                          Deactivated
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {opp.applicationDeadline
                        ? new Date(opp.applicationDeadline).toLocaleDateString()
                        : 'Rolling'}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link
                          to={`/recruiter/opportunities/${opp._id}/applicants`}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
                        >
                          Applicants
                        </Link>

                        <Link
                          to={`/recruiter/opportunities/${opp._id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
                        >
                          Edit
                        </Link>

                        {opp.isActive && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleDeactivate(opp._id, opp.title)}
                            disabled={deactivatingId === opp._id}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.825rem',
                              color: 'var(--danger-text)',
                              borderColor: 'var(--danger-border)',
                            }}
                          >
                            {deactivatingId === opp._id ? 'Deactivating...' : 'Deactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOpportunitiesPage;
