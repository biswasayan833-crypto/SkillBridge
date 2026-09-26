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

  const totalOpportunities = opportunities.length;
  const activeOpportunities = opportunities.filter((o) => o.isActive).length;
  const inactiveOpportunities = opportunities.filter((o) => !o.isActive).length;
  const inPipelineCount = applicantStats.applied + applicantStats.underReview + applicantStats.shortlisted + applicantStats.interview;

  // Latest 5 opportunities
  const recentOpportunities = opportunities.slice(0, 5);

  const pipelineStages = [
    { label: 'Applied', count: applicantStats.applied, sub: 'Awaiting review', dotColor: '#3B82F6' },
    { label: 'Under Review', count: applicantStats.underReview, sub: 'In screening', dotColor: '#F59E0B' },
    { label: 'Shortlisted', count: applicantStats.shortlisted, sub: 'Qualified pool', dotColor: '#8B5CF6' },
    { label: 'Interview', count: applicantStats.interview, sub: 'Live rounds', dotColor: '#06B6D4' },
    { label: 'Selected', count: applicantStats.selected, sub: 'Offers extended', dotColor: '#10B981' },
    { label: 'Rejected', count: applicantStats.rejected, sub: 'Concluded', dotColor: '#64748B' },
  ];

  return (
    <div style={{ maxWidth: '1120px', margin: '1.5rem auto 3.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-400)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Recruiter Command Center
            </div>
            <h1 style={{ fontSize: '1.875rem', margin: '0.2rem 0 0.4rem 0', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Welcome back, {user?.name || 'Recruiter'}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem', maxWidth: '580px', lineHeight: 1.5 }}>
              Track candidate pipelines, monitor active job requisitions, and advance qualified talent.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/recruiter/opportunities/create"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              + Post Opportunity
            </Link>
            <Link
              to="/recruiter/opportunities"
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1.25rem' }}
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
          <span style={{ fontSize: '0.9rem' }}>{errorMessage}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
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
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>Notice: Applicant statistics for one or more postings could not be synchronized. Available candidate records are displayed.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.925rem' }}>Loading recruitment overview...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Postings
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.4rem 0 0.2rem', letterSpacing: '-0.02em' }}>
                {activeOpportunities}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {totalOpportunities} total created ({inactiveOpportunities} archived)
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Applicants
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary-400)', margin: '0.4rem 0 0.2rem', letterSpacing: '-0.02em' }}>
                {applicantStats.total}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Candidates across all postings
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Active Pipeline
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.4rem 0 0.2rem', letterSpacing: '-0.02em' }}>
                {inPipelineCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Under review or in interview
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Offers / Selected
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#10B981', margin: '0.4rem 0 0.2rem', letterSpacing: '-0.02em' }}>
                {applicantStats.selected}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Offers accepted or finalized
              </div>
            </div>
          </div>

          {/* Pipeline Funnel Breakdown */}
          <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  Hiring Pipeline Progression
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Current candidate distribution across hiring stages
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {pipelineStages.map((stage) => (
                <div
                  key={stage.label}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: stage.dotColor,
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stage.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {stage.count}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {stage.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Opportunities */}
          <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  Recent Opportunities
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Active job requisitions and candidate management shortcuts
                </p>
              </div>

              {totalOpportunities > 0 && (
                <Link
                  to="/recruiter/opportunities"
                  style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--primary-400)', textDecoration: 'none' }}
                >
                  View All ({totalOpportunities}) &rarr;
                </Link>
              )}
            </div>

            {totalOpportunities === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>No opportunities posted yet</h4>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  Publish your first internship or full-time position to begin receiving qualified student applications.
                </p>
                <Link to="/recruiter/opportunities/create" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
                  + Post New Opportunity
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
                      <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title & Company</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type / Mode</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deadline</th>
                      <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOpportunities.map((opp) => (
                      <tr key={opp._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                            {opp.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {opp.company} {opp.location && `• ${opp.location}`}
                          </div>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <div style={{ textTransform: 'capitalize', fontWeight: 500, color: 'var(--text-primary)' }}>
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
                            <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
                              Archived
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString() : 'Rolling'}
                        </td>

                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <Link
                              to={`/recruiter/opportunities/${opp._id}/applicants`}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              Applicants
                            </Link>
                            <Link
                              to={`/recruiter/opportunities/${opp._id}/edit`}
                              className="btn btn-outline"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
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

          {/* Quick Actions Footer */}
          <div className="card" style={{ padding: '1.5rem 1.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/recruiter/opportunities/create" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
                + Post New Opportunity
              </Link>
              <Link to="/recruiter/opportunities" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
                Manage All Postings
              </Link>
              <Link to="/student/profile" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
                Organization Profile
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecruiterDashboardPage;
