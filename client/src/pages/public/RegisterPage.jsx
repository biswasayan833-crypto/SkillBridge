import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student', // default selection
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const { name, email, role, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (formError) setFormError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (name.trim().length < 2) {
      setFormError('Name must be at least 2 characters long.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (role !== 'student' && role !== 'recruiter') {
      setFormError('Please select a valid role (Student or Recruiter).');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      const userRole = response.user?.role || role;
      const targetPath =
        userRole === 'student'
          ? '/student/dashboard'
          : userRole === 'recruiter'
          ? '/recruiter/dashboard'
          : '/opportunities';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '3rem auto 4.5rem' }}>
      <div className="card" style={{ padding: '2.5rem 2.25rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Create an Account
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Join SkillBridge as a Student or Recruiter
          </p>
        </div>

        {formError && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-text)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector Cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              Account Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => handleRoleSelect('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    role === 'student' ? 'var(--primary-500)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    role === 'student' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Student
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apply to roles</div>
                </div>
              </div>

              <div
                onClick={() => handleRoleSelect('recruiter')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    role === 'recruiter' ? 'var(--primary-500)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    role === 'recruiter' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="recruiter"
                  checked={role === 'recruiter'}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--primary-500)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Recruiter
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Post & hire</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={handleChange}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChange}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              Password <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(min. 6 characters)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={handleChange}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '0.4rem',
                fontWeight: 600,
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={handleChange}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.925rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                fontWeight: 600,
                color: 'var(--primary-400)',
                textDecoration: 'none',
              }}
            >
              Sign in &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
