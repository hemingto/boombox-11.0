/**
 * @fileoverview Tests for StorageStatusBadge component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StorageStatusBadge } from '@/components/features/admin/shared/buttons/StorageStatusBadge';

describe('StorageStatusBadge', () => {
  it('renders Empty status with green styling', () => {
    render(<StorageStatusBadge status="Empty" />);
    const badge = screen.getByText('Empty');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('renders Occupied status with blue styling', () => {
    render(<StorageStatusBadge status="Occupied" />);
    const badge = screen.getByText('Occupied');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('renders Pending Cleaning status with red styling', () => {
    render(<StorageStatusBadge status="Pending Cleaning" />);
    const badge = screen.getByText('Pending Cleaning');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-50', 'text-red-700');
  });

  it('renders unknown status with gray styling', () => {
    render(<StorageStatusBadge status="Unknown" />);
    const badge = screen.getByText('Unknown');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-50', 'text-gray-700');
  });

  it('applies custom className', () => {
    render(<StorageStatusBadge status="Empty" className="custom-class" />);
    const badge = screen.getByText('Empty');
    expect(badge).toHaveClass('custom-class');
  });

  it('includes ring styling', () => {
    render(<StorageStatusBadge status="Empty" />);
    const badge = screen.getByText('Empty');
    expect(badge).toHaveClass('ring-1', 'ring-inset', 'ring-green-700/10');
  });

  it('includes font styling', () => {
    render(<StorageStatusBadge status="Occupied" />);
    const badge = screen.getByText('Occupied');
    expect(badge).toHaveClass('font-medium', 'font-inter');
  });

  it('includes padding and sizing', () => {
    render(<StorageStatusBadge status="Pending Cleaning" />);
    const badge = screen.getByText('Pending Cleaning');
    expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm', 'rounded-md');
  });
});
