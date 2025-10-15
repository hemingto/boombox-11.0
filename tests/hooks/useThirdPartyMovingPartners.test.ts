/**
 * @fileoverview Jest tests for useThirdPartyMovingPartners hook
 * @source Tests for boombox-11.0/src/hooks/useThirdPartyMovingPartners.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useThirdPartyMovingPartners } from '@/hooks/useThirdPartyMovingPartners';
import ThirdPartyMovingPartnerService, { ThirdPartyMovingPartner } from '@/lib/services/thirdPartyMovingPartnerService';

// Mock the service
jest.mock('@/lib/services/thirdPartyMovingPartnerService');

describe('useThirdPartyMovingPartners', () => {
  const mockService = {
    fetchPartners: jest.fn(),
    clearCache: jest.fn(),
    getInstance: jest.fn(),
  };

  const mockPartners: ThirdPartyMovingPartner[] = [
    {
      id: 1,
      title: 'Moving Company A',
      description: 'Professional movers',
      imageSrc: 'https://example.com/logo-a.jpg',
      rating: 4.5,
      reviews: '120 reviews',
      weblink: 'https://company-a.com',
      gmblink: 'https://maps.google.com/company-a',
    },
    {
      id: 2,
      title: 'Moving Company B',
      description: 'Reliable services',
      imageSrc: 'https://example.com/logo-b.jpg',
      rating: 4.2,
      reviews: '85 reviews',
      weblink: 'https://company-b.com',
      gmblink: 'https://maps.google.com/company-b',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (ThirdPartyMovingPartnerService.getInstance as jest.Mock).mockReturnValue(mockService);
  });

  describe('Initial State', () => {
    it('starts with loading state', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: [],
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('calls service on mount', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      renderHook(() => useThirdPartyMovingPartners());

      expect(mockService.fetchPartners).toHaveBeenCalledTimes(1);
    });
  });

  describe('Successful Data Fetching', () => {
    it('updates state with fetched partners', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual(mockPartners);
      expect(result.current.error).toBeNull();
    });

    it('handles empty partners array', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles service errors correctly', async () => {
      const errorMessage = 'Failed to fetch partners';
      mockService.fetchPartners.mockResolvedValue({
        partners: [],
        isLoading: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('handles service exceptions', async () => {
      const error = new Error('Network error');
      mockService.fetchPartners.mockRejectedValue(error);

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });

    it('handles non-Error exceptions', async () => {
      mockService.fetchPartners.mockRejectedValue('String error');

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch partners');
    });
  });

  describe('Refetch Functionality', () => {
    it('clears cache and refetches data', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(mockService.clearCache).toHaveBeenCalledTimes(1);
      expect(mockService.fetchPartners).toHaveBeenCalledTimes(2);
    });

    it('updates loading state during refetch', async () => {
      mockService.fetchPartners
        .mockResolvedValueOnce({
          partners: mockPartners,
          isLoading: false,
          error: null,
        })
        .mockResolvedValueOnce({
          partners: mockPartners,
          isLoading: false,
          error: null,
        });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles refetch errors', async () => {
      // Initial successful fetch
      mockService.fetchPartners
        .mockResolvedValueOnce({
          partners: mockPartners,
          isLoading: false,
          error: null,
        })
        .mockRejectedValueOnce(new Error('Refetch error'));

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Refetch with error
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBe('Refetch error');
      expect(result.current.partners).toEqual([]);
    });
  });

  describe('Clear Cache Functionality', () => {
    it('calls service clearCache method', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearCache();
      });

      expect(mockService.clearCache).toHaveBeenCalledTimes(1);
    });

    it('resets local state when clearing cache', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Hook Stability', () => {
    it('maintains stable function references', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result, rerender } = renderHook(() => useThirdPartyMovingPartners());

      const initialRefetch = result.current.refetch;
      const initialClearCache = result.current.clearCache;

      rerender();

      expect(result.current.refetch).toBe(initialRefetch);
      expect(result.current.clearCache).toBe(initialClearCache);
    });
  });

  describe('Service Integration', () => {
    it('uses singleton service instance', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      renderHook(() => useThirdPartyMovingPartners());

      expect(ThirdPartyMovingPartnerService.getInstance).toHaveBeenCalledTimes(1);
    });

    it('passes service results correctly', async () => {
      const serviceResult = {
        partners: mockPartners,
        isLoading: false,
        error: null,
      };

      mockService.fetchPartners.mockResolvedValue(serviceResult);

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toBe(serviceResult.partners);
      expect(result.current.isLoading).toBe(serviceResult.isLoading);
      expect(result.current.error).toBe(serviceResult.error);
    });
  });

  describe('Component Lifecycle', () => {
    it('fetches data only once on mount', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { rerender } = renderHook(() => useThirdPartyMovingPartners());

      expect(mockService.fetchPartners).toHaveBeenCalledTimes(1);

      rerender();

      expect(mockService.fetchPartners).toHaveBeenCalledTimes(1);
    });

    it('does not fetch on unmount', () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { unmount } = renderHook(() => useThirdPartyMovingPartners());

      unmount();

      expect(mockService.fetchPartners).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Transitions', () => {
    it('transitions from loading to success correctly', async () => {
      mockService.fetchPartners.mockResolvedValue({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for success state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual(mockPartners);
      expect(result.current.error).toBeNull();
    });

    it('transitions from loading to error correctly', async () => {
      const errorMessage = 'Fetch failed';
      mockService.fetchPartners.mockResolvedValue({
        partners: [],
        isLoading: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useThirdPartyMovingPartners());

      // Initial loading state
      expect(result.current.isLoading).toBe(true);

      // Wait for error state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.partners).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });
});
