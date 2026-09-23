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
    <div style={{ maxWidth: '500px', margin: '3rem auto 4rem' }}>
      <div className="card" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-600) 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '1rem',
            }}
          >
            🚀
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.65rem', fontWeight: 800 }}>
            Create an Account
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
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
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
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
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              I want to join as:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => handleRoleSelect('student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    role === 'student' ? 'var(--primary-500)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    role === 'student' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-overlay)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: role === 'student' ? 'var(--shadow-glow)' : 'none',
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
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                    🎓 Student
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apply to roles</div>
                </div>
              </div>

              <div
                onClick={() => handleRoleSelect('recruiter')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${
                    role === 'recruiter' ? 'var(--primary-500)' : 'var(--border-subtle)'
                  }`,
                  backgroundColor:
                    role === 'recruiter' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-overlay)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: role === 'recruiter' ? 'var(--shadow-glow)' : 'none',
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
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                    💼 Recruiter
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
                fontSize: '0.875rem',
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
              placeholder="Ayan Biswas"
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
                fontSize: '0.875rem',
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
                fontSize: '0.875rem',
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
                fontSize: '0.875rem',
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
              padding: '0.8rem',
              fontSize: '0.975rem',
              fontWeight: 700,
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
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
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
