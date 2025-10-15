/**
 * @fileoverview Integration tests for Edit Appointment Route Page
 * @source boombox-11.0/src/app/(dashboard)/customer/[id]/edit-appointment/page.tsx
 * 
 * TEST COVERAGE:
 * - Appointment type routing logic
 * - URL parameter handling
 * - Error states for unsupported types
 * - Provider integration
 * 
 * @refactor Simplified to focus on routing logic, not full form testing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the complex form components with simple placeholders
jest.mock('@/components/features/orders/AccessStorageForm', () => {
  return function MockAccessStorageForm() {
    return <div data-testid="access-storage-form">Access Storage Form</div>;
  };
});

jest.mock('@/components/features/orders/AddStorageForm', () => {
  return function MockAddStorageForm() {
    return <div data-testid="add-storage-form">Add Storage Form</div>;
  };
});

// Mock Next.js hooks
const mockSearchParamsGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

// Mock UserContext
jest.mock('@/contexts/UserContext', () => ({
  useUser: () => 'test-user-id',
}));

// Import the page component after mocks
import EditAppointment from '@/app/(dashboard)/customer/[id]/edit-appointment/page';

describe('EditAppointmentRoute Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Access Storage Appointment Type', () => {
    it('renders AccessStorageForm for "Access Storage" type', () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Access Storage';
        if (key === 'appointmentId') return '123';
        return null;
      });

      render(<EditAppointment />);
      
      expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      expect(screen.queryByTestId('add-storage-form')).not.toBeInTheDocument();
    });
  });

  describe('Additional Storage Appointment Type', () => {
    it('renders AddStorageForm for "Additional Storage" type', () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Additional Storage';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointment />);
      
      expect(screen.getByTestId('add-storage-form')).toBeInTheDocument();
      expect(screen.queryByTestId('access-storage-form')).not.toBeInTheDocument();
    });
  });

  describe('Unsupported Appointment Types', () => {
    it('renders error message for unsupported appointment type', () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Initial Pickup';
        if (key === 'appointmentId') return '789';
        return null;
      });

      render(<EditAppointment />);
      
      expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
      expect(screen.getByText(/Initial Pickup/)).toBeInTheDocument();
      expect(screen.getByText(/only supported for Access Storage and Additional Storage/)).toBeInTheDocument();
      expect(screen.queryByTestId('access-storage-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-storage-form')).not.toBeInTheDocument();
    });

    it('renders error message when appointmentType is missing', () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'appointmentId') return '999';
        return null;
      });

      render(<EditAppointment />);
      
      expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
      expect(screen.getByText(/Not specified/)).toBeInTheDocument();
      expect(screen.queryByTestId('access-storage-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-storage-form')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards for error state', async () => {
      mockSearchParamsGet.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Initial Pickup';
        return null;
      });

      const { container } = render(<EditAppointment />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
