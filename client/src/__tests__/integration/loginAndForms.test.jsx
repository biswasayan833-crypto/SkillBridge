import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import LoginPage from '../../pages/public/LoginPage';
import ApplicationForm from '../../components/applications/ApplicationForm';
import { AuthContext } from '../../context/AuthContext';
import applicationService from '../../services/applicationService';

// Mock applicationService
vi.mock('../../services/applicationService', () => ({
  default: {
    createApplication: vi.fn(),
  },
}));

describe('Frontend Integration Tests — Forms and User Interactions', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ==========================================
  // 1. LoginPage
  // ==========================================
  describe('<LoginPage /> Form Flow', () => {
    const renderLoginPage = (initialState = null) => {
      return render(
        <AuthContext.Provider value={{ login: mockLogin, isAuthenticated: false, user: null }}>
          <MemoryRouter
            initialEntries={[
              initialState ? { pathname: '/login', state: initialState } : '/login',
            ]}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/student/dashboard" element={<div>Student Dashboard View</div>} />
              <Route path="/recruiter/dashboard" element={<div>Recruiter Dashboard View</div>} />
              <Route path="/target/protected" element={<div>Target Protected Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );
    };

    it('should render login form elements properly', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register now/i })).toHaveAttribute('href', '/register');
    });

    it('should show client validation error if submitted with empty fields', async () => {
      renderLoginPage();

      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(
        screen.getByText('Please enter both your email address and password.')
      ).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should clear validation error when user begins typing', async () => {
      renderLoginPage();

      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });
      expect(screen.getByText(/please enter both/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

      expect(screen.queryByText(/please enter both/i)).not.toBeInTheDocument();
    });

    it('should submit credentials and navigate to student dashboard for student role', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        user: { role: 'student', name: 'Student One' },
      });

      renderLoginPage();

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });

      expect(mockLogin).toHaveBeenCalledWith('student@example.com', 'Password123!');
      await waitFor(() => {
        expect(screen.getByText('Student Dashboard View')).toBeInTheDocument();
      });
    });

    it('should navigate to recruiter dashboard upon successful recruiter login', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        user: { role: 'recruiter', name: 'Recruiter One' },
      });

      renderLoginPage();

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'recruiter@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Recruiter Dashboard View')).toBeInTheDocument();
      });
    });

    it('should respect location.state.from redirect when arriving from a protected route', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        user: { role: 'student' },
      });

      renderLoginPage({ from: { pathname: '/target/protected' } });

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'student@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Target Protected Page')).toBeInTheDocument();
      });
    });

    it('should display error message when login fails with rejected promise', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid email or password.'));

      renderLoginPage();

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'bad@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'WrongPassword!' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 2. ApplicationForm
  // ==========================================
  describe('<ApplicationForm /> Submission Flow', () => {
    const oppId = '60c72b2f9b1d8b2bad6e1a34';

    it('should render textarea with 0 / 2000 character counter', () => {
      render(
        <MemoryRouter>
          <ApplicationForm opportunityId={oppId} />
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument();
      expect(screen.getByText('0 / 2000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();
    });

    it('should update character counter when typing in cover letter textarea', () => {
      render(
        <MemoryRouter>
          <ApplicationForm opportunityId={oppId} />
        </MemoryRouter>
      );

      const textarea = screen.getByLabelText(/cover letter/i);
      fireEvent.change(textarea, { target: { value: 'Hello SkillBridge' } });

      expect(screen.getByText('17 / 2000')).toBeInTheDocument();
    });

    it('should submit application and show success message card', async () => {
      const onSuccess = vi.fn();
      applicationService.createApplication.mockResolvedValueOnce({
        success: true,
        data: { _id: 'app_123', status: 'Applied' },
      });

      render(
        <MemoryRouter>
          <ApplicationForm opportunityId={oppId} onSuccess={onSuccess} />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/cover letter/i), {
        target: { value: 'Passionate full-stack developer.' },
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit application/i }));
      });

      expect(applicationService.createApplication).toHaveBeenCalledWith({
        opportunity: oppId,
        coverLetter: 'Passionate full-stack developer.',
      });

      await waitFor(() => {
        expect(screen.getByText('Application Submitted')).toBeInTheDocument();
        expect(screen.getByText(/Your application has been received/i)).toBeInTheDocument();
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle duplicate application error (409) with warning alert', async () => {
      applicationService.createApplication.mockRejectedValueOnce({
        status: 409,
        message: 'Application already exists for this opportunity.',
      });

      render(
        <MemoryRouter>
          <ApplicationForm opportunityId={oppId} />
        </MemoryRouter>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit application/i }));
      });

      await waitFor(() => {
        expect(
          screen.getByText('You have already submitted an application for this opportunity.')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: /track existing application in my applications/i })
        ).toBeInTheDocument();
      });

      // Submit button should be disabled
      expect(screen.getByRole('button', { name: /submit application/i })).toBeDisabled();
    });

    it('should handle generic API error with error alert', async () => {
      applicationService.createApplication.mockRejectedValueOnce(
        new Error('Network error. Service temporarily unavailable.')
      );

      render(
        <MemoryRouter>
          <ApplicationForm opportunityId={oppId} />
        </MemoryRouter>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit application/i }));
      });

      await waitFor(() => {
        expect(
          screen.getByText('Network error. Service temporarily unavailable.')
        ).toBeInTheDocument();
      });
    });
  });
});
