import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';
import Pagination from '../../components/common/Pagination';

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await applicationService.getMyApplications({ page, limit: 10 });
      if (res.success) {
        setApplications(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load your applications.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '1.5rem auto 3rem' }}>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            My Applications
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track your submitted applications and monitor progression as recruiters review candidates.
          </p>
        </div>

        <Link
          to="/opportunities"
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
        >
          Explore More Opportunities &rarr;
        </Link>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No Applications Yet</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '440px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.6,
            }}
          >
            You haven't submitted any applications yet. Discover active internships and full-time opportunities to get started!
          </p>
          <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
            Browse Opportunities &rarr;
          </Link>
        </div>
      ) : (
        /* Applications List / Table */
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.925rem',
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
                      Opportunity & Company
                    </th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Applied Date
                    </th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Last Updated
                    </th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const opp = app.opportunity || {};
                    return (
                      <tr
                        key={app._id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {opp.title || 'Opportunity'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {opp.company || 'Company'} {opp.location && `• ${opp.location}`}
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <ApplicationStatusBadge status={app.status} />
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {app.statusUpdatedAt ? new Date(app.statusUpdatedAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <Link
                            to={`/student/applications/${app._id}`}
                            className="btn btn-outline"
                            style={{ padding: '0.35rem 0.8rem', fontSize: '0.825rem' }}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
