import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import opportunityService from '../../services/opportunityService';

const CreateOpportunityPage = () => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!formData.title.trim()) {
      setErrorMessage('Position Title is required.');
      return;
    }
    if (!formData.company.trim()) {
      setErrorMessage('Company name is required.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMessage('Role Description is required.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMessage('Location is required.');
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

      const res = await opportunityService.createOpportunity(payload);
      if (res.success) {
        navigate('/recruiter/opportunities', {
          state: { flashMessage: 'Opportunity posted successfully!' },
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create opportunity. Please check all inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Post New Opportunity
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Publish a new internship or full-time opening to the SkillBridge student network.
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

      {/* Main Creation Form */}
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
                  placeholder="e.g. Software Engineering Intern"
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
                  placeholder="e.g. Acme Tech Solutions"
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
                  placeholder="e.g. San Francisco, CA or Remote"
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
                placeholder="Describe the opportunity, core duties, technologies used, and what candidates will work on..."
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
                  placeholder="e.g. $2,500/month or $25/hr"
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
                  placeholder="e.g. $80,000 - $100,000 / year"
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
                  placeholder="e.g. Enrolled students graduating 2026/2027"
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
              {isSubmitting ? 'Publishing...' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunityPage;
