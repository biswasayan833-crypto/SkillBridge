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
    <div style={{ maxWidth: '900px', margin: '1.5rem auto 3rem' }}>
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
            Post New Opportunity
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Publish a new internship or full-time opening to the SkillBridge student network.
          </p>
        </div>
        <Link to="/recruiter/opportunities" className="btn btn-secondary">
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

      {/* Main Creation Form */}
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Title & Company */}
          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label
                htmlFor="title"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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

          {/* Type, WorkMode & Location */}
          <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label
                htmlFor="type"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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

          {/* Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="description"
              style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
            >
              Role Description & Key Responsibilities *
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              maxLength={5000}
              placeholder="Describe the opportunity, key duties, technologies used, and what candidates will learn..."
              value={formData.description}
              onChange={handleChange}
              className="form-control"
              style={{ width: '100%', lineHeight: 1.6 }}
            />
          </div>

          {/* Skills Required */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="skills"
              style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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

          {/* Compensation: Stipend & Salary */}
          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label
                htmlFor="stipend"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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

          {/* Eligibility & Application Deadline */}
          <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div>
              <label
                htmlFor="eligibility"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
              >
                Eligibility Criteria
              </label>
              <input
                id="eligibility"
                name="eligibility"
                type="text"
                maxLength={500}
                placeholder="e.g. 3rd or 4th year CS majors graduating 2026/2027"
                value={formData.eligibility}
                onChange={handleChange}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label
                htmlFor="applicationDeadline"
                style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}
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

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link to="/recruiter/opportunities" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '170px', padding: '0.7rem 1.4rem' }}
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
