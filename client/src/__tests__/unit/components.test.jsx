import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import OpportunityCard from '../../components/opportunities/OpportunityCard';

describe('Frontend Unit Tests — Common Components', () => {
  // ==========================================
  // 1. ApplicationStatusBadge
  // ==========================================
  describe('<ApplicationStatusBadge />', () => {
    const statuses = [
      { status: 'Applied', expectedBadge: 'Applied' },
      { status: 'Under Review', expectedBadge: 'Under Review' },
      { status: 'Shortlisted', expectedBadge: 'Shortlisted' },
      { status: 'Interview', expectedBadge: 'Interview' },
      { status: 'Selected', expectedBadge: 'Selected' },
      { status: 'Rejected', expectedBadge: 'Rejected' },
    ];

    statuses.forEach(({ status, expectedBadge }) => {
      it(`should correctly render badge for "${status}" status`, () => {
        render(<ApplicationStatusBadge status={status} />);
        expect(screen.getByText(new RegExp(expectedBadge, 'i'))).toBeInTheDocument();
      });
    });

    it('should handle case insensitivity gracefully', () => {
      render(<ApplicationStatusBadge status="interview" />);
      expect(screen.getByText(/interview/i)).toBeInTheDocument();
    });

    it('should fallback gracefully to "Applied" when unknown status is passed', () => {
      render(<ApplicationStatusBadge status="UnknownStatus" />);
      expect(screen.getByText(/unknownstatus/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // 2. LoadingSpinner
  // ==========================================
  describe('<LoadingSpinner />', () => {
    it('should render with default text and accessible role="status"', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('should render with custom text when provided via text prop', () => {
      render(<LoadingSpinner text="Fetching applications..." />);
      expect(screen.getByText('Fetching applications...')).toBeInTheDocument();
    });
  });

  // ==========================================
  // 3. Pagination
  // ==========================================
  describe('<Pagination />', () => {
    it('should not render anything when total pages is 1 or less', () => {
      const { container } = render(
        <MemoryRouter>
          <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
        </MemoryRouter>
      );
      expect(container.firstChild).toBeNull();
    });

    it('should disable Prev button on first page', () => {
      render(
        <MemoryRouter>
          <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
        </MemoryRouter>
      );

      const prevButton = screen.getByRole('button', { name: /prev/i });
      expect(prevButton).toBeDisabled();

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(
        <MemoryRouter>
          <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />
        </MemoryRouter>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();

      const prevButton = screen.getByRole('button', { name: /prev/i });
      expect(prevButton).not.toBeDisabled();
    });

    it('should trigger onPageChange with target page when a page button is clicked', () => {
      const onPageChange = vi.fn();
      render(
        <MemoryRouter>
          <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
        </MemoryRouter>
      );

      const page3Button = screen.getByRole('button', { name: '3' });
      fireEvent.click(page3Button);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should trigger onPageChange with currentPage - 1 when Prev is clicked', () => {
      const onPageChange = vi.fn();
      render(
        <MemoryRouter>
          <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
        </MemoryRouter>
      );

      const prevButton = screen.getByRole('button', { name: /prev/i });
      fireEvent.click(prevButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should trigger onPageChange with currentPage + 1 when Next is clicked', () => {
      const onPageChange = vi.fn();
      render(
        <MemoryRouter>
          <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />
        </MemoryRouter>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(4);
    });
  });

  // ==========================================
  // 4. OpportunityCard
  // ==========================================
  describe('<OpportunityCard />', () => {
    const mockOpportunity = {
      _id: '60c72b2f9b1d8b2bad6e1a34',
      title: 'Full Stack Engineer Intern',
      company: 'Tech Solutions Inc',
      type: 'internship',
      workMode: 'remote',
      location: 'San Francisco, CA',
      stipend: '$2500/month',
      skills: ['react', 'node.js', 'mongodb', 'docker', 'graphql'],
      applicationDeadline: '2026-12-31T00:00:00.000Z',
    };

    it('should render opportunity details correctly', () => {
      render(
        <MemoryRouter>
          <OpportunityCard opportunity={mockOpportunity} />
        </MemoryRouter>
      );

      expect(screen.getByText('Full Stack Engineer Intern')).toBeInTheDocument();
      expect(screen.getByText(/Tech Solutions Inc/i)).toBeInTheDocument();
      expect(screen.getByText(/San Francisco, CA/i)).toBeInTheDocument();
      expect(screen.getByText(/internship/i)).toBeInTheDocument();
      expect(screen.getByText(/remote/i)).toBeInTheDocument();
      expect(screen.getByText(/Stipend: \$2500\/month/i)).toBeInTheDocument();
    });

    it('should render skill tags and overflow count (+1 more)', () => {
      render(
        <MemoryRouter>
          <OpportunityCard opportunity={mockOpportunity} />
        </MemoryRouter>
      );

      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('node.js')).toBeInTheDocument();
      expect(screen.getByText('mongodb')).toBeInTheDocument();
      expect(screen.getByText('docker')).toBeInTheDocument();
      expect(screen.getByText(/\+1 more/i)).toBeInTheDocument();
    });

    it('should link to opportunity detail page', () => {
      render(
        <MemoryRouter>
          <OpportunityCard opportunity={mockOpportunity} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /view details/i });
      expect(link).toHaveAttribute('href', `/opportunities/${mockOpportunity._id}`);
    });

    it('should return null if opportunity prop is not provided', () => {
      const { container } = render(
        <MemoryRouter>
          <OpportunityCard opportunity={null} />
        </MemoryRouter>
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
