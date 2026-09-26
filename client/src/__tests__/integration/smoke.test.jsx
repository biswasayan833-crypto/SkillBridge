import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';

describe('Frontend Integration Component Smoke Test', () => {
  it('should render pagination bar and handle page state', () => {
    render(
      <BrowserRouter>
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
          hasNextPage={true}
          hasPrevPage={true}
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/prev/i)).toBeInTheDocument();
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
