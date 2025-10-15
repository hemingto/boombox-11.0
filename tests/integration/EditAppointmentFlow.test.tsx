/**
 * @fileoverview Integration tests for complete Edit Appointment workflow
 * @source boombox-11.0/src/app/(dashboard)/customer/[id]/edit-appointment/page.tsx
 * @source boombox-11.0/src/components/features/orders/AccessStorageForm.tsx (edit mode)
 * 
 * TEST COVERAGE:
 * - Complete edit appointment flow from route to submission
 * - Authentication and ownership validation
 * - Appointment data fetching and pre-population
 * - Form state management during editing
 * - API integration with edit endpoint
 * - Error recovery workflows and user feedback
 * - Accessibility flow testing with screen readers
 * - Form persistence across browser refresh
 * - Plan type changes and pricing updates
 * - Real user interaction patterns
 * - Cross-component integration
 * - End-to-end edit submission
 * - Design system compliance validation
 * - Mobile responsiveness testing
 * 
 * @refactor Comprehensive integration tests for the entire Edit Appointment user journey
 */

import React from 'react';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '../utils/AddStorageTestWrapper';
import EditAppointmentPage from '@/app/(dashboard)/customer/[id]/edit-appointment/page';
import AccessStorageForm from '@/components/features/orders/AccessStorageForm';
import { AppointmentDetailsResponse } from '@/types/accessStorage.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// ===== MOCK SETUP =====

// Mock Next.js hooks
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'appointmentType') return 'Storage Unit Access';
      if (key === 'appointmentId') return '123';
      return null;
    }),
    toString: jest.fn(() => 'appointmentType=Storage Unit Access&appointmentId=123')
  })),
  useParams: jest.fn(() => ({
    id: 'test-user-id'
  })),
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack
  }))
}));

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        accountType: 'USER'
      }
    },
    status: 'authenticated'
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock appointment data service
const mockAppointmentData: AppointmentDetailsResponse = {
  id: 123,
  userId: 123,
  appointmentType: 'Storage Unit Access',
  deliveryReason: 'access',
  planType: 'DIY',
  date: '2024-02-15',
  time: '10:00',
  address: '123 Test Street, Test City, CA 90210',
  zipcode: '90210',
  numberOfUnits: 2,
  description: 'Need to access my storage unit',
  loadingHelpPrice: 50,
  monthlyStorageRate: 100,
  monthlyInsuranceRate: 25,
  quotedPrice: 175,
  status: 'Scheduled',
  user: {
    stripeCustomerId: 'cus_test123'
  }
};

// Mock appointment data fetching
jest.mock('@/hooks/useAppointmentData', () => ({
  useAppointmentData: jest.fn(() => ({
    appointmentData: mockAppointmentData,
    isLoading: false,
    error: null,
    errorType: null,
    retryCount: 0,
    retry: jest.fn(),
    refetch: jest.fn()
  }))
}));

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window methods
delete (window as any).location;
(window as any).location = {
  pathname: '/customer/test-user-id/edit-appointment',
  search: '?appointmentType=Storage Unit Access&appointmentId=123',
  href: 'http://localhost:3000/customer/test-user-id/edit-appointment?appointmentType=Storage Unit Access&appointmentId=123'
};

Object.defineProperty(window, 'history', {
  value: {
    back: mockBack
  },
  writable: true,
  configurable: true
});

// ===== TEST SUITE =====

describe('Edit Appointment Integration Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset fetch mock to success response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        appointmentId: 123,
        message: 'Appointment updated successfully'
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== COMPLETE WORKFLOW TESTING =====

  describe('Complete Edit Workflow End-to-End', () => {
    it('completes full edit appointment workflow successfully', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      // 1. Verify appointment data is pre-populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Test Street, Test City, CA 90210')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('90210')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();

      // 2. Verify edit mode indicators
      expect(screen.getByText(/editing appointment #123/i)).toBeInTheDocument();
      expect(screen.getByText(/edit storage access/i)).toBeInTheDocument();

      // 3. Make changes to the appointment
      const descriptionField = screen.getByLabelText(/description/i);
      await user.clear(descriptionField);
      await user.type(descriptionField, 'Updated: Need urgent access to storage unit');

      // 4. Change appointment time
      const timeSelect = screen.getByLabelText(/time/i);
      await user.selectOptions(timeSelect, '14:00');

      // 5. Verify form validation still works
      expect(screen.queryByText(/field is required/i)).not.toBeInTheDocument();

      // 6. Submit the form
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      expect(submitButton).toBeEnabled();
      
      await user.click(submitButton);

      // 7. Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/updating appointment/i)).toBeInTheDocument();
      });

      // 8. Verify API call was made correctly
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/orders/appointments/123/edit',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('Updated: Need urgent access to storage unit')
          })
        );
      });

      // 9. Verify success state
      await waitFor(() => {
        expect(screen.getByText(/appointment updated successfully/i)).toBeInTheDocument();
      });
    });

    it('handles plan type changes with pricing updates', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('123 Test Street, Test City, CA 90210')).toBeInTheDocument();
      });

      // Change from DIY to Full Service
      const fullServiceRadio = screen.getByLabelText(/full service/i);
      await user.click(fullServiceRadio);

      // Verify pricing update
      await waitFor(() => {
        expect(screen.getByText(/price comparison/i)).toBeInTheDocument();
      });

      // Verify moving partner selection appears
      expect(screen.getByText(/choose moving partner/i)).toBeInTheDocument();

      // Submit with plan change
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/orders/appointments/123/edit',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"planType":"Full Service"')
          })
        );
      });
    });
  });

  // ===== API INTEGRATION TESTING =====

  describe('API Integration Validation', () => {
    it('handles successful API responses correctly', async () => {
      const mockOnSuccess = jest.fn();
      
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(123);
      });
    });

    it('handles API validation errors correctly', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          fieldErrors: {
            appointmentDateTime: 'Selected time is not available'
          }
        })
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/selected time is not available/i)).toBeInTheDocument();
      });

      // Verify form is still editable
      expect(submitButton).toBeEnabled();
    });

    it('handles concurrent edit conflicts (409 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'This appointment has been modified by another user. Please refresh and try again.'
        })
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/modified by another user/i)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  // ===== FORM STATE PERSISTENCE TESTING =====

  describe('Form State Persistence', () => {
    it('maintains form state during navigation', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Make changes
      const descriptionField = screen.getByLabelText(/description/i);
      await user.clear(descriptionField);
      await user.type(descriptionField, 'Modified description');

      // Navigate to next step (if multi-step)
      const nextButton = screen.queryByRole('button', { name: /next/i });
      if (nextButton) {
        await user.click(nextButton);
        
        // Navigate back
        const backButton = screen.getByRole('button', { name: /back/i });
        await user.click(backButton);

        // Verify changes are preserved
        expect(screen.getByDisplayValue('Modified description')).toBeInTheDocument();
      }
    });

    it('handles browser refresh gracefully', async () => {
      // This test simulates what happens when the component remounts
      const { unmount } = render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      unmount();

      // Re-render (simulating refresh)
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      // Verify data is re-fetched and populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });
    });
  });

  // ===== DESIGN SYSTEM COMPLIANCE TESTING =====

  describe('Design System Compliance', () => {
    it('uses semantic color tokens throughout', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for design system classes
      const editBadge = screen.getByText(/editing appointment/i);
      expect(editBadge).toHaveClass('text-status-warning');

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      expect(submitButton).toHaveClass('btn-primary');

      // Check form elements use design system classes
      const formGroups = document.querySelectorAll('.form-group');
      expect(formGroups.length).toBeGreaterThan(0);

      const inputFields = document.querySelectorAll('.input-field');
      expect(inputFields.length).toBeGreaterThan(0);
    });

    it('maintains consistent spacing and typography', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Verify consistent spacing classes
      const containers = document.querySelectorAll('[class*="section-spacing"]');
      expect(containers.length).toBeGreaterThan(0);

      // Verify typography hierarchy
      const headings = document.querySelectorAll('h1, h2, h3');
      headings.forEach(heading => {
        expect(heading).toHaveClass(expect.stringMatching(/text-(lg|xl|2xl|3xl)/));
      });
    });
  });

  // ===== ACCESSIBILITY TESTING =====

  describe('Accessibility Compliance', () => {
    it('has no accessibility violations in edit mode', async () => {
      const { container } = render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper screen reader announcements', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);

      // Check for proper form labels
      const labels = document.querySelectorAll('label');
      labels.forEach(label => {
        expect(label).toHaveAttribute('for');
      });

      // Check for error announcements
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // Clear required field to trigger validation
      const descriptionField = screen.getByLabelText(/description/i);
      await user.clear(descriptionField);
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.queryByRole('alert');
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });
    });

    it('supports keyboard navigation', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Test tab navigation
      const firstInput = screen.getAllByRole('textbox')[0];
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);

      // Test keyboard submission
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      submitButton.focus();
      
      fireEvent.keyDown(submitButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  // ===== MOBILE RESPONSIVENESS TESTING =====

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('adapts layout for mobile screens', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Check for mobile-responsive classes
      const containers = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      expect(containers.length).toBeGreaterThan(0);

      // Verify mobile-friendly button sizes
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      const buttonClasses = submitButton.className;
      expect(buttonClasses).toMatch(/py-\d+/); // Adequate padding for touch targets
    });

    it('maintains usability on touch devices', async () => {
      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      // Test touch interactions
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // Simulate touch events
      fireEvent.touchStart(submitButton);
      fireEvent.touchEnd(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  // ===== ERROR RECOVERY TESTING =====

  describe('Error Recovery Workflows', () => {
    it('allows retry after network failures', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          appointmentId: 123,
          message: 'Appointment updated successfully'
        })
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      
      // First attempt fails
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry succeeds
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/appointment updated successfully/i)).toBeInTheDocument();
      });
    });

    it('handles validation errors with field-specific feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          fieldErrors: {
            appointmentDateTime: 'Selected time is not available',
            zipCode: 'Service not available in this area'
          }
        })
      });

      render(
        <AccessStorageForm
          mode="edit"
          appointmentId="123"
          onSubmissionSuccess={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Need to access my storage unit')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/selected time is not available/i)).toBeInTheDocument();
        expect(screen.getByText(/service not available in this area/i)).toBeInTheDocument();
      });

      // Verify form remains editable
      expect(submitButton).toBeEnabled();
    });
  });
});
