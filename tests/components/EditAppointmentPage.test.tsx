/**
 * @fileoverview Tests for EditAppointmentPage route component
 * Following boombox-11.0 testing standards and accessibility requirements
 * 
 * TEST COVERAGE:
 * - Route parameter extraction and validation
 * - Authentication and session management
 * - User permission and ownership validation
 * - Appointment type routing logic
 * - Error handling and edge cases
 * - Loading states and accessibility
 * - Component rendering and navigation
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EditAppointmentPage from '@/app/(dashboard)/customer/[id]/edit-appointment/page';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock next-auth session
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock AccessStorageForm component
jest.mock('@/components/features/orders', () => ({
  AccessStorageForm: function MockAccessStorageForm({ 
    mode, 
    appointmentId, 
    onSubmissionSuccess 
  }: { 
    mode?: string; 
    appointmentId?: string; 
    onSubmissionSuccess?: (id: number) => void; 
  }) {
    return (
      <div data-testid="access-storage-form">
        <div>Mode: {mode}</div>
        <div>Appointment ID: {appointmentId}</div>
        <button 
          onClick={() => onSubmissionSuccess?.(123)}
          data-testid="mock-submit-button"
        >
          Submit Edit
        </button>
      </div>
    );
  }
}));

// Mock LoadingOverlay component
jest.mock('@/components/ui/primitives', () => ({
  LoadingOverlay: function MockLoadingOverlay({ 
    visible, 
    message, 
    className,
    'aria-label': ariaLabel 
  }: { 
    visible: boolean; 
    message: string; 
    className?: string;
    'aria-label'?: string;
  }) {
    if (!visible) return null;
    return (
      <div 
        data-testid="loading-overlay" 
        className={className}
        aria-label={ariaLabel}
      >
        {message}
      </div>
    );
  }
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window methods
const mockHistoryBack = jest.fn();
const mockConfirm = jest.fn();
Object.defineProperty(window, 'history', {
  value: { back: mockHistoryBack },
  writable: true,
});
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('EditAppointmentPage', () => {
  const user = userEvent.setup();
  
  // Mock implementations
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  const mockSearchParams = {
    get: jest.fn(),
  };
  const mockParams = {
    id: 'test-user-123',
  };

  // Default session data
  const mockSession = {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      accountType: 'USER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    // Default search params
    mockSearchParams.get.mockImplementation((key: string) => {
      if (key === 'appointmentType') return 'Storage Unit Access';
      if (key === 'appointmentId') return '456';
      return null;
    });

    // Default successful appointment ownership validation
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 456,
          userId: 'test-user-123',
          appointmentType: 'Storage Unit Access',
        },
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== BASIC RENDERING TESTS =====

  describe('Basic Rendering', () => {
    it('renders without crashing', async () => {
      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<EditAppointmentPage />);
      
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      expect(screen.getByText('Validating permissions...')).toBeInTheDocument();
    });

    it('renders AccessStorageForm with correct props for edit mode', async () => {
      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        const form = screen.getByTestId('access-storage-form');
        expect(form).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();
        expect(screen.getByText('Appointment ID: 456')).toBeInTheDocument();
      });
    });
  });

  // ===== AUTHENTICATION TESTS =====

  describe('Authentication', () => {
  it('redirects to login when unauthenticated', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // Mock window.location for URL construction
    delete (window as any).location;
    (window as any).location = {
      pathname: '/customer/test-user-123/edit-appointment',
      search: '?appointmentType=Storage%20Unit%20Access&appointmentId=456',
    };

    render(<EditAppointmentPage />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('/login?returnUrl=')
      );
    });
  });

    it('shows error when session is invalid', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: { user: null }, // Invalid session
        status: 'authenticated',
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Invalid session. Please log in again.')).toBeInTheDocument();
      });
    });

    it('validates user matches URL user ID', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'different-user-456', // Different from URL user ID
            accountType: 'USER',
          },
        },
        status: 'authenticated',
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to edit this appointment.')).toBeInTheDocument();
      });
    });

    it('validates user account type is USER', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'test-user-123',
            accountType: 'ADMIN', // Not USER account type
          },
        },
        status: 'authenticated',
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Only customers can edit appointments.')).toBeInTheDocument();
      });
    });
  });

  // ===== APPOINTMENT OWNERSHIP VALIDATION TESTS =====

  describe('Appointment Ownership Validation', () => {
    it('validates appointment ownership successfully', async () => {
      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/orders/appointments/456/details',
          expect.objectContaining({
            headers: {
              'Cache-Control': 'no-cache',
            },
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
    });

    it('handles appointment not found (404)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Appointment not found. It may have been cancelled or moved.')).toBeInTheDocument();
      });
    });

    it('handles permission denied (403)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to edit this appointment.')).toBeInTheDocument();
      });
    });

    it('handles server errors during ownership validation', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Unable to verify appointment ownership. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles network errors during ownership validation', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Unable to verify appointment ownership. Please try again.')).toBeInTheDocument();
      });
    });

    it('validates appointment belongs to current user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 456,
            userId: 'different-user-789', // Different user owns the appointment
            appointmentType: 'Storage Unit Access',
          },
        }),
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to edit this appointment.')).toBeInTheDocument();
      });
    });
  });

  // ===== PARAMETER VALIDATION TESTS =====

  describe('Parameter Validation', () => {
    it('shows error when appointment ID is missing', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Storage Unit Access';
        if (key === 'appointmentId') return null; // Missing appointment ID
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Missing Appointment ID')).toBeInTheDocument();
        expect(screen.getByText('The appointment ID is required to edit an appointment. Please check the URL and try again.')).toBeInTheDocument();
      });
    });

    it('shows error when appointment type is missing', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return null; // Missing appointment type
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Appointment Type')).toBeInTheDocument();
        expect(screen.getByText('The appointment type is missing or invalid. Please check the URL and try again.')).toBeInTheDocument();
      });
    });

    it('shows error when user ID is missing', async () => {
      (useParams as jest.Mock).mockReturnValue({
        id: null, // Missing user ID
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to edit this appointment.')).toBeInTheDocument();
      });
    });
  });

  // ===== APPOINTMENT TYPE ROUTING TESTS =====

  describe('Appointment Type Routing', () => {
    it('renders AccessStorageForm for Storage Unit Access appointments', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Storage Unit Access';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();
      });
    });

    it('renders AccessStorageForm for End Storage Term appointments', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'End Storage Term';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
        expect(screen.getByText('Mode: edit')).toBeInTheDocument();
      });
    });

    it('shows not available message for Initial Pickup appointments', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Initial Pickup';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Not Available')).toBeInTheDocument();
        expect(screen.getByText('Editing for "Initial Pickup" appointments is not yet available. This feature will be implemented in a future update.')).toBeInTheDocument();
      });
    });

    it('shows not available message for Additional Storage appointments', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Additional Storage';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Not Available')).toBeInTheDocument();
        expect(screen.getByText('Editing for "Additional Storage" appointments is not yet available. This feature will be implemented in a future update.')).toBeInTheDocument();
      });
    });

    it('shows error for unknown appointment types', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Unknown Type';
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unsupported Appointment Type')).toBeInTheDocument();
        expect(screen.getByText('The appointment type "Unknown Type" is not supported for editing.')).toBeInTheDocument();
      });
    });
  });

  // ===== NAVIGATION AND INTERACTION TESTS =====

  describe('Navigation and Interactions', () => {
    it('handles successful edit submission', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('mock-submit-button');
      await user.click(submitButton);

      expect(consoleSpy).toHaveBeenCalledWith('Appointment updated successfully:', 123);
      
      consoleSpy.mockRestore();
    });

    it('handles go back navigation from error states', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return null; // Missing to trigger error
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Appointment Type')).toBeInTheDocument();
      });

      const goBackButton = screen.getByText('Go Back');
      await user.click(goBackButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });

    it('handles login navigation from access denied state', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'different-user-456', // Different from URL user ID
            accountType: 'USER',
          },
        },
        status: 'authenticated',
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      const loginButton = screen.getByText('Login');
      await user.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  // ===== ACCESSIBILITY TESTS =====

  describe('Accessibility', () => {
    it('has no accessibility violations in normal state', async () => {
      const { container } = render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations in error state', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return null; // Missing to trigger error
        if (key === 'appointmentId') return '456';
        return null;
      });

      const { container } = render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown Appointment Type')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for error states', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return null;
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
        expect(errorElement).toHaveTextContent('Unknown Appointment Type');
      });
    });

    it('has proper ARIA labels for loading states', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<EditAppointmentPage />);
      
      const loadingOverlay = screen.getByTestId('loading-overlay');
      expect(loadingOverlay).toHaveAttribute('aria-label', 'Validating user permissions');
    });

    it('has proper ARIA labels for buttons', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return null;
        if (key === 'appointmentId') return '456';
        return null;
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        const goBackButton = screen.getByLabelText('Go back to previous page');
        expect(goBackButton).toBeInTheDocument();
      });
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed appointment data response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: null, // Malformed response
        }),
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to edit this appointment.')).toBeInTheDocument();
      });
    });

    it('handles appointment data with string userId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 456,
            userId: 'test-user-123', // String userId should work
            appointmentType: 'Storage Unit Access',
          },
        }),
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
    });

    it('handles appointment data with numeric userId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 456,
            userId: 123, // Numeric userId should be converted to string
            appointmentType: 'Storage Unit Access',
          },
        }),
      });

      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: '123', // String ID in session
            accountType: 'USER',
          },
        },
        status: 'authenticated',
      });

      (useParams as jest.Mock).mockReturnValue({
        id: '123', // Match the session user ID
      });

      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
    });

    it('skips appointment ownership validation when no appointment ID', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Storage Unit Access';
        if (key === 'appointmentId') return null; // No appointment ID
        return null;
      });

      render(<EditAppointmentPage />);
      
      // Should show missing appointment ID error without calling fetch
      await waitFor(() => {
        expect(screen.getByText('Missing Appointment ID')).toBeInTheDocument();
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const startTime = performance.now();
      
      render(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('handles rapid parameter changes efficiently', async () => {
      const { rerender } = render(<EditAppointmentPage />);
      
      // Change appointment type multiple times rapidly
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'End Storage Term';
        if (key === 'appointmentId') return '456';
        return null;
      });
      
      rerender(<EditAppointmentPage />);
      
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'appointmentType') return 'Storage Unit Access';
        if (key === 'appointmentId') return '456';
        return null;
      });
      
      rerender(<EditAppointmentPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('access-storage-form')).toBeInTheDocument();
      });
      
      // Should handle rapid changes without errors
      expect(screen.getByText('Mode: edit')).toBeInTheDocument();
    });
  });
});
