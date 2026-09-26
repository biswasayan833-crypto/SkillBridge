import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import opportunityService from '../../services/opportunityService';

const EditOpportunityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    type: 'internship',
    workMode: 'remote',
    location: '',
    skills: '',
    stipend: '',
    salary: '',
    eligibility: '',
    applicationDeadline: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const res = await opportunityService.getOpportunityById(id);
        if (res.success && res.data) {
          const opp = res.data;
          setFormData({
            title: opp.title || '',
            company: opp.company || '',
            description: opp.description || '',
            type: opp.type || 'internship',
            workMode: opp.workMode || 'remote',
            location: opp.location || '',
            skills: Array.isArray(opp.skills) ? opp.skills.join(', ') : '',
            stipend: opp.stipend || '',
            salary: opp.salary || '',
            eligibility: opp.eligibility || '',
            applicationDeadline: opp.applicationDeadline ? opp.applicationDeadline.split('T')[0] : '',
          });
        } else {
          setErrorMessage('Opportunity details could not be found.');
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load opportunity for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.company.trim() || !formData.description.trim() || !formData.location.trim()) {
      setErrorMessage('Title, Company, Description, and Location are required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        description: formData.description.trim(),
        type: formData.type,
        workMode: formData.workMode,
        location: formData.location.trim(),
        skills: skillsArray,
        stipend: formData.stipend.trim(),
        salary: formData.salary.trim(),
        eligibility: formData.eligibility.trim(),
        applicationDeadline: formData.applicationDeadline || null,
      };

      const res = await opportunityService.updateOpportunity(id, payload);
      if (res.success) {
        navigate('/recruiter/opportunities', {
          state: { flashMessage: 'Opportunity updated successfully!' },
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update opportunity. Please check your permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '3rem auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>Loading opportunity details...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '860px', margin: '1.5rem auto 3.5rem' }}>
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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.35rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Opportunity
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Update requirements, compensation, or deadline for this listing.
          </p>
        </div>
        <Link to="/recruiter/opportunities" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
          &larr; Cancel
        </Link>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <div className="card" style={{ padding: '2.25rem 2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Section: Role Basics */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              Role Specifications
            </h3>

            <div className="grid grid-cols-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  htmlFor="title"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Position Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.title}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Hiring Organization / Company *
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.company}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  htmlFor="type"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Opportunity Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="workMode"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Work Arrangement *
                </label>
                <select
                  id="workMode"
                  name="workMode"
                  required
                  value={formData.workMode}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-Site</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="location"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Location *
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.location}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
              >
                Role Description & Key Responsibilities *
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                required
                maxLength={5000}
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                style={{ width: '100%', lineHeight: 1.6 }}
              />
            </div>
          </div>

          {/* Section: Qualifications & Compensation */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              Qualifications & Compensation
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="skills"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
              >
                Required Skills (comma separated)
              </label>
              <input
                id="skills"
                name="skills"
                type="text"
                placeholder="e.g. React, Node.js, TypeScript, Docker"
                value={formData.skills}
                onChange={handleChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label
                  htmlFor="stipend"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Stipend (for Internships)
                </label>
                <input
                  id="stipend"
                  name="stipend"
                  type="text"
                  value={formData.stipend}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  htmlFor="salary"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Salary Range (for Full-Time / Contract)
                </label>
                <input
                  id="salary"
                  name="salary"
                  type="text"
                  value={formData.salary}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
              <div>
                <label
                  htmlFor="eligibility"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Eligibility Criteria
                </label>
                <input
                  id="eligibility"
                  name="eligibility"
                  type="text"
                  maxLength={500}
                  value={formData.eligibility}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label
                  htmlFor="applicationDeadline"
                  style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
                >
                  Application Deadline
                </label>
                <input
                  id="applicationDeadline"
                  name="applicationDeadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.875rem' }}>
            <Link to="/recruiter/opportunities" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '170px', padding: '0.65rem 1.35rem', fontSize: '0.875rem' }}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOpportunityPage;
