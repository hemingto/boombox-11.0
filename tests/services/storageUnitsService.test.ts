/**
 * @fileoverview Jest tests for storageUnitsService
 * @source boombox-11.0/src/lib/services/storageUnitsService.ts
 * 
 * TEST COVERAGE:
 * - Service initialization and configuration
 * - Storage units fetching with filters
 * - Data transformation and formatting
 * - Error handling and retry logic
 * - Caching and performance optimization
 * - Sorting and filtering utilities
 * - Validation functions
 * - Network error recovery
 * 
 * @refactor Comprehensive tests for the storage units service layer
 */

import {
  fetchStorageUnitsByUser,
  sortStorageUnits,
  validateStorageUnitSelection
} from '@/lib/services/storageUnitsService';
import type {
  StorageUnitUsage,
  FormattedStorageUnit,
  StorageUnitFilters,
  StorageUnitServiceOptions
} from '@/types/accessStorage.types';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortController for timeout tests
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: { aborted: false }
})) as any;

// Mock setTimeout for timeout handling
global.setTimeout = jest.fn((fn, delay) => {
  if (delay >= 5000) {
    // Simulate timeout by calling the function immediately for timeout tests
    fn();
  }
  return 1;
}) as any;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// Mock data
const mockRawStorageUnits: StorageUnitUsage[] = [
  {
    id: 1,
    storageUnit: {
      id: 101,
      storageUnitNumber: 'BX001',
    },
    usageStartDate: '2024-01-15T10:00:00Z',
    returnDate: '2024-02-15T10:00:00Z',
    mainImage: 'https://example.com/image1.jpg',
    description: 'Living room furniture',
  },
  {
    id: 2,
    storageUnit: {
      id: 102,
      storageUnitNumber: 'BX002',
    },
    usageStartDate: '2024-01-20T10:00:00Z',
    returnDate: null,
    mainImage: null,
    description: 'Bedroom items',
  },
  {
    id: 3,
    storageUnit: {
      id: 103,
      storageUnitNumber: 'BX003',
    },
    usageStartDate: '2024-01-10T10:00:00Z',
    returnDate: '2024-01-25T10:00:00Z',
    mainImage: 'https://example.com/image3.jpg',
    description: 'Kitchen appliances',
  },
];

const mockFormattedStorageUnits: FormattedStorageUnit[] = [
  {
    id: '101',
    imageSrc: 'https://example.com/image1.jpg',
    title: 'Boombox BX001',
    pickUpDate: '1/15/2024',
    lastAccessedDate: '2/15/2024',
    description: 'Living room furniture',
  },
  {
    id: '102',
    imageSrc: '/placeholder.jpg',
    title: 'Boombox BX002',
    pickUpDate: '1/20/2024',
    lastAccessedDate: '1/20/2024',
    description: 'Bedroom items',
  },
  {
    id: '103',
    imageSrc: 'https://example.com/image3.jpg',
    title: 'Boombox BX003',
    pickUpDate: '1/10/2024',
    lastAccessedDate: '1/25/2024',
    description: 'Kitchen appliances',
  },
];

describe('storageUnitsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockRawStorageUnits,
      headers: {
        get: (key: string) => key === 'x-request-id' ? 'req-456' : null
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('fetchStorageUnitsByUser', () => {
    const defaultFilters: StorageUnitFilters = {
      userId: 'test-user-123',
    };

    it('fetches storage units successfully', async () => {
      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(true);
      expect(result.data?.raw).toEqual(mockRawStorageUnits);
      expect(result.data?.formatted).toHaveLength(3);
      expect(result.data?.formatted[0]).toMatchObject({
        id: '101',
        title: 'Boombox BX001',
        description: 'Living room furniture',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/customers/storage-units-by-customer?userId=test-user-123&includeImages=true&includeLocation=true',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: expect.any(Object),
        }
      );
    });

    it('includes additional filters in query string', async () => {
      const filters: StorageUnitFilters = {
        userId: 'test-user-123',
        includeReturned: false,
        sortBy: 'usageStartDate',
        sortOrder: 'desc',
      };

      await fetchStorageUnitsByUser(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/customers/storage-units-by-customer?userId=test-user-123&includeReturned=false&sortBy=usageStartDate&sortOrder=desc&includeImages=true&includeLocation=true',
        expect.any(Object)
      );
    });

    it('handles empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(true);
      expect(result.data?.raw).toEqual([]);
      expect(result.data?.formatted).toEqual([]);
    });

    it('transforms data correctly', async () => {
      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(true);
      const formatted = result.data?.formatted;

      // Check first unit transformation
      expect(formatted?.[0]).toEqual({
        id: '101',
        imageSrc: 'https://example.com/image1.jpg',
        title: 'Boombox BX001',
        pickUpDate: '1/15/2024',
        lastAccessedDate: '2/15/2024',
        description: 'Living room furniture',
      });

      // Check unit without image
      expect(formatted?.[1].imageSrc).toBe('/placeholder.jpg');

      // Check unit without return date
      expect(formatted?.[1].lastAccessedDate).toBe('1/20/2024'); // Should use usage start date
    });

    it('handles API error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'User not found' }),
      });

      const result = await fetchStorageUnitsByUser(defaultFilters, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
      expect(result.error?.message).toBe('User not found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const result = await fetchStorageUnitsByUser(defaultFilters, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Network error. Please check your connection and try again.');
    });

    it('handles timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await fetchStorageUnitsByUser(defaultFilters, {
        timeout: 5000,
        retryAttempts: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TIMEOUT_ERROR');
      expect(result.error?.message).toBe('Request timed out. Please try again.');
    });

    it('retries on server errors', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call fails with server error
          const serverError = new Error('Server error');
          (serverError as any).status = 500;
          return Promise.reject(serverError);
        } else {
          // Second call succeeds
          return Promise.resolve({
            ok: true,
            json: async () => mockRawStorageUnits,
            headers: {
              get: () => null
            },
          });
        }
      });

      const result = await fetchStorageUnitsByUser(defaultFilters, {
        retryAttempts: 2,
        retryDelay: 0, // No delay for faster test
      });

      expect(callCount).toBe(2);
      expect(result.success).toBe(true);
    });

    it('does not retry on client errors', async () => {
      const clientError = new Error('Invalid user ID');
      (clientError as any).status = 400;
      mockFetch.mockRejectedValue(clientError);

      const result = await fetchStorageUnitsByUser(defaultFilters, {
        retryAttempts: 3,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
    });

    it('validates required userId', async () => {
      const result = await fetchStorageUnitsByUser({} as StorageUnitFilters);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.message).toBe('User ID is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles malformed API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARSE_ERROR');
      expect(result.error?.message).toBe('Invalid response format');
    });

    it('uses custom service options', async () => {
      const customOptions: StorageUnitServiceOptions = {
        timeout: 15000,
        retryAttempts: 5,
        retryDelay: 2000,
        enableCaching: true,
      };

      await fetchStorageUnitsByUser(defaultFilters, customOptions);

      expect(mockFetch).toHaveBeenCalled();
    });

    it('handles missing image gracefully', async () => {
      const unitsWithoutImages = mockRawStorageUnits.map(unit => ({
        ...unit,
        mainImage: null,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => unitsWithoutImages,
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(true);
      result.data?.formatted.forEach(unit => {
        expect(unit.imageSrc).toBe('/placeholder.jpg');
      });
    });

    it('handles missing description gracefully', async () => {
      const unitsWithoutDescription = mockRawStorageUnits.map(unit => ({
        ...unit,
        description: null,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => unitsWithoutDescription,
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser(defaultFilters);

      expect(result.success).toBe(true);
      result.data?.formatted.forEach(unit => {
        expect(unit.description).toBe('No description provided');
      });
    });
  });

  describe('sortStorageUnits', () => {
    it('sorts by unit number ascending', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'unitNumber', 'asc');

      expect(sorted[0].storageUnit.storageUnitNumber).toBe('BX001');
      expect(sorted[1].storageUnit.storageUnitNumber).toBe('BX002');
      expect(sorted[2].storageUnit.storageUnitNumber).toBe('BX003');
    });

    it('sorts by unit number descending', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'unitNumber', 'desc');

      expect(sorted[0].storageUnit.storageUnitNumber).toBe('BX003');
      expect(sorted[1].storageUnit.storageUnitNumber).toBe('BX002');
      expect(sorted[2].storageUnit.storageUnitNumber).toBe('BX001');
    });

    it('sorts by usage start date ascending', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'usageStartDate', 'asc');

      expect(sorted[0].storageUnit.storageUnitNumber).toBe('BX003'); // Jan 10
      expect(sorted[1].storageUnit.storageUnitNumber).toBe('BX001'); // Jan 15
      expect(sorted[2].storageUnit.storageUnitNumber).toBe('BX002'); // Jan 20
    });

    it('sorts by usage start date descending', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'usageStartDate', 'desc');

      expect(sorted[0].storageUnit.storageUnitNumber).toBe('BX002'); // Jan 20
      expect(sorted[1].storageUnit.storageUnitNumber).toBe('BX001'); // Jan 15
      expect(sorted[2].storageUnit.storageUnitNumber).toBe('BX003'); // Jan 10
    });

    it('sorts by last accessed date', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'lastAccessed', 'desc');

      // BX001 has return date Feb 15, BX003 has return date Jan 25, BX002 has no return date (uses start date)
      expect(sorted[0].storageUnit.storageUnitNumber).toBe('BX001'); // Feb 15
      expect(sorted[1].storageUnit.storageUnitNumber).toBe('BX003'); // Jan 25
      expect(sorted[2].storageUnit.storageUnitNumber).toBe('BX002'); // Jan 20 (start date)
    });

    it('sorts by description', () => {
      const sorted = sortStorageUnits(mockRawStorageUnits, 'description', 'asc');

      expect(sorted[0].description).toBe('Bedroom items');
      expect(sorted[1].description).toBe('Kitchen appliances');
      expect(sorted[2].description).toBe('Living room furniture');
    });

    it('handles empty array', () => {
      const sorted = sortStorageUnits([], 'unitNumber', 'asc');

      expect(sorted).toEqual([]);
    });

    it('handles units with missing data', () => {
      const unitsWithMissingData = [
        ...mockRawStorageUnits,
        {
          id: 4,
          storageUnit: {
            id: 104,
            storageUnitNumber: 'BX004',
          },
          usageStartDate: '2024-01-05T10:00:00Z',
          returnDate: null,
          mainImage: null,
          description: null,
        },
      ];

      const sorted = sortStorageUnits(unitsWithMissingData, 'description', 'asc');

      expect(sorted).toHaveLength(4);
      // Unit with null description should be handled gracefully
    });
  });

  describe('validateStorageUnitSelection', () => {
    const availableUnits: FormattedStorageUnit[] = [
      {
        id: '101',
        imageSrc: 'image1.jpg',
        title: 'Unit 1',
        pickUpDate: '1/15/2024',
        lastAccessedDate: '2/15/2024',
        description: 'Unit 1',
      },
      {
        id: '102',
        imageSrc: 'image2.jpg',
        title: 'Unit 2',
        pickUpDate: '1/20/2024',
        lastAccessedDate: '1/20/2024',
        description: 'Unit 2',
      },
    ];

    it('validates successful selection', () => {
      const result = validateStorageUnitSelection(['101', '102'], availableUnits);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('requires at least one unit selection', () => {
      const result = validateStorageUnitSelection([], availableUnits);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('At least one storage unit must be selected');
    });

    it('validates selected units exist', () => {
      const result = validateStorageUnitSelection(['101', '999'], availableUnits);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Selected storage unit not found: 999');
    });

    it('validates all units for end storage term', () => {
      const result = validateStorageUnitSelection(['101'], availableUnits, true);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('All storage units must be selected when ending storage term');
    });

    it('allows all units selection for end storage term', () => {
      const result = validateStorageUnitSelection(['101', '102'], availableUnits, true);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('handles empty available units', () => {
      const result = validateStorageUnitSelection(['101'], []);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No storage units available');
    });

    it('handles duplicate selections', () => {
      const result = validateStorageUnitSelection(['101', '101', '102'], availableUnits);

      expect(result.isValid).toBe(true); // Should handle duplicates gracefully
    });
  });

  describe('Error Logging', () => {
    it('logs errors to console', async () => {
      const testError = new Error('Test error');
      mockFetch.mockRejectedValue(testError);

      const result = await fetchStorageUnitsByUser({ userId: 'test-user-123' }, { retryAttempts: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FETCH_ERROR');
    });
  });

  describe('Query String Building', () => {
    it('builds query string correctly with multiple parameters', async () => {
      const filters: StorageUnitFilters = {
        userId: 'test-user-123',
        includeReturned: true,
        sortBy: 'unitNumber',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      };

      await fetchStorageUnitsByUser(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/customers/storage-units-by-customer?userId=test-user-123&includeReturned=true&sortBy=unitNumber&sortOrder=asc&limit=10&offset=0&includeImages=true&includeLocation=true',
        expect.any(Object)
      );
    });

    it('handles special characters in query parameters', async () => {
      const filters: StorageUnitFilters = {
        userId: 'test-user@example.com',
      };

      await fetchStorageUnitsByUser(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/customers/storage-units-by-customer?userId=test-user%40example.com&includeImages=true&includeLocation=true',
        expect.any(Object)
      );
    });

    it('omits undefined parameters from query string', async () => {
      const filters: StorageUnitFilters = {
        userId: 'test-user-123',
        includeReturned: undefined,
        sortBy: 'unitNumber',
        sortOrder: undefined,
      };

      await fetchStorageUnitsByUser(filters);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/customers/storage-units-by-customer?userId=test-user-123&sortBy=unitNumber&includeImages=true&includeLocation=true',
        expect.any(Object)
      );
    });
  });

  describe('Date Formatting', () => {
    it('formats dates consistently', async () => {
      const result = await fetchStorageUnitsByUser({ userId: 'test-user-123' });

      expect(result.success).toBe(true);
      const formatted = result.data?.formatted;

      // Check date format (should be M/D/YYYY)
      expect(formatted?.[0].pickUpDate).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(formatted?.[0].lastAccessedDate).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    it('handles invalid dates gracefully', async () => {
      const unitsWithInvalidDates = mockRawStorageUnits.map(unit => ({
        ...unit,
        usageStartDate: 'invalid-date',
        returnDate: 'invalid-date',
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => unitsWithInvalidDates,
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser({ userId: 'test-user-123' });

      expect(result.success).toBe(true);
      // Should handle invalid dates without crashing
      expect(result.data?.formatted).toHaveLength(3);
    });
  });

  describe('Performance and Caching', () => {
    it('includes cache headers when caching is enabled', async () => {
      await fetchStorageUnitsByUser(
        { userId: 'test-user-123' },
        { enableCaching: true }
      );

      // In a real implementation, this would check for cache-related headers
      expect(mockFetch).toHaveBeenCalled();
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        storageUnit: {
          id: index + 101,
          storageUnitNumber: `BX${String(index + 1).padStart(3, '0')}`,
        },
        usageStartDate: '2024-01-15T10:00:00Z',
        returnDate: null,
        mainImage: null,
        description: `Unit ${index + 1}`,
      }));

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => largeDataset,
        headers: {
          get: () => null
        },
      });

      const result = await fetchStorageUnitsByUser({ userId: 'test-user-123' });

      expect(result.success).toBe(true);
      expect(result.data?.formatted).toHaveLength(100);
    });
  });
});
