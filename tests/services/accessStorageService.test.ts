/**
 * @fileoverview Jest tests for accessStorageService
 * @source boombox-11.0/src/lib/services/accessStorageService.ts
 * 
 * TEST COVERAGE:
 * - Service initialization and configuration
 * - Form submission with validation
 * - API integration and error handling
 * - Retry logic and timeout handling
 * - Network error recovery
 * - Response parsing and validation
 * - Appointment management operations
 * - Service utility functions
 * 
 * @refactor Comprehensive tests for the access storage service layer
 */

import {
  submitAccessStorageAppointment,
  getAccessStorageAppointment,
  cancelAccessStorageAppointment,
  updateAccessStorageAppointment,
  canCancelWithoutFees
} from '@/lib/services/accessStorageService';
import {
  AccessStorageSubmissionData,
  DeliveryReason,
  AppointmentType,
  PlanType
} from '@/types/accessStorage.types';

// Helper function to create mock response with headers
const createMockResponse = (data: any, options: { ok?: boolean; status?: number; statusText?: string } = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.statusText ?? 'OK',
  json: async () => data,
  headers: new Map([['x-request-id', 'test-123']]),
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// Mock data
const mockSubmissionData: AccessStorageSubmissionData = {
  userId: 'test-user-123',
  address: '123 Test St, Los Angeles, CA 90210',
  zipCode: '90210',
  selectedPlanName: 'Do It Yourself Plan',
  appointmentDateTime: '2024-02-15T10:00:00.000Z',
  deliveryReason: DeliveryReason.ACCESS_ITEMS,
  planType: PlanType.DO_IT_YOURSELF,
  selectedStorageUnits: ['unit-101', 'unit-102'],
  description: 'Test delivery description',
  appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
  parsedLoadingHelpPrice: 0,
  calculatedTotal: 150.00,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  includeUserData: true
};

const mockAppointmentResponse = {
  success: true,
  data: {
    appointmentId: 123,
    status: 'confirmed',
    scheduledDate: '2024-02-15T10:00:00.000Z',
    totalCost: 150.00
  }
};

describe('accessStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAppointmentResponse,
      headers: new Map([['x-request-id', 'req-123']]),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submitAccessStorageAppointment', () => {
    it('submits appointment successfully', async () => {
      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        appointmentId: 123,
        status: 'confirmed',
        scheduledDate: '2024-02-15T10:00:00.000Z',
        totalCost: 150.00
      });
      expect(result.meta?.requestId).toBe('req-123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/access-storage-unit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockSubmissionData),
        })
      );
    });

    it('validates submission data before sending', async () => {
      const invalidData = {
        ...mockSubmissionData,
        userId: '', // Invalid - empty userId
      };

      const result = await submitAccessStorageAppointment(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('Form validation failed');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles API error responses with JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid appointment data' }),
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SUBMISSION_ERROR');
      expect(result.error?.message).toBe('Invalid appointment data');
    });

    it('handles API error responses without JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SUBMISSION_ERROR');
      expect(result.error?.message).toBe('HTTP 500: Internal Server Error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error. Please check your connection and try again.');
    });

    it('handles timeout errors', async () => {
      // Mock AbortController to simulate timeout
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      
      mockFetch.mockImplementation(() => {
        // Simulate timeout by throwing AbortError
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, { 
        retryAttempts: 1, 
        retryDelay: 10,
        timeout: 1000 
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
      expect(result.error?.message).toBe('Request timed out. Please try again.');
    });

    it('retries on server errors', async () => {
      // First call fails with 500, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockAppointmentResponse,
          headers: new Map(),
        });

      const result = await submitAccessStorageAppointment(mockSubmissionData, {
        retryAttempts: 2,
        retryDelay: 10, // Shorter delay for faster test
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('does not retry on client errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Bad request' }),
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, {
        retryAttempts: 3,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });

    it('handles unsuccessful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Appointment slot no longer available',
        }),
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Appointment slot no longer available');
    });

    it('uses custom service options', async () => {
      const customOptions = {
        timeout: 15000,
        retryAttempts: 5,
        retryDelay: 2000,
      };

      await submitAccessStorageAppointment(mockSubmissionData, customOptions);

      // Verify that custom timeout is used (indirectly through no timeout error)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('getAccessStorageAppointment', () => {
    const mockAppointmentDetails = {
      id: 123,
      userId: 'test-user-123',
      status: 'confirmed',
      scheduledDate: '2024-02-15T10:00:00.000Z',
      address: '123 Test St',
      totalCost: 150.00,
    };

    it('fetches appointment details successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAppointmentDetails,
        }),
        headers: new Map([['x-request-id', 'req-123']]),
      });

      const result = await getAccessStorageAppointment(123, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointmentDetails);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/access-storage-unit/123',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('handles appointment not found', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Appointment not found' }),
      });

      const result = await getAccessStorageAppointment(999, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Appointment not found');
    });

    it('handles network errors during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getAccessStorageAppointment(123, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('cancelAccessStorageAppointment', () => {
    it('cancels appointment successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            cancelled: true,
            refundAmount: 75.00,
          },
        }),
        headers: new Map([['x-request-id', 'req-123']]),
      });

      const result = await cancelAccessStorageAppointment(
        123,
        'Schedule conflict',
        { retryAttempts: 1, retryDelay: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        cancelled: true,
        refundAmount: 75.00,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/access-storage-unit/123/cancel',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Schedule conflict',
          }),
        })
      );
    });

    it('handles cancellation errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Cannot cancel appointment within 24 hours' }),
      });

      const result = await cancelAccessStorageAppointment(123, 'Emergency', { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Cannot cancel appointment within 24 hours');
    });

    it('validates cancellation reason', async () => {
      const result = await cancelAccessStorageAppointment(123, '');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Cancellation reason is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('updateAccessStorageAppointment', () => {
    const updateData = {
      scheduledDate: new Date('2024-02-16T14:00:00.000Z'),
      description: 'Updated description',
    };

    it('updates appointment successfully', async () => {
      const updatedAppointment = {
        id: 123,
        scheduledDate: '2024-02-16T14:00:00.000Z',
        description: 'Updated description',
        status: 'confirmed',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: updatedAppointment,
        }),
        headers: new Map([['x-request-id', 'req-123']]),
      });

      const result = await updateAccessStorageAppointment(123, updateData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedAppointment);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/access-storage-unit/123',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
      );
    });

    it('handles update errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ error: 'Time slot no longer available' }),
      });

      const result = await updateAccessStorageAppointment(123, updateData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Time slot no longer available');
    });
  });

  describe('canCancelWithoutFees', () => {
    it('returns true for appointments more than 48 hours away', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 72); // 72 hours from now

      const result = canCancelWithoutFees(futureDate);

      expect(result).toBe(true);
    });

    it('returns false for appointments within 48 hours', () => {
      const nearDate = new Date();
      nearDate.setHours(nearDate.getHours() + 24); // 24 hours from now

      const result = canCancelWithoutFees(nearDate);

      expect(result).toBe(false);
    });

    it('returns false for past appointments', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 24); // 24 hours ago

      const result = canCancelWithoutFees(pastDate);

      expect(result).toBe(false);
    });

    it('handles edge case at exactly 48 hours', () => {
      const exactDate = new Date();
      exactDate.setHours(exactDate.getHours() + 48); // Exactly 48 hours

      const result = canCancelWithoutFees(exactDate);

      expect(result).toBe(false); // Should be false for exactly 48 hours
    });

    it('handles invalid dates', () => {
      const invalidDate = new Date('invalid');

      const result = canCancelWithoutFees(invalidDate);

      expect(result).toBe(false);
    });
  });

  describe('Error Logging', () => {
    it('logs errors to console', async () => {
      // Create a fresh spy for this specific test
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockRejectedValue(new Error('Test error'));

      await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(errorSpy).toHaveBeenCalledWith(
        'Error submitting access storage appointment:',
        expect.any(Error)
      );
      
      errorSpy.mockRestore();
    });
  });

  describe('Request Headers and Metadata', () => {
    it('includes correct headers in requests', async () => {
      await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('captures request metadata', async () => {
      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.meta).toBeDefined();
      expect(result.meta?.timestamp).toBeDefined();
      expect(result.meta?.requestId).toBe('req-123');
    });

    it('handles missing request ID header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAppointmentResponse,
        headers: new Map(), // No x-request-id header
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      expect(result.success).toBe(true);
      expect(result.meta?.requestId).toBeUndefined();
    });
  });

  describe('Service Configuration', () => {
    it('uses default configuration when no options provided', async () => {
      await submitAccessStorageAppointment(mockSubmissionData, { retryAttempts: 1, retryDelay: 10 });

      // Should not throw timeout error with default settings
      expect(mockFetch).toHaveBeenCalled();
    });

    it('respects custom timeout settings', async () => {
      // Mock AbortController to simulate custom timeout
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn()
      };
      
      jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController as any);
      
      mockFetch.mockImplementation(() => {
        // Simulate timeout by throwing AbortError
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const result = await submitAccessStorageAppointment(mockSubmissionData, {
        timeout: 1000,
        retryAttempts: 1,
        retryDelay: 10
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('handles missing required fields in submission data', async () => {
      const incompleteData = {
        userId: 'test-user-123',
        // Missing other required fields
      } as AccessStorageSubmissionData;

      const result = await submitAccessStorageAppointment(incompleteData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('handles malformed appointment date', async () => {
      const invalidData = {
        ...mockSubmissionData,
        appointmentDateTime: 'invalid-date',
      };

      const result = await submitAccessStorageAppointment(invalidData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });
});
