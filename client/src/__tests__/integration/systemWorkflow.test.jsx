import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthContext } from '../../context/AuthContext';
import ApplicationForm from '../../components/applications/ApplicationForm';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';
import OpportunityCard from '../../components/opportunities/OpportunityCard';
import Navbar from '../../components/layout/Navbar';
import applicationService from '../../services/applicationService';

// Mock applicationService
vi.mock('../../services/applicationService', () => ({
  default: {
    createApplication: vi.fn(),
  },
}));

describe('Frontend System / UAT Tests — End-to-End User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('System Journey 1: Student logs in, discovers opportunity, applies, and checks application status', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: true,
      user: { _id: 'stu_101', name: 'Maya Lin', email: 'maya@student.edu', role: 'student' },
      token: 'jwt_maya_token',
    });

    const mockOpportunity = {
      _id: 'opp_555',
      title: 'Full Stack Web Developer Intern',
      company: 'Tech Horizons',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote, US',
      stipend: '$2800/month',
      skills: ['react', 'node.js', 'mongodb'],
      applicationDeadline: '2026-12-31T00:00:00.000Z',
    };

    applicationService.createApplication.mockResolvedValueOnce({
      success: true,
      data: {
        _id: 'app_999',
        opportunity: mockOpportunity,
        status: 'Applied',
      },
    });

    // Render interactive multi-page router simulating student workflow
    render(
      <AuthContext.Provider
        value={{
          login: mockLogin,
          isAuthenticated: true,
          user: { name: 'Maya Lin', role: 'student' },
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/opportunities']}>
          <Navbar />
          <Routes>
            {/* 1. Discover Opportunities */}
            <Route
              path="/opportunities"
              element={
                <div>
                  <h2>Opportunities Board</h2>
                  <OpportunityCard opportunity={mockOpportunity} />
                </div>
              }
            />

            {/* 2. Opportunity Details & Application Form */}
            <Route
              path="/opportunities/:id"
              element={
                <div>
                  <h2>{mockOpportunity.title}</h2>
                  <p>{mockOpportunity.company}</p>
                  <ApplicationForm opportunityId={mockOpportunity._id} />
                </div>
              }
            />

            {/* 3. Student Applications Tracking */}
            <Route
              path="/student/applications"
              element={
                <div>
                  <h2>My Applications</h2>
                  <div data-testid="app-card">
                    <span>{mockOpportunity.title}</span>
                    <ApplicationStatusBadge status="Applied" />
                  </div>
                </div>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // 1. Student sees Opportunity Board
    expect(screen.getByText('Opportunities Board')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Web Developer Intern')).toBeInTheDocument();
    expect(screen.getByText(/Tech Horizons/i)).toBeInTheDocument();

    // 2. Student clicks "View Details" to open application form
    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toHaveAttribute('href', '/opportunities/opp_555');

    fireEvent.click(viewDetailsLink);

    // 3. Student arrives at Application Form
    expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument();

    // 4. Student writes statement of interest and submits
    fireEvent.change(screen.getByLabelText(/cover letter/i), {
      target: { value: 'Passionate about scalable React web applications.' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit application/i }));
    });

    // 5. Verifies confirmation card and deep link
    await waitFor(() => {
      expect(screen.getByText('Application Submitted')).toBeInTheDocument();
    });

    const myAppsLink = screen.getByRole('link', { name: /view my applications/i });
    expect(myAppsLink).toHaveAttribute('href', '/student/applications');

    // 6. Student navigates to My Applications and verifies status badge
    fireEvent.click(myAppsLink);

    expect(screen.getByRole('heading', { name: 'My Applications' })).toBeInTheDocument();
    expect(screen.getByText(/applied/i)).toBeInTheDocument();
  });

  it('System Journey 2: Recruiter navbar RBAC and navigation view validation', () => {
    render(
      <AuthContext.Provider
        value={{
          isAuthenticated: true,
          user: { name: 'Arthur Recruiter', role: 'recruiter' },
          logout: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/recruiter/dashboard']}>
          <Navbar />
          <Routes>
            <Route path="/recruiter/dashboard" element={<div>Recruiter Dashboard Panel</div>} />
            <Route path="/recruiter/opportunities" element={<div>My Opportunities Management</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // 1. Verifies recruiter navbar shows recruiter badge and specific links
    expect(screen.getByText(/Arthur Recruiter \(recruiter\)/i)).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Opportunities')).toBeInTheDocument();

    // Student-only links must NOT appear
    expect(screen.queryByText('My Applications')).not.toBeInTheDocument();

    // 2. Navigation to "My Opportunities"
    const myOppLink = screen.getByRole('link', { name: /my opportunities/i });
    fireEvent.click(myOppLink);

    expect(screen.getByText('My Opportunities Management')).toBeInTheDocument();
  });
});
