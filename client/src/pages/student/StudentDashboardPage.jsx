import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';

const StudentDashboardPage = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // Fetch up to 100 applications to calculate accurate stats on frontend
      const res = await applicationService.getMyApplications({ limit: 100 });
      if (res.success) {
        setApplications(res.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load your application data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived application statistics
  const totalApplications = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;
  const underReviewCount = applications.filter((a) => a.status === 'Under Review').length;
  const shortlistedCount = applications.filter((a) => a.status === 'Shortlisted').length;
  const interviewCount = applications.filter((a) => a.status === 'Interview').length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;
  const rejectedCount = applications.filter((a) => a.status === 'Rejected').length;

  // Most recent 5 applications
  const recentApplications = applications.slice(0, 5);

  const stats = [
    { label: 'Total', count: totalApplications, sub: 'Submitted', color: 'var(--primary-400)' },
    { label: 'Applied', count: appliedCount, sub: 'Initial Stage', color: '#60a5fa' },
    { label: 'Under Review', count: underReviewCount, sub: 'Screening', color: '#fbbf24' },
    { label: 'Shortlisted', count: shortlistedCount, sub: 'Qualified', color: '#c084fc' },
    { label: 'Interview', count: interviewCount, sub: 'Active Round', color: '#818cf8' },
    { label: 'Selected', count: selectedCount, sub: 'Offers', color: '#34d399' },
    { label: 'Rejected', count: rejectedCount, sub: 'Closed', color: '#f87171' },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '1.5rem auto 3rem' }}>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          padding: '2.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(17, 24, 39, 0.95) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.25)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            right: '-10%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-300)' }}>
              🎓 Student Command Center
            </div>
            <h1 style={{ fontSize: '2.25rem', margin: '0.25rem 0 0.5rem 0', fontWeight: 800 }}>
              Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>!
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
              Monitor your application status updates, discover active internships and full-time positions, and manage your profile.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
              Browse Opportunities &rarr;
            </Link>
            <Link to="/student/profile" className="btn btn-secondary" style={{ padding: '0.7rem 1.4rem' }}>
              Profile & Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Error Message with Retry */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your dashboard overview...</p>
        </div>
      ) : (
        <>
          {/* Application Statistics Grid */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                Application Pipeline
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {totalApplications} Total Submissions
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem',
              }}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="card"
                  style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </span>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: s.color, margin: '0.4rem 0 0.15rem' }}>
                    {s.count}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {s.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications Section */}
          <div className="card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Recent Applications</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Your latest submissions and current recruitment progression
                </p>
              </div>

              {totalApplications > 0 && (
                <Link
                  to="/student/applications"
                  style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none' }}
                >
                  View All ({totalApplications}) &rarr;
                </Link>
              )}
            </div>

            {totalApplications === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No Applications Submitted Yet</h4>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.925rem', lineHeight: 1.6 }}>
                  Explore active opportunities tailored to your degree and skills, and apply with your uploaded resume.
                </p>
                <Link to="/opportunities" className="btn btn-primary" style={{ padding: '0.6rem 1.3rem' }}>
                  Explore Opportunities
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-overlay)' }}>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Opportunity & Company</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Applied On</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => {
                      const opp = app.opportunity || {};
                      return (
                        <tr
                          key={app._id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                              {opp.title || 'Opportunity'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {opp.company || 'Company'} {opp.location && `• ${opp.location}`}
                            </div>
                          </td>

                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <ApplicationStatusBadge status={app.status} />
                          </td>

                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <Link
                              to={`/student/applications/${app._id}`}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
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
            )}
          </div>

          {/* Quick Navigation Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 700 }}>
              Quick Navigation
            </h3>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <Link to="/opportunities" className="btn btn-primary">
                🔍 Browse Opportunities
              </Link>
              <Link to="/student/applications" className="btn btn-secondary">
                📋 All Applications
              </Link>
              <Link to="/student/profile" className="btn btn-secondary">
                👤 Profile & Resume
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboardPage;
