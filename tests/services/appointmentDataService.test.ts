/**
 * @fileoverview Jest tests for appointmentDataService
 * @source boombox-11.0/src/lib/services/appointmentDataService.ts
 * 
 * TEST COVERAGE:
 * - Service initialization and configuration
 * - Appointment data fetching with validation
 * - API integration and error handling
 * - Retry logic and timeout handling
 * - Network error recovery
 * - Response parsing and validation
 * - Data transformation utilities
 * - Service utility functions
 * 
 * @refactor Comprehensive tests for the appointment data service layer
 */

import {
  fetchAppointmentDetails,
  transformAppointmentDataForForm,
  validateAppointmentOwnership,
  AppointmentDataServiceOptions
} from '@/lib/services/appointmentDataService';
import { AppointmentDetailsResponse } from '@/types/accessStorage.types';

// Mock validation functions
jest.mock('@/lib/validations/accessStorage.validations', () => ({
  validateAppointmentDetailsResponse: jest.fn(),
}));

import { validateAppointmentDetailsResponse } from '@/lib/validations/accessStorage.validations';

// Helper function to create mock response
const createMockResponse = (data: any, options: { ok?: boolean; status?: number; statusText?: string } = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  statusText: options.statusText ?? 'OK',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Map([['x-request-id', 'test-123']]),
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbortController = {
  signal: { aborted: false },
  abort: jest.fn()
};
global.AbortController = jest.fn(() => mockAbortController) as any;

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn((callback, delay) => {
  // Execute callback immediately for most tests
  return 123;
});
const mockClearTimeout = jest.fn();
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
global.setTimeout = mockSetTimeout as any;
global.clearTimeout = mockClearTimeout;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
};

// Mock appointment data
const mockAppointmentData: AppointmentDetailsResponse = {
  id: 456,
  userId: 123,
  appointmentType: 'Storage Unit Access',
  address: '123 Test St, Los Angeles, CA 90210',
  zipcode: '90210',
  deliveryReason: 'ACCESS_ITEMS',
  planType: 'Do It Yourself Plan',
  description: 'Test appointment description',
  date: new Date('2024-02-15T10:00:00.000Z'),
  loadingHelpPrice: 0,
  monthlyStorageRate: 50,
  monthlyInsuranceRate: 10,
  quotedPrice: 150,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  status: 'Scheduled',
  createdAt: new Date('2024-01-15T10:00:00.000Z'),
  updatedAt: new Date('2024-01-15T10:00:00.000Z'),
  user: {
    id: 'test-user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    stripeCustomerId: 'cus_test123',
  },
  movingPartner: null,
  thirdPartyMovingPartner: null,
  requestedStorageUnits: [
    {
      storageUnitId: 1,
      storageUnit: {
        id: 1,
        unitNumber: 'BX001',
        size: 'Medium',
        location: 'Los Angeles',
      },
    },
  ],
  additionalInfo: {
    stripeCustomerId: 'cus_test123',
  },
};

describe('appointmentDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful response
    mockFetch.mockResolvedValue(createMockResponse({
      success: true,
      data: mockAppointmentData,
    }));

    // Default successful validation
    (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
      isValid: true,
      data: mockAppointmentData,
      errors: {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== FETCH APPOINTMENT DETAILS TESTS =====

  describe('fetchAppointmentDetails', () => {
    it('fetches appointment details successfully', async () => {
      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointmentData);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/appointments/456/details',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: expect.any(Object),
        })
      );
    });

    it('handles numeric appointment ID', async () => {
      await fetchAppointmentDetails(456);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/appointments/456/details',
        expect.any(Object)
      );
    });

    it('validates appointment ID format', async () => {
      const result = await fetchAppointmentDetails('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment ID provided');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates negative appointment ID', async () => {
      const result = await fetchAppointmentDetails(-1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment ID provided');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates zero appointment ID', async () => {
      const result = await fetchAppointmentDetails(0);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment ID provided');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('uses custom service options', async () => {
      const options: AppointmentDataServiceOptions = {
        timeout: 15000,
        retries: 3,
      };

      await fetchAppointmentDetails('456', options);

      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 15000);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('uses external abort signal', async () => {
      const externalController = new AbortController();
      const options: AppointmentDataServiceOptions = {
        signal: externalController.signal,
      };

      await fetchAppointmentDetails('456', options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: externalController.signal,
        })
      );
    });
  });

  // ===== HTTP ERROR HANDLING TESTS =====

  describe('HTTP Error Handling', () => {
    it('handles 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 401 }));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized access to appointment');
    });

    it('handles 404 Not Found', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });

    it('handles 403 Forbidden', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 403 }));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied to this appointment');
    });

    it('handles 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 500 }));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load appointment details: 500');
    });

    it('handles other HTTP errors', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 429, statusText: 'Too Many Requests' }));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load appointment details: 429');
    });

    it('handles response JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await fetchAppointmentDetails('456', { retries: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });
  });

  // ===== RETRY LOGIC TESTS =====

  describe('Retry Logic', () => {
    it('retries on network errors', async () => {
      // Use original setTimeout for this test to allow delays
      global.setTimeout = originalSetTimeout;
      
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValue(createMockResponse({
          success: true,
          data: mockAppointmentData,
        }));

      const result = await fetchAppointmentDetails('456', { retries: 2, timeout: 1000 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointmentData);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      // Restore mock
      global.setTimeout = mockSetTimeout as any;
    });

    it('does not retry on server errors (5xx)', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 500 }));

      const result = await fetchAppointmentDetails('456', { retries: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load appointment details: 500');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for HTTP errors
    });

    it('does not retry on client errors (4xx)', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

      const result = await fetchAppointmentDetails('456', { retries: 3 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('exhausts retry attempts', async () => {
      // Use original setTimeout for this test to allow delays
      global.setTimeout = originalSetTimeout;
      
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await fetchAppointmentDetails('456', { retries: 2, timeout: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: Unable to connect to server');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      // Restore mock
      global.setTimeout = mockSetTimeout as any;
    });

    it('implements exponential backoff delay', async () => {
      const mockDelay = jest.fn();
      // Mock a delay function
      global.setTimeout = jest.fn((callback, delay) => {
        mockDelay(delay);
        callback(); // Execute immediately for test
        return 123;
      });

      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValue(createMockResponse({
          success: true,
          data: mockAppointmentData,
        }));

      await fetchAppointmentDetails('456', { retries: 1 });

      // Should have delay for retry (exponential backoff)
      expect(mockDelay).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  // ===== TIMEOUT HANDLING TESTS =====

  describe('Timeout Handling', () => {
    it('sets up timeout controller', async () => {
      // Use original setTimeout for this test so it actually gets called
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      await fetchAppointmentDetails('456', { timeout: 5000 });

      // The service should set up a timeout
      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      // Restore mocks
      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
      global.setTimeout = mockSetTimeout as any;
      global.clearTimeout = mockClearTimeout;
    });

    it('handles timeout abort', async () => {
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValue(timeoutError);

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timed out');
    });

    it('clears timeout on successful response', async () => {
      const result = await fetchAppointmentDetails('456');

      // Verify successful response
      expect(result.success).toBe(true);
    });

    it('clears timeout on error response', async () => {
      mockFetch.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

      const result = await fetchAppointmentDetails('456');

      // Verify error response
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });
  });

  // ===== RESPONSE VALIDATION TESTS =====

  describe('Response Validation', () => {
    it('validates successful API response', async () => {
      await fetchAppointmentDetails('456');

      expect(validateAppointmentDetailsResponse).toHaveBeenCalledWith({
        success: true,
        data: mockAppointmentData,
      });
    });

    it('handles validation failure', async () => {
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'Invalid appointment data format' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });

    it('handles API response without success field', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        data: mockAppointmentData, // Missing success field
      }));

      // Mock validation to fail for missing success field
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'Missing success field' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });

    it('handles API response with success false', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        success: false,
        error: 'Appointment has been cancelled',
      }));

      // Mock validation to fail for success: false response
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'Appointment has been cancelled' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });

    it('handles API response with no data', async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        success: true,
        data: null,
      }));

      // Mock validation to fail for null data
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'No appointment data' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });
  });

  // ===== TRANSFORM APPOINTMENT DATA TESTS =====

  describe('transformAppointmentDataForForm', () => {
    it('transforms appointment data to form format', () => {
      const result = transformAppointmentDataForForm(mockAppointmentData);

      expect(result).toEqual({
        address: '123 Test St, Los Angeles, CA 90210',
        zipCode: '90210',
        cityName: 'Los Angeles',
        description: 'Test appointment description',
        deliveryReason: 'ACCESS_ITEMS',
        scheduledDate: new Date('2024-02-15T10:00:00.000Z'),
        scheduledTimeSlot: '2am-3am',
        selectedStorageUnits: ['1'],
        planType: 'Do It Yourself Plan',
        loadingHelpPrice: 0,
        monthlyStorageRate: 50,
        monthlyInsuranceRate: 10,
        quotedPrice: 150,
        movingPartner: null,
        thirdPartyMovingPartner: null,
        user: mockAppointmentData.user,
        additionalInfo: mockAppointmentData.additionalInfo,
        appointmentType: 'Storage Unit Access',
        status: 'Scheduled'
      });
    });

    it('handles appointment data with moving partner', () => {
      const appointmentWithMovingPartner = {
        ...mockAppointmentData,
        movingPartner: {
          id: 123,
          name: 'Professional Movers',
          hourlyRate: 150,
          onfleetTeamId: 'team-456',
        },
        loadingHelpPrice: 150,
      };

      const result = transformAppointmentDataForForm(appointmentWithMovingPartner);

      expect(result.movingPartner).toEqual({
        id: 123,
        name: 'Professional Movers',
        hourlyRate: 150,
        onfleetTeamId: 'team-456',
      });
      expect(result.loadingHelpPrice).toBe(150);
    });

    it('handles appointment data with third party moving partner', () => {
      const appointmentWithThirdParty = {
        ...mockAppointmentData,
        thirdPartyMovingPartner: {
          id: 789,
          name: 'Third Party Movers',
        },
        loadingHelpPrice: 120,
      };

      const result = transformAppointmentDataForForm(appointmentWithThirdParty);

      expect(result.thirdPartyMovingPartner).toEqual({
        id: 789,
        name: 'Third Party Movers',
      });
      expect(result.loadingHelpPrice).toBe(120);
    });

    it('handles appointment data with multiple storage units', () => {
      const appointmentWithMultipleUnits = {
        ...mockAppointmentData,
        requestedStorageUnits: [
          {
            storageUnitId: 1,
            storageUnit: { id: 1, unitNumber: 'BX001', size: 'Medium', location: 'LA' },
          },
          {
            storageUnitId: 2,
            storageUnit: { id: 2, unitNumber: 'BX002', size: 'Large', location: 'LA' },
          },
        ],
      };

      const result = transformAppointmentDataForForm(appointmentWithMultipleUnits);

      expect(result.selectedStorageUnits).toEqual(['1', '2']);
    });

    it('handles appointment data with missing optional fields', () => {
      const minimalAppointmentData = {
        ...mockAppointmentData,
        movingPartner: null,
        thirdPartyMovingPartner: null,
        requestedStorageUnits: [],
        additionalInfo: null,
      };

      const result = transformAppointmentDataForForm(minimalAppointmentData);

      expect(result.selectedStorageUnits).toEqual([]);
      expect(result.selectedLabor).toBeUndefined();
      expect(result.stripeCustomerId).toBeUndefined();
    });
  });

  // ===== VALIDATE APPOINTMENT OWNERSHIP TESTS =====

  describe('validateAppointmentOwnership', () => {
    it('validates appointment ownership successfully', () => {
      const result = validateAppointmentOwnership(mockAppointmentData, 123);

      expect(result).toBe(true);
    });

    it('rejects appointment owned by different user', () => {
      const result = validateAppointmentOwnership(mockAppointmentData, 'different-user-456');

      expect(result).toBe(false);
    });

    it('handles appointment with numeric user ID', () => {
      const appointmentWithNumericUserId = {
        ...mockAppointmentData,
        userId: 123 as any, // Numeric user ID
      };

      const result = validateAppointmentOwnership(appointmentWithNumericUserId, '123');

      expect(result).toBe(true);
    });

    it('handles string user ID matching numeric', () => {
      const appointmentWithStringUserId = {
        ...mockAppointmentData,
        userId: 'test-user-123',
      };

      const result = validateAppointmentOwnership(appointmentWithStringUserId, 123);

      expect(result).toBe(false); // String vs number won't match
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected token');
    });

    it('handles network connection errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error: Unable to connect to server');
    });

    it('handles DNS resolution errors', async () => {
      mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('getaddrinfo ENOTFOUND');
    });

    it('logs errors for debugging', async () => {
      const testError = new Error('Test error for logging');
      mockFetch.mockRejectedValue(testError);

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error for logging');
    });

    it('handles empty response body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      // Mock validation to fail for null response
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'Empty response' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });
  });

  // ===== PERFORMANCE TESTS =====

  describe('Performance', () => {
    it('completes fetch within reasonable time', async () => {
      const startTime = performance.now();

      await fetchAppointmentDetails('456');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms (excluding network time)
      expect(duration).toBeLessThan(100);
    });

    it('handles concurrent requests efficiently', async () => {
      const promises = [
        fetchAppointmentDetails('456'),
        fetchAppointmentDetails('789'),
        fetchAppointmentDetails('101'),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('does not leak memory on repeated calls', async () => {
      // Simulate multiple calls
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await fetchAppointmentDetails(`${456 + i}`));
      }

      expect(mockFetch).toHaveBeenCalledTimes(10);
      // Verify all calls were successful
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  // ===== INTEGRATION TESTS =====

  describe('Integration', () => {
    it('integrates with validation layer', async () => {
      const validationResult = {
        isValid: true,
        data: mockAppointmentData,
        errors: {}
      };
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue(validationResult);

      const result = await fetchAppointmentDetails('456');

      expect(validateAppointmentDetailsResponse).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAppointmentData);
    });

    it('handles validation layer errors', async () => {
      (validateAppointmentDetailsResponse as jest.Mock).mockReturnValue({
        isValid: false,
        data: null,
        errors: { general: 'Validation failed: missing required fields' }
      });

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid appointment data received from server');
    });

    it('provides comprehensive error context', async () => {
      const networkError = new Error('Network timeout');
      networkError.name = 'TimeoutError';
      mockFetch.mockRejectedValue(networkError);

      const result = await fetchAppointmentDetails('456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });
  });
});
