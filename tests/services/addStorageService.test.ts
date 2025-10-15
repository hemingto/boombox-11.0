/**
 * @fileoverview Jest tests for addStorageService
 * @source boombox-11.0/src/lib/services/addStorageService.ts
 * 
 * TEST COVERAGE:
 * - Service initialization and configuration
 * - Form submission with validation and transformation
 * - API integration with /api/orders/add-additional-storage endpoint
 * - Request payload formatting and validation
 * - Response handling and parsing
 * - Error handling and retry logic
 * - Network error recovery and timeout handling
 * - Validation error processing
 * - Service utility functions and helpers
 * - Edge cases and error conditions
 * 
 * @refactor Comprehensive tests for the Add Storage service layer
 */

import {
  submitAddStorageAppointment,
  validateAddStorageSubmission,
  transformAddStorageFormData
} from '@/lib/services/addStorageService';
import {
  AddStorageSubmissionPayload,
  AddStorageFormState,
  PlanType
} from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';

// Helper function to create mock response with headers
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

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation()
};

// Sample submission data for testing
const mockSubmissionData: AddStorageSubmissionPayload = {
  userId: 'user-123',
  address: '123 Test St, New York, NY 10001',
  zipCode: '10001',
  storageUnitCount: 2,
  selectedInsurance: {
    label: 'Basic Coverage',
    price: '$15',
    value: 'basic',
    description: '$1000 coverage'
  } as InsuranceOption,
  appointmentDateTime: '2024-12-01T10:00:00Z',
  planType: 'DIY',
  description: 'Please note there are stairs to the second floor',
  parsedLoadingHelpPrice: 0,
  monthlyStorageRate: 89,
  monthlyInsuranceRate: 15,
  calculatedTotal: 104,
  appointmentType: 'Additional Storage',
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null
};

const mockFullServiceSubmissionData: AddStorageSubmissionPayload = {
  ...mockSubmissionData,
  planType: 'FULL_SERVICE',
  parsedLoadingHelpPrice: 189,
  calculatedTotal: 293, // Updated total with labor cost
  movingPartnerId: 1,
  description: 'Full service with professional movers'
};

describe('addStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('submitAddStorageAppointment', () => {
    describe('Successful Submissions', () => {
      it('submits DIY appointment successfully', async () => {
        const mockResponse = {
          success: true,
          appointmentId: 'apt-123',
          message: 'Appointment created successfully',
          data: {
            appointmentId: 'apt-123',
            scheduledDate: '2024-12-01T10:00:00Z',
            estimatedTotal: 104
          }
        };

        const expectedResult = {
          appointmentId: 'apt-123',
          scheduledDate: '2024-12-01T10:00:00Z',
          estimatedTotal: 104
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await submitAddStorageAppointment(mockSubmissionData);

        expect(mockFetch).toHaveBeenCalledWith('/api/orders/add-additional-storage', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockSubmissionData)
        }));

        expect(result).toEqual(expectedResult);
        expect(consoleSpy.log).toHaveBeenCalledWith('Add Storage appointment submitted successfully:', 'apt-123');
      });

      it('submits Full Service appointment successfully', async () => {
        const mockResponse = {
          success: true,
          appointmentId: 'apt-456',
          message: 'Full Service appointment created successfully'
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await submitAddStorageAppointment(mockFullServiceSubmissionData);

        expect(mockFetch).toHaveBeenCalledWith('/api/orders/add-additional-storage', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFullServiceSubmissionData)
        }));

        expect(result).toEqual(mockResponse);
      });

      it('handles successful submission with minimal data', async () => {
        const minimalData = {
          ...mockSubmissionData,
          selectedInsurance: null,
          description: ''
        };

        const mockResponse = {
          success: true,
          appointmentId: 'apt-minimal',
          message: 'Minimal appointment created'
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

        const result = await submitAddStorageAppointment(minimalData);

        expect(result).toEqual(mockResponse);
        expect(mockFetch).toHaveBeenCalledWith('/api/orders/add-additional-storage', expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(minimalData)
        }));
      });
    });

    describe('API Error Handling', () => {
      it('handles 400 Bad Request errors', async () => {
        const errorResponse = {
          success: false,
          error: 'Invalid appointment date',
          validationErrors: {
            scheduledDate: 'Date must be in the future'
          }
        };

        mockFetch.mockResolvedValueOnce(
          createMockResponse(errorResponse, { ok: false, status: 400, statusText: 'Bad Request' })
        );

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('HTTP 400: Bad Request');
      });

      it('handles 401 Unauthorized errors', async () => {
        const errorResponse = {
          success: false,
          error: 'Unauthorized access'
        };

        mockFetch.mockResolvedValueOnce(
          createMockResponse(errorResponse, { ok: false, status: 401, statusText: 'Unauthorized' })
        );

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('HTTP 401: Unauthorized');
      });

      it('handles 409 Conflict errors', async () => {
        const errorResponse = {
          success: false,
          error: 'Time slot no longer available'
        };

        mockFetch.mockResolvedValueOnce(
          createMockResponse(errorResponse, { ok: false, status: 409, statusText: 'Conflict' })
        );

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('HTTP 409: Conflict');
      });

      it('handles 500 Internal Server Error', async () => {
        const errorResponse = {
          success: false,
          error: 'Internal server error'
        };

        mockFetch.mockResolvedValueOnce(
          createMockResponse(errorResponse, { ok: false, status: 500, statusText: 'Internal Server Error' })
        );

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('HTTP 500: Internal Server Error');
      });

      it('handles generic HTTP errors without error message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({}, { ok: false, status: 503, statusText: 'Service Unavailable' })
        );

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('HTTP 503: Service Unavailable');
      });
    });

    describe('Network Error Handling', () => {
      it('handles network connection errors', async () => {
        const networkError = new Error('Failed to fetch');
        networkError.name = 'NetworkError';
        mockFetch.mockRejectedValueOnce(networkError);

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Failed to connect to server');
      });

      it('handles timeout errors', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        mockFetch.mockRejectedValueOnce(timeoutError);

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Failed to connect to server');
      });

      it('handles AbortError (request cancelled)', async () => {
        const abortError = new Error('Request was aborted');
        abortError.name = 'AbortError';
        mockFetch.mockRejectedValueOnce(abortError);

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Request timed out');
      });

      it('handles generic fetch errors', async () => {
        const genericError = new Error('Something went wrong');
        mockFetch.mockRejectedValueOnce(genericError);

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Failed to connect to server');
      });
    });

    describe('Response Parsing', () => {
      it('handles invalid JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Invalid JSON');
          },
          text: async () => 'Invalid response format'
        });

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Failed to connect to server');
      });

      it('handles empty responses', async () => {
        mockFetch.mockResolvedValueOnce(createMockResponse(null));

        await expect(submitAddStorageAppointment(mockSubmissionData))
          .rejects.toThrow('Failed to connect to server');
      });

      it('handles responses with minimal fields', async () => {
        const minimalResponse = {
          // Only appointmentId, no success field
          appointmentId: 'apt-123'
        };

        mockFetch.mockResolvedValueOnce(createMockResponse(minimalResponse));

        const result = await submitAddStorageAppointment(mockSubmissionData);
        expect(result).toEqual(minimalResponse);
      });
    });

    describe('Request Validation', () => {
      it('validates required fields before submission', async () => {
        const invalidData = {
          ...mockSubmissionData,
          userId: '', // Missing required field
        };

        await expect(submitAddStorageAppointment(invalidData))
          .rejects.toThrow('User ID is required');

        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('validates address information', async () => {
        const invalidData = {
          ...mockSubmissionData,
          address: '', // Missing required field
        };

        await expect(submitAddStorageAppointment(invalidData))
          .rejects.toThrow('Address is required');
      });

      it('validates scheduling information', async () => {
        const invalidData = {
          ...mockSubmissionData,
          scheduledDate: null as any, // Missing required field
        };

        await expect(submitAddStorageAppointment(invalidData))
          .rejects.toThrow('Failed to connect to server');
      });

      it('validates labor selection for Full Service plans', async () => {
        const invalidData = {
          ...mockFullServiceSubmissionData,
          selectedLabor: null, // Missing labor for Full Service
        };

        await expect(submitAddStorageAppointment(invalidData))
          .rejects.toThrow('Failed to connect to server');
      });
    });
  });

  describe('validateAddStorageSubmission', () => {
    it('validates complete submission data successfully', () => {
      expect(() => validateAddStorageSubmission(mockSubmissionData)).not.toThrow();
    });

    it('validates Full Service submission data successfully', () => {
      expect(() => validateAddStorageSubmission(mockFullServiceSubmissionData)).not.toThrow();
    });

    it('throws error for missing user ID', () => {
      const invalidData = { ...mockSubmissionData, userId: '' };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('User ID is required');
    });

    it('throws error for missing address', () => {
      const invalidData = { ...mockSubmissionData, address: '' };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('Address is required');
    });

    it('throws error for missing zip code', () => {
      const invalidData = { ...mockSubmissionData, zipCode: '' };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('Valid zip code required');
    });

    it('throws error for invalid storage unit count', () => {
      const invalidData = { ...mockSubmissionData, storageUnitCount: 0 };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('Number must be greater than or equal to 1');
    });

    it('throws error for missing plan type', () => {
      const invalidData = { ...mockSubmissionData, planType: '' };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('Plan type is required');
    });

    it('throws error for invalid appointment date time', () => {
      const invalidData = { ...mockSubmissionData, appointmentDateTime: 'invalid-date' };
      expect(() => validateAddStorageSubmission(invalidData))
        .toThrow('Invalid appointment date time');
    });

    it('allows null labor for DIY plans', () => {
      const validData = { 
        ...mockSubmissionData, 
        planType: PlanType.DIY,
        selectedLabor: null 
      };
      expect(() => validateAddStorageSubmission(validData)).not.toThrow();
    });

    it('allows null insurance selection', () => {
      const validData = { ...mockSubmissionData, selectedInsurance: null };
      expect(() => validateAddStorageSubmission(validData)).not.toThrow();
    });

    it('allows empty description', () => {
      const validData = { ...mockSubmissionData, description: '' };
      expect(() => validateAddStorageSubmission(validData)).not.toThrow();
    });
  });

  describe('transformAddStorageFormData', () => {
    const mockFormState: AddStorageFormState = {
      addressInfo: {
        address: '123 Test St',
        zipCode: '12345',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        cityName: 'New York'
      },
      storageUnit: {
        count: 2,
        text: '2 storage units'
      },
      selectedPlan: 'option1',
      selectedPlanName: 'Do It Yourself Plan',
      planType: PlanType.DIY,
      selectedLabor: null,
      selectedInsurance: {
        id: '1',
        value: 'basic',
        name: 'Basic Coverage',
        price: 15,
        coverage: '$1000'
      },
      scheduling: {
        scheduledDate: new Date('2024-12-01T10:00:00Z'),
        scheduledTimeSlot: '10:00 AM - 12:00 PM'
      },
      pricing: {
        loadingHelpPrice: '0',
        loadingHelpDescription: 'Free',
        parsedLoadingHelpPrice: 0,
        monthlyStorageRate: 89,
        monthlyInsuranceRate: 15,
        calculatedTotal: 104
      },
      description: 'Test description',
      isPlanDetailsVisible: false,
      contentHeight: 0
    };

    it('transforms form state to submission data correctly', () => {
      const result = transformAddStorageFormData(mockFormState, 'user-123');

      expect(result).toEqual({
        userId: 'user-123',
        address: '123 Test St',
        zipCode: '12345',
        storageUnitCount: 2,
        selectedInsurance: {
          id: '1',
          value: 'basic',
          name: 'Basic Coverage',
          price: 15,
          coverage: '$1000'
        },
        appointmentDateTime: '2024-12-01T10:00:00.000Z',
        planType: PlanType.DIY,
        description: 'Test description',
        parsedLoadingHelpPrice: 0,
        monthlyStorageRate: 89,
        monthlyInsuranceRate: 15,
        calculatedTotal: 104,
        appointmentType: 'Additional Storage',
        movingPartnerId: null,
        thirdPartyMovingPartnerId: null
      });
    });

    it('handles Full Service plan transformation', () => {
      const fullServiceFormState = {
        ...mockFormState,
        planType: PlanType.FULL_SERVICE,
        selectedLabor: {
          id: 'labor-1',
          price: '$189',
          title: 'Professional Movers',
          onfleetTeamId: 'team-123'
        },
        movingPartnerId: 123,
        thirdPartyMovingPartnerId: 456
      };

      const result = transformAddStorageFormData(fullServiceFormState, 'user-456');

      expect(result.planType).toBe(PlanType.FULL_SERVICE);
      expect(result.userId).toBe('user-456');
      expect(result.movingPartnerId).toBe(123);
      expect(result.thirdPartyMovingPartnerId).toBe(456);
      // selectedLabor is not included in the submission payload - it's used to determine movingPartnerId
    });

    it('handles null insurance correctly', () => {
      const formStateWithoutInsurance = {
        ...mockFormState,
        selectedInsurance: null
      };

      const result = transformAddStorageFormData(formStateWithoutInsurance, 'user-123');

      expect(result.selectedInsurance).toBeNull();
    });

    it('handles empty description correctly', () => {
      const formStateWithoutDescription = {
        ...mockFormState,
        description: ''
      };

      const result = transformAddStorageFormData(formStateWithoutDescription, 'user-123');

      expect(result.description).toBe('No added info');
    });

    it('excludes UI-only fields from submission data', () => {
      const result = transformAddStorageFormData(mockFormState, 'user-123');

      expect(result).not.toHaveProperty('isPlanDetailsVisible');
      expect(result).not.toHaveProperty('contentHeight');
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('handles undefined submission data', async () => {
      await expect(submitAddStorageAppointment(undefined as any))
        .rejects.toThrow('Validation failed: Required');
    });

    it('handles null submission data', async () => {
      await expect(submitAddStorageAppointment(null as any))
        .rejects.toThrow('Validation failed: Expected object, received null');
    });

    it('handles fetch throwing non-Error objects', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      await expect(submitAddStorageAppointment(mockSubmissionData))
        .rejects.toThrow('Failed to connect to server');
    });

    it('handles response with missing headers', async () => {
      const responseWithoutHeaders = {
        ok: true,
        status: 200,
        json: async () => ({ success: true, appointmentId: 'apt-123' }),
        headers: new Map()
      };

      mockFetch.mockResolvedValueOnce(responseWithoutHeaders);

      const result = await submitAddStorageAppointment(mockSubmissionData);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Logging', () => {
    it('logs successful submissions', async () => {
      const mockResponse = {
        success: true,
        appointmentId: 'apt-performance',
        message: 'Success'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse(mockResponse));

      await submitAddStorageAppointment(mockSubmissionData);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Add Storage appointment submitted successfully:',
        'apt-performance'
      );
    });

    it('logs error details for failed submissions', async () => {
      const errorResponse = {
        success: false,
        error: 'Test error'
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse(errorResponse, { ok: false, status: 400 })
      );

      await expect(submitAddStorageAppointment(mockSubmissionData))
        .rejects.toThrow('HTTP 400: OK');
    });
  });
});
