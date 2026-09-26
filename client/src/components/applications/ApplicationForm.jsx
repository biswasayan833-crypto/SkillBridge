import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import applicationService from '../../services/applicationService';

const ApplicationForm = ({ opportunityId, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const MAX_CHARS = 2000;

  const handleChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setCoverLetter(text);
      if (errorMessage) setErrorMessage('');
      if (isDuplicate) setIsDuplicate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opportunityId) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setIsDuplicate(false);

    try {
      const response = await applicationService.createApplication({
        opportunity: opportunityId,
        coverLetter: coverLetter.trim(),
      });

      if (response.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess(response.data);
      }
    } catch (err) {
      if (err.status === 409 || err.message?.includes('already exists')) {
        setIsDuplicate(true);
        setErrorMessage('You have already submitted an application for this opportunity.');
      } else {
        setErrorMessage(err.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        style={{
          padding: '2rem 1.5rem',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
        }}
      >
        <h3 style={{ color: 'var(--success-text)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
          Application Submitted
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Your application has been received and logged in the recruiter review pipeline.
        </p>
        <Link to="/student/applications" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
          View My Applications &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: isDuplicate ? 'var(--warning-bg)' : 'var(--danger-bg)',
            color: isDuplicate ? 'var(--warning-text)' : 'var(--danger-text)',
            border: `1px solid ${isDuplicate ? 'var(--warning-border)' : 'var(--danger-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.875rem',
          }}
        >
          <div>{errorMessage}</div>
          {isDuplicate && (
            <div style={{ marginTop: '0.5rem' }}>
              <Link to="/student/applications" style={{ color: 'var(--warning-text)', fontWeight: 500, textDecoration: 'underline' }}>
                Track existing application in My Applications &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="coverLetter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Cover Letter</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Optional</span>
          </label>

          <textarea
            id="coverLetter"
            name="coverLetter"
            rows="5"
            placeholder="Introduce your relevant experience, technical projects, and why this position aligns with your career objectives..."
            value={coverLetter}
            onChange={handleChange}
            style={{
              resize: 'vertical',
              minHeight: '120px',
              lineHeight: 1.6,
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Attach notes for the hiring team</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {coverLetter.length} / {MAX_CHARS}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isDuplicate}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
