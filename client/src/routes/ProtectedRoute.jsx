import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard component for authenticated routes.
 * Supports optional role-based restriction via allowedRoles prop.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <p style={{ color: 'var(--gray-600)' }}>Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to login, preserving intended path in state.from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their landing view based on their role
    const fallbackPath =
      user.role === 'student'
        ? '/student/dashboard'
        : user.role === 'recruiter'
        ? '/recruiter/dashboard'
        : '/opportunities';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
