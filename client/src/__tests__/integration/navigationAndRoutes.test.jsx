import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar';
import ProtectedRoute from '../../routes/ProtectedRoute';
import PublicRoute from '../../routes/PublicRoute';
import { AuthContext } from '../../context/AuthContext';

describe('Frontend Integration Tests — Navigation and Route Guards', () => {
  const mockLogout = vi.fn();

  const renderWithAuth = (ui, authValue, initialEntries = ['/']) => {
    return render(
      <AuthContext.Provider value={{ logout: mockLogout, ...authValue }}>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. Navbar Navigation & RBAC
  // ==========================================
  describe('<Navbar />', () => {
    it('should render guest links (Home, Opportunities, Login, Get Started) when unauthenticated', () => {
      renderWithAuth(<Navbar />, {
        isAuthenticated: false,
        user: null,
        loading: false,
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });

    it('should render student navigation links and user badge when authenticated as student', () => {
      renderWithAuth(<Navbar />, {
        isAuthenticated: true,
        user: { name: 'Sarah Student', role: 'student' },
        loading: false,
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Applications')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText(/Sarah Student \(student\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
    });

    it('should render recruiter navigation links when authenticated as recruiter', () => {
      renderWithAuth(<Navbar />, {
        isAuthenticated: true,
        user: { name: 'Dave Recruiter', role: 'recruiter' },
        loading: false,
      });

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText(/Dave Recruiter \(recruiter\)/i)).toBeInTheDocument();
      expect(screen.queryByText('My Applications')).not.toBeInTheDocument();
    });

    it('should call logout when Logout button is clicked', async () => {
      renderWithAuth(<Navbar />, {
        isAuthenticated: true,
        user: { name: 'Sarah Student', role: 'student' },
        loading: false,
      });

      const logoutBtn = screen.getByRole('button', { name: /logout/i });
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      renderWithAuth(<Navbar />, {
        isAuthenticated: false,
        user: null,
        loading: false,
      });

      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ==========================================
  // 2. ProtectedRoute Guard
  // ==========================================
  describe('<ProtectedRoute />', () => {
    it('should show loading indicator when authentication is loading', () => {
      renderWithAuth(
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
        </Routes>,
        { loading: true, isAuthenticated: false, user: null },
        ['/protected']
      );

      expect(screen.getByText(/authenticating session/i)).toBeInTheDocument();
      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });

    it('should redirect unauthenticated users to /login', () => {
      renderWithAuth(
        <Routes>
          <Route path="/login" element={<div>Login Page View</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/student/dashboard" element={<div>Student Dashboard View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: false, user: null },
        ['/student/dashboard']
      );

      expect(screen.getByText('Login Page View')).toBeInTheDocument();
      expect(screen.queryByText('Student Dashboard View')).not.toBeInTheDocument();
    });

    it('should allow access to protected content when authenticated and role matches', () => {
      renderWithAuth(
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/applications" element={<div>Applications List</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: true, user: { role: 'student' } },
        ['/student/applications']
      );

      expect(screen.getByText('Applications List')).toBeInTheDocument();
    });

    it('should redirect student attempting recruiter route to /student/dashboard', () => {
      renderWithAuth(
        <Routes>
          <Route path="/student/dashboard" element={<div>Student Dashboard Home</div>} />
          <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
            <Route path="/recruiter/create" element={<div>Create Opportunity View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: true, user: { role: 'student' } },
        ['/recruiter/create']
      );

      expect(screen.getByText('Student Dashboard Home')).toBeInTheDocument();
      expect(screen.queryByText('Create Opportunity View')).not.toBeInTheDocument();
    });

    it('should redirect recruiter attempting student route to /recruiter/dashboard', () => {
      renderWithAuth(
        <Routes>
          <Route path="/recruiter/dashboard" element={<div>Recruiter Dashboard Home</div>} />
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/applications" element={<div>My Applications View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: true, user: { role: 'recruiter' } },
        ['/student/applications']
      );

      expect(screen.getByText('Recruiter Dashboard Home')).toBeInTheDocument();
      expect(screen.queryByText('My Applications View')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // 3. PublicRoute Guard
  // ==========================================
  describe('<PublicRoute />', () => {
    it('should allow guest users to access public routes like /login', () => {
      renderWithAuth(
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Form View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: false, user: null },
        ['/login']
      );

      expect(screen.getByText('Login Form View')).toBeInTheDocument();
    });

    it('should redirect already-authenticated student visiting /login to /student/dashboard', () => {
      renderWithAuth(
        <Routes>
          <Route path="/student/dashboard" element={<div>Student Dashboard Home</div>} />
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Form View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: true, user: { role: 'student' } },
        ['/login']
      );

      expect(screen.getByText('Student Dashboard Home')).toBeInTheDocument();
      expect(screen.queryByText('Login Form View')).not.toBeInTheDocument();
    });

    it('should redirect already-authenticated recruiter visiting /register to /recruiter/dashboard', () => {
      renderWithAuth(
        <Routes>
          <Route path="/recruiter/dashboard" element={<div>Recruiter Dashboard Home</div>} />
          <Route element={<PublicRoute />}>
            <Route path="/register" element={<div>Register Form View</div>} />
          </Route>
        </Routes>,
        { loading: false, isAuthenticated: true, user: { role: 'recruiter' } },
        ['/register']
      );

      expect(screen.getByText('Recruiter Dashboard Home')).toBeInTheDocument();
      expect(screen.queryByText('Register Form View')).not.toBeInTheDocument();
    });
  });
});
