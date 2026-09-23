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
        className="card"
        style={{
          padding: '2rem',
          backgroundColor: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          boxShadow: 'var(--shadow-emerald-glow)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
        <h3 style={{ color: 'var(--success-text)', marginBottom: '0.5rem' }}>Application Submitted</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Your application has been received and logged in the recruiter review pipeline.
        </p>
        <Link to="/student/applications" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }}>
          View My Applications &rarr;
        </Link>
      </div>
    );
  }

  const charPercentage = Math.min(100, Math.round((coverLetter.length / MAX_CHARS) * 100));

  return (
    <div style={{ marginTop: '1rem' }}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: isDuplicate ? 'var(--warning-bg)' : 'var(--danger-bg)',
            color: isDuplicate ? 'var(--warning-text)' : 'var(--danger-text)',
            border: `1px solid ${isDuplicate ? 'var(--warning-border)' : 'var(--danger-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <span>{isDuplicate ? '⚠️' : '❌'}</span>
            <span>{errorMessage}</span>
          </div>
          {isDuplicate && (
            <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <Link to="/student/applications" style={{ color: 'var(--warning-text)', fontWeight: 600, textDecoration: 'underline' }}>
                Track existing application in My Applications &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label
              htmlFor="coverLetter"
              style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}
            >
              Cover Letter / Statement of Interest (Optional)
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                color: coverLetter.length >= MAX_CHARS ? 'var(--danger-text)' : 'var(--text-muted)',
              }}
            >
              {coverLetter.length} / {MAX_CHARS}
            </span>
          </div>

          <textarea
            id="coverLetter"
            name="coverLetter"
            rows={5}
            maxLength={MAX_CHARS}
            placeholder="Introduce yourself, highlight relevant coursework or projects, and outline your interest in this role..."
            value={coverLetter}
            onChange={handleChange}
            disabled={isSubmitting || isDuplicate}
            style={{
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />

          {/* Micro progress bar for character counter */}
          <div
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-full)',
              marginTop: '0.35rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${charPercentage}%`,
                height: '100%',
                backgroundColor: charPercentage > 90 ? 'var(--danger-text)' : 'var(--primary-500)',
                transition: 'width var(--transition-fast)',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isDuplicate}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            cursor: isSubmitting || isDuplicate ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default ApplicationForm;
