import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component for public guest routes (Login, Register).
 * Redirects already-authenticated users to their role-specific dashboard.
 */
const PublicRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ color: 'var(--gray-600)' }}>Checking session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const destination =
      user.role === 'student'
        ? '/student/dashboard'
        : user.role === 'recruiter'
        ? '/recruiter/dashboard'
        : '/opportunities';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
