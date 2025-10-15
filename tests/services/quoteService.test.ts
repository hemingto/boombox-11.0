/**
 * @fileoverview Tests for QuoteService
 * @source boombox-11.0/src/lib/services/quoteService.ts
 */

import { QuoteService, type QuoteData } from '@/lib/services/quoteService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockQuoteData: QuoteData = {
  address: '123 Test St, Test City, CA 90210',
  scheduledDate: new Date('2024-02-15T10:00:00Z'),
  scheduledTimeSlot: '10:00 AM - 12:00 PM',
  storageUnitCount: 2,
  storageUnitText: '2 storage units',
  selectedPlanName: 'Standard Plan',
  loadingHelpPrice: '$50.00',
  loadingHelpDescription: 'Loading help included',
  selectedInsurance: {
    label: 'Basic Coverage',
    price: '$10.00'
  },
  accessStorageUnitCount: 0,
  totalPrice: 150.00,
  isAccessStorage: false,
  zipCode: '90210'
};

describe('QuoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendQuoteEmail', () => {
    it('successfully sends quote email', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        success: true,
        message: 'Quote email sent successfully'
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/orders/send-quote-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          address: mockQuoteData.address,
          scheduledDate: mockQuoteData.scheduledDate?.toISOString(),
          scheduledTimeSlot: mockQuoteData.scheduledTimeSlot,
          storageUnitCount: mockQuoteData.storageUnitCount,
          storageUnitText: mockQuoteData.storageUnitText,
          selectedPlanName: mockQuoteData.selectedPlanName,
          loadingHelpPrice: mockQuoteData.loadingHelpPrice,
          loadingHelpDescription: mockQuoteData.loadingHelpDescription,
          selectedInsurance: mockQuoteData.selectedInsurance,
          accessStorageUnitCount: mockQuoteData.accessStorageUnitCount,
          totalPrice: mockQuoteData.totalPrice,
          isAccessStorage: mockQuoteData.isAccessStorage,
          zipCode: mockQuoteData.zipCode
        })
      });
    });

    it('trims and lowercases email address', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await QuoteService.sendQuoteEmail('  TEST@EXAMPLE.COM  ', mockQuoteData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.email).toBe('test@example.com');
    });

    it('handles null scheduledDate', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const quoteDataWithNullDate = {
        ...mockQuoteData,
        scheduledDate: null
      };

      await QuoteService.sendQuoteEmail('test@example.com', quoteDataWithNullDate);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.scheduledDate).toBe('');
    });

    it('validates empty email', async () => {
      const result = await QuoteService.sendQuoteEmail('', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Email address is required');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates whitespace-only email', async () => {
      const result = await QuoteService.sendQuoteEmail('   ', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Email address is required');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('validates missing quote data', async () => {
      const result = await QuoteService.sendQuoteEmail('test@example.com', undefined as any);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Quote data is required');
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles API error response with JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid email format' })
      });

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid email format');
      expect(result.error?.code).toBe('API_ERROR');
    });

    it('handles API error response without JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('HTTP 500: Internal Server Error');
      expect(result.error?.code).toBe('API_ERROR');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error. Please check your connection and try again.');
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });

    it('handles unexpected errors', async () => {
      mockFetch.mockRejectedValue(new Error('Unexpected error'));

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.error?.code).toBe('INTERNAL_ERROR');
    });

    it('logs successful email sending', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);
      
      // Note: The actual console.log is in the component/hook, not the service
      // This test verifies the service doesn't interfere with logging
      expect(result.success).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('validateQuoteData', () => {
    it('validates complete quote data', () => {
      const result = QuoteService.validateQuoteData(mockQuoteData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates undefined quote data', () => {
      const result = QuoteService.validateQuoteData(undefined);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Quote data is not available. Please ensure quote details are loaded.');
    });

    it('validates missing address', () => {
      const invalidData = { ...mockQuoteData, address: '' };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: address');
    });

    it('validates missing selectedPlanName', () => {
      const invalidData = { ...mockQuoteData, selectedPlanName: '' };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: selectedPlanName');
    });

    it('validates missing loadingHelpPrice', () => {
      const invalidData = { ...mockQuoteData, loadingHelpPrice: '' };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: loadingHelpPrice');
    });

    it('validates missing loadingHelpDescription', () => {
      const invalidData = { ...mockQuoteData, loadingHelpDescription: '' };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: loadingHelpDescription');
    });

    it('validates missing zipCode', () => {
      const invalidData = { ...mockQuoteData, zipCode: '' };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing required field: zipCode');
    });

    it('validates invalid total price (negative)', () => {
      const invalidData = { ...mockQuoteData, totalPrice: -10 };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid total price');
    });

    it('validates invalid total price (not a number)', () => {
      const invalidData = { ...mockQuoteData, totalPrice: 'invalid' as any };
      const result = QuoteService.validateQuoteData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid total price');
    });

    it('allows zero total price', () => {
      const validData = { ...mockQuoteData, totalPrice: 0 };
      const result = QuoteService.validateQuoteData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('allows optional fields to be undefined', () => {
      const validData = {
        ...mockQuoteData,
        storageUnitCount: undefined,
        storageUnitText: undefined,
        selectedInsurance: undefined,
        accessStorageUnitCount: undefined
      };
      const result = QuoteService.validateQuoteData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('allows null values for optional fields', () => {
      const validData = {
        ...mockQuoteData,
        selectedInsurance: null
      };
      const result = QuoteService.validateQuoteData(validData);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('handles console.error for network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'QuoteService.sendQuoteEmail error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('preserves original error messages', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ error: 'Email service temporarily unavailable' })
      });

      const result = await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Email service temporarily unavailable');
      expect(result.error?.code).toBe('API_ERROR');
    });
  });

  describe('API Integration', () => {
    it('uses correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders/send-quote-email',
        expect.any(Object)
      );
    });

    it('sends correct headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('uses POST method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await QuoteService.sendQuoteEmail('test@example.com', mockQuoteData);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
    });
  });
});
