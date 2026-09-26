import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApplicationStatusBadge from '../../components/common/ApplicationStatusBadge';

describe('Frontend Test Foundation Smoke Test', () => {
  it('should render ApplicationStatusBadge with Applied status', () => {
    render(<ApplicationStatusBadge status="Applied" />);
    expect(screen.getByText('Applied')).toBeInTheDocument();
  });

  it('should render ApplicationStatusBadge with Selected status', () => {
    render(<ApplicationStatusBadge status="Selected" />);
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });
});
