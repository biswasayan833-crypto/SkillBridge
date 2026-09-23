import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import opportunityService from '../../services/opportunityService';
import applicationService from '../../services/applicationService';

const RecruiterDashboardPage = () => {
  const { user } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [applicantStats, setApplicantStats] = useState({
    total: 0,
    applied: 0,
    underReview: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    partialFailure: false,
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Fetch recruiter's opportunities
      const oppRes = await opportunityService.getMyOpportunities();
      const oppList = oppRes.success ? oppRes.data || [] : [];
      setOpportunities(oppList);

      // 2. Fetch applicant data for each opportunity in parallel with graceful partial-failure handling
      if (oppList.length > 0) {
        const applicantPromises = oppList.map((opp) =>
          applicationService.getOpportunityApplications(opp._id)
        );

        const results = await Promise.allSettled(applicantPromises);

        let total = 0;
        let applied = 0;
        let underReview = 0;
        let shortlisted = 0;
        let interview = 0;
        let selected = 0;
        let rejected = 0;
        let hadFailure = false;

        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value?.success) {
            const apps = res.value.data || [];
            total += apps.length;
            apps.forEach((a) => {
              if (a.status === 'Applied') applied++;
              else if (a.status === 'Under Review') underReview++;
              else if (a.status === 'Shortlisted') shortlisted++;
              else if (a.status === 'Interview') interview++;
              else if (a.status === 'Selected') selected++;
              else if (a.status === 'Rejected') rejected++;
            });
          } else {
            hadFailure = true;
          }
        });

        setApplicantStats({
          total,
          applied,
          underReview,
          shortlisted,
          interview,
          selected,
          rejected,
          partialFailure: hadFailure,
        });
      } else {
        setApplicantStats({
          total: 0,
          applied: 0,
          underReview: 0,
          shortlisted: 0,
          interview: 0,
          selected: 0,
          rejected: 0,
          partialFailure: false,
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load recruiter dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived opportunity statistics
  const totalOpportunities = opportunities.length;
  const activeOpportunities = opportunities.filter((o) => o.isActive).length;
  const inactiveOpportunities = opportunities.filter((o) => !o.isActive).length;

  // Latest 5 opportunities
  const recentOpportunities = opportunities.slice(0, 5);

  const pipelineStages = [
    { label: 'Total', count: applicantStats.total, sub: 'Applicants', color: 'var(--primary-400)' },
    { label: 'Applied', count: applicantStats.applied, sub: 'Awaiting Review', color: '#60a5fa' },
    { label: 'Under Review', count: applicantStats.underReview, sub: 'Screening', color: '#fbbf24' },
    { label: 'Shortlisted', count: applicantStats.shortlisted, sub: 'Qualified', color: '#c084fc' },
    { label: 'Interview', count: applicantStats.interview, sub: 'Active Round', color: '#818cf8' },
    { label: 'Selected', count: applicantStats.selected, sub: 'Offers Extended', color: '#34d399' },
    { label: 'Rejected', count: applicantStats.rejected, sub: 'Disqualified', color: '#f87171' },
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
              💼 Recruiter Command Center
            </div>
            <h1 style={{ fontSize: '2.25rem', margin: '0.25rem 0 0.5rem 0', fontWeight: 800 }}>
              Welcome back, <span className="gradient-text">{user?.name || 'Recruiter'}</span>!
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
              Manage your talent pipeline, review candidate applications, and publish new opportunities across your team.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/recruiter/opportunities/create"
              className="btn btn-primary"
              style={{ padding: '0.7rem 1.4rem' }}
            >
              + Post Opportunity
            </Link>
            <Link
              to="/recruiter/opportunities"
              className="btn btn-secondary"
              style={{ padding: '0.7rem 1.4rem' }}
            >
              Manage Postings
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

      {/* Partial Failure Warning Banner */}
      {applicantStats.partialFailure && (
        <div
          style={{
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>⚠️</span>
          <span>Notice: Applicant statistics for one or more opportunities could not be synchronized. Displaying available candidate data.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading your recruitment metrics...</p>
        </div>
      ) : (
        <>
          {/* Section 1: Opportunity Statistics */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>
              Opportunities Overview
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Opportunities
                </span>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-400)', margin: '0.4rem 0 0.15rem' }}>
                  {totalOpportunities}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created Postings</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Postings
                </span>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, color: '#34d399', margin: '0.4rem 0 0.15rem' }}>
                  {activeOpportunities}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discoverable by Students</span>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Inactive / Deactivated
                </span>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-secondary)', margin: '0.4rem 0 0.15rem' }}>
                  {inactiveOpportunities}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Closed or Archived</span>
              </div>
            </div>
          </div>

          {/* Section 2: Candidate Pipeline Statistics */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>
              Candidate Hiring Pipeline
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem',
              }}
            >
              {pipelineStages.map((stage) => (
                <div
                  key={stage.label}
                  className="card"
                  style={{
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stage.label}
                  </span>
                  <p style={{ fontSize: '2rem', fontWeight: 800, color: stage.color, margin: '0.4rem 0 0.15rem' }}>
                    {stage.count}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {stage.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Recent Opportunities */}
          <div className="card" style={{ marginBottom: '2.5rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Recent Opportunities</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Your latest job postings and candidate review shortcuts
                </p>
              </div>

              {totalOpportunities > 0 && (
                <Link
                  to="/recruiter/opportunities"
                  style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none' }}
                >
                  Manage All ({totalOpportunities}) &rarr;
                </Link>
              )}
            </div>

            {totalOpportunities === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>No Opportunities Posted Yet</h4>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.925rem', lineHeight: 1.6 }}>
                  Post your first internship or job opportunity to start receiving candidate applications.
                </p>
                <Link to="/recruiter/opportunities/create" className="btn btn-primary" style={{ padding: '0.6rem 1.3rem' }}>
                  + Post New Opportunity
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-overlay)' }}>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Title & Company</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type / Mode</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOpportunities.map((opp) => (
                      <tr key={opp._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {opp.title}
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
                            <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString() : 'Rolling'}
                        </td>

                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 700 }}>
              Recruiter Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <Link to="/recruiter/opportunities/create" className="btn btn-primary">
                + Post New Opportunity
              </Link>
              <Link to="/recruiter/opportunities" className="btn btn-secondary">
                📋 Manage All Opportunities
              </Link>
              <Link to="/student/profile" className="btn btn-secondary">
                👤 Organization Profile
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecruiterDashboardPage;
