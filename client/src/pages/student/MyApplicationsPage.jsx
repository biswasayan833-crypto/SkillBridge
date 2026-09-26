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
    <div style={{ maxWidth: '1050px', margin: '1.5rem auto 3.5rem' }}>
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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            My Applications
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Track submitted applications and monitor progression through the review funnel.
          </p>
        </div>

        <Link
          to="/opportunities"
          className="btn btn-secondary"
          style={{ padding: '0.55rem 1.15rem', fontSize: '0.875rem' }}
        >
          Explore Opportunities &rarr;
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
            padding: '0.875rem 1.25rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.925rem' }}>Loading your applications...</p>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Applications Yet</h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: '420px',
              margin: '0 auto 1.5rem',
              lineHeight: 1.5,
              fontSize: '0.925rem',
            }}
          >
            You have not submitted any applications yet. Discover active internships and full-time opportunities to get started.
          </p>
          <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.65rem 1.35rem' }}>
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
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Opportunity & Company
                    </th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Applied Date
                    </th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Status
                    </th>
                    <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Last Updated
                    </th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {opp.title || 'Opportunity'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {opp.company || 'Company'} {opp.location && `• ${opp.location}`}
                          </div>
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <ApplicationStatusBadge status={app.status} />
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                          {app.statusUpdatedAt ? new Date(app.statusUpdatedAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <Link
                            to={`/student/applications/${app._id}`}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
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
