/**
 * @fileoverview Tests for useTrackingData hook
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useTrackingData } from '@/hooks/useTrackingData';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data for testing
const mockTrackingData = {
  appointmentDate: '2024-01-15T10:00:00Z',
  appointmentType: 'Storage Unit Delivery',
  location: {
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  deliveryUnits: [
    {
      id: 'unit-1',
      status: 'in_transit' as const,
      unitNumber: 1,
      totalUnits: 2,
      provider: 'Boombox Logistics',
      steps: [
        {
          status: 'complete' as const,
          title: 'Package picked up',
          timestamp: '10:00 AM',
          action: {
            label: 'View details',
            url: 'https://example.com/track'
          }
        },
        {
          status: 'in_transit' as const,
          title: 'Out for delivery',
          timestamp: 'eta 2:30 PM',
          action: {
            label: 'Track location',
            trackingUrl: 'https://example.com/live-track',
            iconName: 'MapIcon' as const
          }
        }
      ]
    }
  ]
};

describe('useTrackingData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => useTrackingData('test-token'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.appointmentData).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch when token is empty', () => {
      const { result } = renderHook(() => useTrackingData(''));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('No tracking token provided');
      expect(result.current.appointmentData).toBe(null);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Successful Data Fetching', () => {
    it('should fetch and return tracking data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrackingData
      });

      const { result } = renderHook(() => useTrackingData('valid-token'));

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointmentData).toEqual({
        ...mockTrackingData,
        appointmentDate: new Date(mockTrackingData.appointmentDate)
      });
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith('/api/customers/tracking/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-token' })
      });
    });

    it('should transform date strings to Date objects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrackingData
      });

      const { result } = renderHook(() => useTrackingData('valid-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointmentData?.appointmentDate).toBeInstanceOf(Date);
      expect(result.current.appointmentData?.appointmentDate.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const { result } = renderHook(() => useTrackingData('invalid-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Invalid or expired tracking link');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle 404 not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const { result } = renderHook(() => useTrackingData('nonexistent-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Appointment not found');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle generic HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load tracking data: Internal Server Error');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Invalid response format from server');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle unexpected errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('Unexpected error');

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('An unexpected error occurred while loading tracking data');
      expect(result.current.appointmentData).toBe(null);
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrackingData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockTrackingData,
            appointmentType: 'Updated Delivery'
          })
        });

      const { result } = renderHook(() => useTrackingData('test-token'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointmentData?.appointmentType).toBe('Storage Unit Delivery');

      // Trigger refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.appointmentData?.appointmentType).toBe('Updated Delivery');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during refetch', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrackingData
        })
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useTrackingData('test-token'));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);

      // Trigger refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe('Refetch failed');
      });

      expect(result.current.appointmentData).toBe(null);
    });
  });

  describe('Clear Error Functionality', () => {
    it('should clear error when clearError is called', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Token Changes', () => {
    it('should refetch data when token changes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrackingData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockTrackingData,
            appointmentType: 'New Token Data'
          })
        });

      const { result, rerender } = renderHook(
        ({ token }) => useTrackingData(token),
        { initialProps: { token: 'token-1' } }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointmentData?.appointmentType).toBe('Storage Unit Delivery');

      // Change token
      rerender({ token: 'token-2' });

      await waitFor(() => {
        expect(result.current.appointmentData?.appointmentType).toBe('New Token Data');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/customers/tracking/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'token-2' })
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token after initial load', () => {
      const { result, rerender } = renderHook(
        ({ token }) => useTrackingData(token),
        { initialProps: { token: 'valid-token' } }
      );

      // Change to empty token
      rerender({ token: '' });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('No tracking token provided');
      expect(result.current.appointmentData).toBe(null);
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const { result } = renderHook(() => useTrackingData('test-token'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Invalid JSON');
      expect(result.current.appointmentData).toBe(null);
    });
  });
});
