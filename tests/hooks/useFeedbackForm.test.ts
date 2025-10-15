/**
 * @fileoverview Tests for useFeedbackForm hook
 * Following boombox-11.0 testing standards
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeedbackForm } from '@/hooks/useFeedbackForm';
import type { UseFeedbackFormOptions } from '@/hooks/useFeedbackForm';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('useFeedbackForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const defaultOptions: UseFeedbackFormOptions = {
    appointmentId: '123',
    invoiceTotal: 150.00,
    drivers: [
      {
        key: 'driver-1',
        taskId: 'task-1',
        taskIds: ['task-1', 'task-2'],
        name: 'John Doe',
        unitNumber: 101
      }
    ]
  };

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      expect(result.current.rating).toBe(0);
      expect(result.current.comment).toBe('');
      expect(result.current.tipPercentage).toBe(15);
      expect(result.current.customTip).toBe('');
      expect(result.current.isCustomTip).toBe(false);
      expect(result.current.driverRatings).toEqual({});
      expect(result.current.ratingError).toBeNull();
      expect(result.current.submitted).toBe(false);
      expect(result.current.errorMessage).toBeNull();
      expect(result.current.submitting).toBe(false);
      expect(result.current.tipPaymentStatus).toBeNull();
      expect(result.current.loading).toBe(true);
    });
  });

  describe('State Updates', () => {
    it('updates rating and clears error', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(4);
      });

      expect(result.current.rating).toBe(4);
      expect(result.current.ratingError).toBeNull();
    });

    it('updates comment', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setComment('Great service!');
      });

      expect(result.current.comment).toBe('Great service!');
    });

    it('updates tip percentage', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setTipPercentage(20);
      });

      expect(result.current.tipPercentage).toBe(20);
    });

    it('updates custom tip', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setCustomTip('25.50');
      });

      expect(result.current.customTip).toBe('25.50');
    });

    it('updates custom tip flag', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setIsCustomTip(true);
      });

      expect(result.current.isCustomTip).toBe(true);
    });

    it('updates driver ratings', () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setDriverRatings({ 'driver-1': 'thumbs_up' });
      });

      expect(result.current.driverRatings).toEqual({ 'driver-1': 'thumbs_up' });
    });
  });

  describe('checkExistingFeedback', () => {
    it('sets loading to false when no existing feedback', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      await act(async () => {
        await result.current.checkExistingFeedback();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.submitted).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/check?appointmentId=123');
    });

    it('sets submitted to true when feedback exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      await act(async () => {
        await result.current.checkExistingFeedback();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.submitted).toBe(true);
    });

    it('handles API error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      await act(async () => {
        await result.current.checkExistingFeedback();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.submitted).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('validates rating before submission', async () => {
      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.ratingError).toBe('Please provide a rating');
      expect(mockFetch).not.toHaveBeenCalledWith('/api/admin/feedback/submit', expect.any(Object));
    });

    it('submits feedback with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 1, 
          tipProcessingStatus: 'success',
          tipPaymentStatus: 'succeeded'
        })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      // Set required rating
      act(() => {
        result.current.setRating(5);
        result.current.setComment('Excellent service!');
        result.current.setTipPercentage(20);
        result.current.setDriverRatings({ 'driver-1': 'thumbs_up' });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: 123,
          rating: 5,
          comment: 'Excellent service!',
          tipAmount: 30, // 20% of 150
          driverRatings: {
            'task-1': 'thumbs_up',
            'task-2': 'thumbs_up'
          },
        }),
      });

      expect(result.current.submitted).toBe(true);
      expect(result.current.tipPaymentStatus).toBe('succeeded');
    });

    it('calculates custom tip correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(4);
        result.current.setIsCustomTip(true);
        result.current.setCustomTip('25.75');
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const payload = JSON.parse(lastCall[1].body);
      expect(payload.tipAmount).toBe(25.75);
    });

    it('maps driver ratings to taskIds correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(3);
        result.current.setDriverRatings({ 'driver-1': 'thumbs_down' });
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const payload = JSON.parse(lastCall[1].body);
      expect(payload.driverRatings).toEqual({
        'task-1': 'thumbs_down',
        'task-2': 'thumbs_down'
      });
    });

    it('handles tip payment failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 1, 
          tipProcessingStatus: 'failed',
          tipProcessingError: 'Payment declined'
        })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(4);
        result.current.setTipPercentage(15);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitted).toBe(true);
      expect(result.current.tipPaymentStatus).toBe('failed');
      expect(result.current.errorMessage).toContain('tip payment failed');
    });

    it('handles API error during submission', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(4);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitted).toBe(false);
      expect(result.current.errorMessage).toBe('An error occurred while submitting your feedback. Please try again.');
    });

    it('handles server error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          tipProcessingError: 'Server error'
        })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(4);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.submitted).toBe(false);
      expect(result.current.errorMessage).toContain('Failed to submit feedback');
    });

    it('manages submitting state correctly', async () => {
      let resolveSubmit: (value: any) => void;
      const submitPromise = new Promise(resolve => {
        resolveSubmit = resolve;
      });
      
      mockFetch.mockReturnValueOnce(submitPromise);

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      act(() => {
        result.current.setRating(5);
      });

      // Start submission
      act(() => {
        result.current.handleSubmit();
      });

      // Should be in submitting state
      expect(result.current.submitting).toBe(true);

      // Resolve the promise
      act(() => {
        resolveSubmit!({
          ok: true,
          json: async () => ({ id: 1 })
        });
      });

      await waitFor(() => {
        expect(result.current.submitting).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty drivers array', () => {
      const optionsWithoutDrivers: UseFeedbackFormOptions = {
        appointmentId: '123',
        invoiceTotal: 100,
        drivers: []
      };

      const { result } = renderHook(() => useFeedbackForm(optionsWithoutDrivers));

      expect(result.current).toBeTruthy();
      expect(result.current.driverRatings).toEqual({});
    });

    it('handles undefined drivers', () => {
      const optionsWithoutDrivers: UseFeedbackFormOptions = {
        appointmentId: '123',
        invoiceTotal: 100
      };

      const { result } = renderHook(() => useFeedbackForm(optionsWithoutDrivers));

      expect(result.current).toBeTruthy();
      expect(result.current.driverRatings).toEqual({});
    });

    it('handles zero tip amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      expect(result.current).toBeTruthy();

      act(() => {
        result.current.setRating(4);
        result.current.setTipPercentage(0); // No tip
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const payload = JSON.parse(lastCall[1].body);
      expect(payload.tipAmount).toBe(0);
      expect(result.current.tipPaymentStatus).toBeNull(); // No payment status for zero tip
    });

    it('handles invalid custom tip input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 })
      });

      const { result } = renderHook(() => useFeedbackForm(defaultOptions));

      expect(result.current).toBeTruthy();

      act(() => {
        result.current.setRating(4);
        result.current.setIsCustomTip(true);
        result.current.setCustomTip(''); // Empty custom tip
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const payload = JSON.parse(lastCall[1].body);
      expect(payload.tipAmount).toBe(0);
    });
  });
});
