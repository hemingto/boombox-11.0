/**
 * @fileoverview Tests for useSendQuoteEmail custom hook
 * @source boombox-11.0/src/hooks/useSendQuoteEmail.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useSendQuoteEmail } from '@/hooks/useSendQuoteEmail';
import { QuoteService } from '@/lib/services/quoteService';
import type { QuoteData } from '@/lib/services/quoteService';

// Mock dependencies
jest.mock('@/lib/services/quoteService');
jest.mock('@/lib/utils/emailUtils', () => ({
  validateEmail: jest.fn((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  })
}));

const mockQuoteService = QuoteService as jest.Mocked<typeof QuoteService>;

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

describe('useSendQuoteEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuoteService.sendQuoteEmail.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Quote email sent successfully' }
    });
    mockQuoteService.validateQuoteData.mockReturnValue({ isValid: true });
  });

  describe('Initial State', () => {
    it('returns initial state values', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      expect(result.current.email).toBe('');
      expect(result.current.error).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('provides all expected functions', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      expect(typeof result.current.setEmail).toBe('function');
      expect(typeof result.current.sendQuoteEmail).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.validateCurrentEmail).toBe('function');
    });
  });

  describe('Email Management', () => {
    it('updates email value', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      expect(result.current.email).toBe('test@example.com');
    });

    it('clears error when setting new email', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      // Set an error first
      act(() => {
        result.current.validateCurrentEmail();
      });
      expect(result.current.error).toBeTruthy();

      // Setting email should clear error
      act(() => {
        result.current.setEmail('test@example.com');
      });

      expect(result.current.error).toBe('');
    });
  });

  describe('Email Validation', () => {
    it('validates empty email', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateCurrentEmail();
      });

      expect(isValid!).toBe(false);
      expect(result.current.error).toBe('Please enter an email address');
    });

    it('validates invalid email format', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('invalid-email');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateCurrentEmail();
      });

      expect(isValid!).toBe(false);
      expect(result.current.error).toBe('Please enter a valid email address');
    });

    it('validates valid email', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateCurrentEmail();
      });

      expect(isValid!).toBe(true);
      expect(result.current.error).toBe('');
    });
  });

  describe('Send Quote Email', () => {
    it('successfully sends quote email', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useSendQuoteEmail({ onSuccess }));

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(mockQuoteService.sendQuoteEmail).toHaveBeenCalledWith(
        'test@example.com',
        mockQuoteData
      );
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('');
      expect(onSuccess).toHaveBeenCalledWith('test@example.com');
    });

    it('handles API failure', async () => {
      const onError = jest.fn();
      mockQuoteService.sendQuoteEmail.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error'
        }
      });

      const { result } = renderHook(() => useSendQuoteEmail({ onError }));

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(onError).toHaveBeenCalledWith('Network error');
    });

    it('handles invalid email during send', async () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('invalid-email');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(mockQuoteService.sendQuoteEmail).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Please enter a valid email address');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('handles invalid quote data', async () => {
      mockQuoteService.validateQuoteData.mockReturnValue({
        isValid: false,
        error: 'Missing required field: address'
      });

      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(mockQuoteService.sendQuoteEmail).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Missing required field: address');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });

    it('sets loading state during API call', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockQuoteService.sendQuoteEmail.mockReturnValue(pendingPromise as any);

      const { result } = renderHook(() => useSendQuoteEmail());

      act(() => {
        result.current.setEmail('test@example.com');
      });

      // Start the async operation without awaiting it immediately
      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.sendQuoteEmail(mockQuoteData);
      });

      // Check loading state immediately after starting
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise and wait for completion
      resolvePromise!({ success: true, data: { success: true } });
      await act(async () => {
        await sendPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('clears previous state before sending', async () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      // Set some initial state
      act(() => {
        result.current.setEmail('test@example.com');
      });

      // Simulate previous error and success
      await act(async () => {
        result.current.validateCurrentEmail(); // This might set an error
      });

      // Clear and set success manually for test
      act(() => {
        result.current.clearError();
      });

      // Now send email
      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(result.current.error).toBe('');
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Error Management', () => {
    it('clears error manually', () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      // Set an error
      act(() => {
        result.current.validateCurrentEmail();
      });
      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe('');
    });

    it('auto-clears error after specified time', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => 
        useSendQuoteEmail({ autoClearError: 1000 })
      );

      // Trigger an error
      act(() => {
        result.current.validateCurrentEmail();
      });
      expect(result.current.error).toBeTruthy();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.error).toBe('');

      jest.useRealTimers();
    });
  });

  describe('Reset Functionality', () => {
    it('resets all state to initial values', async () => {
      const { result } = renderHook(() => useSendQuoteEmail());

      // Set some state
      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(result.current.email).toBe('test@example.com');
      expect(result.current.isSuccess).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.email).toBe('');
      expect(result.current.error).toBe('');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('Callback Options', () => {
    it('calls onSuccess callback on successful send', async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useSendQuoteEmail({ onSuccess }));

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(onSuccess).toHaveBeenCalledWith('test@example.com');
    });

    it('calls onError callback on failure', async () => {
      const onError = jest.fn();
      mockQuoteService.sendQuoteEmail.mockResolvedValue({
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'API Error'
        }
      });

      const { result } = renderHook(() => useSendQuoteEmail({ onError }));

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(onError).toHaveBeenCalledWith('API Error');
    });

    it('calls onError callback on validation failure', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useSendQuoteEmail({ onError }));

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(onError).toHaveBeenCalledWith('Please enter an email address');
    });
  });

  describe('Exception Handling', () => {
    it('handles unexpected errors during send', async () => {
      const onError = jest.fn();
      mockQuoteService.sendQuoteEmail.mockRejectedValue(new Error('Unexpected error'));

      const { result } = renderHook(() => useSendQuoteEmail({ onError }));

      act(() => {
        result.current.setEmail('test@example.com');
      });

      await act(async () => {
        await result.current.sendQuoteEmail(mockQuoteData);
      });

      expect(result.current.error).toBe('An unexpected error occurred. Please try again.');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(onError).toHaveBeenCalledWith('An unexpected error occurred. Please try again.');
    });
  });
});
