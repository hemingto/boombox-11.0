/**
 * @fileoverview API Integration tests for Edit Appointment functionality
 * @source boombox-11.0/src/app/api/orders/appointments/[id]/edit/route.ts
 * @source boombox-11.0/src/hooks/useAppointmentData.ts
 * @source boombox-11.0/src/lib/services/appointmentService.ts
 * 
 * TEST COVERAGE:
 * - API endpoint integration and response handling
 * - Request/response data transformation
 * - Error handling for various HTTP status codes
 * - Network timeout and retry logic
 * - Concurrent edit conflict resolution
 * - Data validation and sanitization
 * - Performance optimization testing
 * - Cache management and invalidation
 * - Real API response simulation
 * 
 * @refactor Comprehensive API integration tests for edit appointment workflow
 */

import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/AddStorageTestWrapper';
import AccessStorageForm from '@/components/features/orders/AccessStorageForm';
import { AppointmentDetailsResponse } from '@/types/accessStorage.types';

// ===== MOCK SETUP =====

// Mock fetch with detailed response simulation
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock appointment data
const mockAppointmentData: AppointmentDetailsResponse = {
  id: 123,
  userId: 'test-user-id',
  appointmentType: 'Storage Unit Access',
  deliveryReason: 'access',
  planType: 'DIY',
  appointmentDateTime: '2024-02-15T10:00:00Z',
  address: '123 Test Street, Test City, CA 90210',
  zipCode: '90210',
  selectedStorageUnits: [1, 2],
  storageUnitCount: 2,
  description: 'Need to access my storage unit',
  loadingHelpPrice: 50,
  monthlyStorageRate: 100,
  monthlyInsuranceRate: 25,
  calculatedTotal: 175,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  selectedLabor: null,
  status: 'Scheduled',
  stripeCustomerId: 'cus_test123'
};

// Mock appointment data hook
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

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn((key: string) => {
      if (key === 'appointmentType') return 'Storage Unit Access';
      if (key === 'appointmentId') return '123';
      return null;
    }),
    toString: jest.fn(() => 'appointmentType=Storage Unit Access&appointmentId=123')
  }),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        accountType: 'USER'
      }
    },
    status: 'authenticated'
  })
}));

// ===== TEST SUITE =====

describe('Edit Appointment API Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json'
      }),
      json: async () => ({
        success: true,
        appointmentId: 123,
        message: 'Appointment updated successfully',
        updatedFields: ['description', 'appointmentDateTime'],
        warnings: []
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== API ENDPOINT INTEGRATION =====

  describe('API Endpoint Integration', () => {
    it('sends correct PUT request to edit endpoint', async () => {
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
      await user.type(descriptionField, 'Updated description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/orders/appointments/123/edit',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }),
            body: expect.stringContaining('Updated description')
          })
        );
      });
    });

    it('includes all required fields in request body', async () => {
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
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      // Verify required fields
      expect(requestBody).toHaveProperty('userId', 'test-user-id');
      expect(requestBody).toHaveProperty('address');
      expect(requestBody).toHaveProperty('zipCode');
      expect(requestBody).toHaveProperty('appointmentDateTime');
      expect(requestBody).toHaveProperty('planType');
      expect(requestBody).toHaveProperty('deliveryReason');
      expect(requestBody).toHaveProperty('selectedStorageUnits');
      expect(requestBody).toHaveProperty('storageUnitCount');
      expect(requestBody).toHaveProperty('description');
      expect(requestBody).toHaveProperty('appointmentType');
      expect(requestBody).toHaveProperty('calculatedTotal');
      expect(requestBody).toHaveProperty('status', 'Scheduled');
    });

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
        expect(screen.getByText(/appointment updated successfully/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(123);
    });
  });

  // ===== ERROR HANDLING =====

  describe('API Error Handling', () => {
    it('handles 400 validation errors with field mapping', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validation failed',
          fieldErrors: {
            appointmentDateTime: 'Selected time is not available',
            zipCode: 'Service not available in this area',
            selectedStorageUnits: 'Invalid storage unit selection'
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

      // Verify field-specific errors appear
      await waitFor(() => {
        expect(screen.getByText(/selected time is not available/i)).toBeInTheDocument();
        expect(screen.getByText(/service not available in this area/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid storage unit selection/i)).toBeInTheDocument();
      });
    });

    it('handles 404 appointment not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Appointment not found. It may have been cancelled or moved.'
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
        expect(screen.getByText(/appointment not found/i)).toBeInTheDocument();
        expect(screen.getByText(/may have been cancelled or moved/i)).toBeInTheDocument();
      });
    });

    it('handles 409 concurrent edit conflicts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'This appointment has been modified by another user. Please refresh and try again.',
          conflictDetails: {
            lastModified: '2024-02-15T10:30:00Z',
            modifiedBy: 'another-user-id'
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
        expect(screen.getByText(/modified by another user/i)).toBeInTheDocument();
        expect(screen.getByText(/please refresh and try again/i)).toBeInTheDocument();
      });

      // Verify refresh button or retry option is available
      expect(screen.getByRole('button', { name: /refresh/i }) || screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('handles 500 server errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error. Please try again later.'
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
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
      });
    });
  });

  // ===== NETWORK ERROR HANDLING =====

  describe('Network Error Handling', () => {
    it('handles network timeouts with retry mechanism', async () => {
      // First call times out
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));
      
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
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      });

      // Retry succeeds
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/appointment updated successfully/i)).toBeInTheDocument();
      });
    });

    it('handles network connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

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
        expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
      });
    });

    it('implements request timeout with AbortController', async () => {
      let abortController: AbortController | null = null;
      
      mockFetch.mockImplementationOnce((url, options) => {
        abortController = options?.signal?.constructor === AbortSignal.constructor ? 
          { signal: options.signal } as AbortController : null;
        
        return new Promise((resolve, reject) => {
          // Simulate long request
          setTimeout(() => {
            if (options?.signal?.aborted) {
              reject(new Error('Request aborted'));
            } else {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ success: true })
              });
            }
          }, 35000); // Longer than 30s timeout
        });
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

      // Verify timeout handling (would need to be implemented in the actual component)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            signal: expect.any(AbortSignal)
          })
        );
      }, { timeout: 1000 });
    });
  });

  // ===== DATA TRANSFORMATION =====

  describe('Request/Response Data Transformation', () => {
    it('transforms form data to API request format correctly', async () => {
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

      // Change plan type to Full Service
      const fullServiceRadio = screen.getByLabelText(/full service/i);
      await user.click(fullServiceRadio);

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      // Verify data transformation
      expect(requestBody.planType).toBe('Full Service');
      expect(requestBody.selectedStorageUnits).toEqual(expect.arrayContaining([expect.any(Number)]));
      expect(requestBody.storageUnitCount).toBe(requestBody.selectedStorageUnits.length);
      expect(requestBody.calculatedTotal).toEqual(expect.any(Number));
    });

    it('handles API response data correctly', async () => {
      const mockResponse = {
        success: true,
        appointmentId: 123,
        message: 'Appointment updated successfully',
        updatedFields: ['description', 'planType', 'appointmentDateTime'],
        warnings: ['Driver will be reassigned due to plan change'],
        newTotal: 225.50,
        driverReassigned: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

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

      // Verify warnings are displayed
      expect(screen.getByText(/driver will be reassigned/i)).toBeInTheDocument();
    });
  });

  // ===== PERFORMANCE TESTING =====

  describe('Performance and Optimization', () => {
    it('debounces rapid form submissions', async () => {
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
      
      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only make one API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('handles large request payloads efficiently', async () => {
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

      // Add large description
      const largeDescription = 'A'.repeat(5000); // 5KB description
      const descriptionField = screen.getByLabelText(/description/i);
      
      await act(async () => {
        // Use fireEvent for large text to avoid performance issues
        fireEvent.change(descriptionField, { target: { value: largeDescription } });
      });

      const submitButton = screen.getByRole('button', { name: /update appointment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const [url, options] = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(options.body);
      expect(requestBody.description).toBe(largeDescription);
    });

    it('implements proper loading states during API calls', async () => {
      // Slow API response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true, appointmentId: 123 })
          }), 1000)
        )
      );

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

      // Verify loading state
      expect(screen.getByText(/updating appointment/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/updating appointment/i)).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  // ===== CACHE MANAGEMENT =====

  describe('Cache Management', () => {
    it('includes proper cache control headers', async () => {
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
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Cache-Control': 'no-cache'
            })
          })
        );
      });
    });

    it('handles stale data scenarios', async () => {
      // Mock stale data response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Data has been modified. Please refresh.',
          currentData: {
            ...mockAppointmentData,
            description: 'Updated by another user',
            lastModified: '2024-02-15T11:00:00Z'
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
        expect(screen.getByText(/data has been modified/i)).toBeInTheDocument();
      });
    });
  });
});
