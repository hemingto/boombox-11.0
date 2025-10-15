/**
 * @fileoverview Jest tests for ThirdPartyMovingPartnerService
 * @source Tests for boombox-11.0/src/lib/services/thirdPartyMovingPartnerService.ts
 */

import ThirdPartyMovingPartnerService, { ThirdPartyMovingPartner } from '@/lib/services/thirdPartyMovingPartnerService';

// Mock fetch globally
global.fetch = jest.fn();

describe('ThirdPartyMovingPartnerService', () => {
  let service: ThirdPartyMovingPartnerService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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
    // Get a fresh instance for each test
    service = ThirdPartyMovingPartnerService.getInstance();
    service.clearCache(); // Clear any cached data
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance when called multiple times', () => {
      const instance1 = ThirdPartyMovingPartnerService.getInstance();
      const instance2 = ThirdPartyMovingPartnerService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('fetchPartners', () => {
    it('fetches partners successfully on first call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      const result = await service.fetchPartners();

      expect(mockFetch).toHaveBeenCalledWith('/api/moving-partners/third-party');
      expect(result).toEqual({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('returns cached data on subsequent calls', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      await service.fetchPartners();

      // Second call should not trigger fetch
      const result = await service.fetchPartners();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });

    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.fetchPartners();

      expect(result).toEqual({
        partners: [],
        isLoading: false,
        error: 'Network error',
      });

      expect(consoleSpy).toHaveBeenCalledWith('ThirdPartyMovingPartnerService error:', networkError);
      consoleSpy.mockRestore();
    });

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await service.fetchPartners();

      expect(result).toEqual({
        partners: [],
        isLoading: false,
        error: 'Failed to fetch third-party moving partners: 404 Not Found',
      });
    });

    it('handles invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'format' }),
      } as Response);

      const result = await service.fetchPartners();

      expect(result).toEqual({
        partners: [],
        isLoading: false,
        error: 'Invalid response format: expected array of partners',
      });
    });

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      const result = await service.fetchPartners();

      expect(result).toEqual({
        partners: [],
        isLoading: false,
        error: 'Failed to load third party moving partners',
      });
    });
  });

  describe('Cache Management', () => {
    it('clears cache correctly', async () => {
      // First, populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      await service.fetchPartners();
      expect(service.getCachedPartners()).toEqual(mockPartners);

      // Clear cache
      service.clearCache();
      expect(service.getCachedPartners()).toBeNull();
      expect(service.getCurrentError()).toBeNull();
    });

    it('fetches fresh data after cache is cleared', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      await service.fetchPartners();

      // Clear cache
      service.clearCache();

      // Second call should trigger new fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      await service.fetchPartners();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('State Getters', () => {
    it('returns cached partners correctly', async () => {
      expect(service.getCachedPartners()).toBeNull();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      await service.fetchPartners();

      expect(service.getCachedPartners()).toEqual(mockPartners);
    });

    it('returns current error state correctly', async () => {
      expect(service.getCurrentError()).toBeNull();

      mockFetch.mockRejectedValueOnce(new Error('Test error'));

      await service.fetchPartners();

      expect(service.getCurrentError()).toBe('Test error');
    });

    it('returns current loading state correctly', () => {
      // Note: This is tricky to test due to async nature
      // In a real scenario, you might need to test this differently
      expect(service.getCurrentLoadingState()).toBe(false);
    });
  });

  describe('Concurrent Requests', () => {
    it('handles concurrent requests without duplicate fetches', async () => {
      const mockResponse = {
        ok: true,
        json: async () => mockPartners,
      } as Response;

      mockFetch.mockResolvedValue(mockResponse);

      // Make multiple concurrent requests
      const promises = [
        service.fetchPartners(),
        service.fetchPartners(),
        service.fetchPartners(),
      ];

      const results = await Promise.all(promises);

      // Should only make one fetch call
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // All results should be the same
      results.forEach(result => {
        expect(result).toEqual({
          partners: mockPartners,
          isLoading: false,
          error: null,
        });
      });
    });
  });

  describe('Error Recovery', () => {
    it('can recover from errors on subsequent calls', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const errorResult = await service.fetchPartners();
      expect(errorResult.error).toBe('Network error');

      // Clear cache to allow retry
      service.clearCache();

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPartners,
      } as Response);

      const successResult = await service.fetchPartners();
      expect(successResult).toEqual({
        partners: mockPartners,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('Data Validation', () => {
    it('accepts valid partner data', async () => {
      const validPartners = [
        {
          id: 1,
          title: 'Test Company',
          description: 'Test description',
          imageSrc: 'https://example.com/image.jpg',
          rating: 4.5,
          reviews: '100 reviews',
          weblink: 'https://example.com',
          gmblink: 'https://maps.google.com/test',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validPartners,
      } as Response);

      const result = await service.fetchPartners();

      expect(result.partners).toEqual(validPartners);
      expect(result.error).toBeNull();
    });

    it('handles empty array response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const result = await service.fetchPartners();

      expect(result).toEqual({
        partners: [],
        isLoading: false,
        error: null,
      });
    });
  });
});
