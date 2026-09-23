import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await login(email.trim(), password);
      const userRole = response.user?.role;

      // Check if there was an intended redirect location from a protected route
      const from = location.state?.from?.pathname;
      if (from && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true });
      } else {
        // Otherwise route to the role-specific landing dashboard
        const targetPath =
          userRole === 'student'
            ? '/student/dashboard'
            : userRole === 'recruiter'
            ? '/recruiter/dashboard'
            : '/opportunities';
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto 4rem' }}>
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
            ⚡
          </div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.65rem', fontWeight: 800 }}>
            Welcome Back
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Sign in to access your SkillBridge dashboard
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

          <div style={{ marginBottom: '1.75rem' }}>
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
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
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
            {isSubmitting ? 'Signing in...' : 'Sign In'}
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
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                fontWeight: 600,
                color: 'var(--primary-400)',
                textDecoration: 'none',
              }}
            >
              Register now &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
