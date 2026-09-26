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

  const activeInPipeline = appliedCount + underReviewCount + shortlistedCount + interviewCount;

  // Most recent 5 applications
  const recentApplications = applications.slice(0, 5);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* ===================================================================
          1. HEADER & GREETING
          =================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--primary-400)', fontWeight: 500, marginBottom: '0.35rem' }}>
            Student Workspace
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.4rem', letterSpacing: '-0.03em' }}>
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '600px' }}>
            Track your application stages, review interview schedules, and explore active openings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/opportunities" className="btn btn-primary">
            Explore Openings &rarr;
          </Link>
          <Link to="/student/profile" className="btn btn-secondary">
            Profile & Resume
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '2rem',
            fontSize: '0.875rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* ===================================================================
          2. METRICS & PIPELINE OVERVIEW (Clean Horizontal Summary)
          =================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Applications
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            {totalApplications}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Lifetime submitted
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active in Review
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            {activeInPipeline}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Awaiting decision
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Interviews
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#a78bfa', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            {interviewCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Active interview rounds
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Offers Selected
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34d399', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
            {selectedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Offers extended
          </div>
        </div>
      </div>

      {/* ===================================================================
          3. MAIN CONTENT: RECENT APPLICATIONS & PIPELINE BREAKDOWN
          =================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Left: Recent Applications Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Recent Applications</h2>
            {totalApplications > 0 && (
              <Link to="/student/applications" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                View all ({totalApplications}) &rarr;
              </Link>
            )}
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading recent activity...</p>
          ) : recentApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                You haven&apos;t submitted any applications yet. Discover active internships to get started!
              </p>
              <Link to="/opportunities" className="btn btn-primary btn-sm">
                Browse Opportunities &rarr;
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Opportunity</th>
                    <th>Company</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {app.opportunity?.title || 'Position Unavailable'}
                      </td>
                      <td>{app.opportunity?.company || 'Organization'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                      <td>
                        <Link
                          to={`/student/applications/${app._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Pipeline Distribution & Quick Resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stage Progression Card */}
          <div
            style={{
              padding: '1.75rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pipeline Breakdown</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Applied (Initial)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{appliedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Under Review</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{underReviewCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shortlisted</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{shortlistedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Interview Scheduled</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-400)' }}>{interviewCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Offers Extended</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success-text)' }}>{selectedCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Archived / Closed</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>{rejectedCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Profile Resource Card */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.4rem' }}>Resume & Profile Ready?</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.55 }}>
              Keep your contact details, education, and resume up to date to improve recruiter response rates.
            </p>
            <Link to="/student/profile" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              Manage Resume &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
