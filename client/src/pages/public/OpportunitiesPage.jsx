import React, { useState, useEffect, useCallback } from 'react';
import opportunityService from '../../services/opportunityService';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import Pagination from '../../components/common/Pagination';

const OpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    workMode: '',
    location: '',
    skills: '',
    sort: '-createdAt',
    page: 1,
    limit: 6,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Debounced/Triggered Fetch
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Build clean query params omitting empty values
      const params = {};
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.workMode) params.workMode = filters.workMode;
      if (filters.location.trim()) params.location = filters.location.trim();
      if (filters.skills.trim()) params.skills = filters.skills.trim();
      if (filters.sort) params.sort = filters.sort;
      params.page = filters.page;
      params.limit = filters.limit;

      const res = await opportunityService.getOpportunities(params);
      if (res.success) {
        setOpportunities(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to page 1 on filter modification
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      workMode: '',
      location: '',
      skills: '',
      sort: '-createdAt',
      page: 1,
      limit: 6,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.workMode || filters.location || filters.skills || filters.sort !== '-createdAt'
  );

  return (
    <div style={{ padding: '0.5rem 0 3rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
          Explore Opportunities
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>
          Filter internships and full-time positions across active organizations.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '1.75rem',
          border: '1px solid var(--border-medium)',
        }}
      >
        {/* Row 1: Search, Type, WorkMode */}
        <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Keyword Search */}
          <div>
            <label htmlFor="search-input">Keyword Search</label>
            <input
              id="search-input"
              name="search"
              type="text"
              placeholder="Title, company, or keywords..."
              value={filters.search}
              onChange={handleInputChange}
            />
          </div>

          {/* Role Type */}
          <div>
            <label htmlFor="type-select">Opportunity Type</label>
            <select
              id="type-select"
              name="type"
              value={filters.type}
              onChange={handleInputChange}
            >
              <option value="">All Types</option>
              <option value="internship">Internship</option>
              <option value="full-time">Full-Time</option>
              <option value="part-time">Part-Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label htmlFor="workmode-select">Work Arrangement</label>
            <select
              id="workmode-select"
              name="workMode"
              value={filters.workMode}
              onChange={handleInputChange}
            >
              <option value="">All Modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-Site</option>
            </select>
          </div>
        </div>

        {/* Row 2: Location, Skills, Sort */}
        <div className="grid grid-cols-3" style={{ gap: '1.25rem' }}>
          {/* Location */}
          <div>
            <label htmlFor="location-input">Location / City</label>
            <input
              id="location-input"
              name="location"
              type="text"
              placeholder="e.g. San Francisco, Remote..."
              value={filters.location}
              onChange={handleInputChange}
            />
          </div>

          {/* Skills Required */}
          <div>
            <label htmlFor="skills-input">Skills</label>
            <input
              id="skills-input"
              name="skills"
              type="text"
              placeholder="e.g. React, Python, Node.js..."
              value={filters.skills}
              onChange={handleInputChange}
            />
          </div>

          {/* Sort By & Clear Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="sort-select">Sort By</label>
              <select
                id="sort-select"
                name="sort"
                value={filters.sort}
                onChange={handleInputChange}
              >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="applicationDeadline">Deadline Soonest</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary"
                style={{ padding: '0.65rem 1rem', fontSize: '0.875rem' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header Metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {loading ? (
            'Searching opportunities...'
          ) : (
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{opportunities.length}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{pagination.total}</strong> opportunities
            </span>
          )}
        </p>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          ❌ {errorMessage}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="card skeleton"
              style={{
                height: '260px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '1rem' }} />
              <div style={{ width: '60%', height: '14px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem' }} />
              <div style={{ width: '40%', height: '10px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            border: '1px dashed var(--border-medium)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No Opportunities Found</h3>
          <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
            We couldn't find any opportunities matching your active query. Try broadening your criteria or reset your filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-primary"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        /* Opportunities Grid */
        <>
          <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
            {opportunities.map((opp) => (
              <OpportunityCard key={opp._id} opportunity={opp} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default OpportunitiesPage;
