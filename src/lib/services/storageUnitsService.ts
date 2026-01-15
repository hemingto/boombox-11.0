/**
 * @fileoverview Storage Units service for API integration
 * @source boombox-10.0/src/app/components/access-storage/accessstoragestep1.tsx (storage unit fetching logic)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/storageUnitsByUser → New: /api/customers/storage-units-by-customer
 * 
 * @refactor Extracted storage unit API calls to dedicated service layer with updated API endpoints
 */

import { ApiResponse } from '@/types/api';
import {
  StorageUnitUsage,
  FormattedStorageUnit,
  StorageUnitsApiResponse
} from '@/types/accessStorage.types';
import { storageUnitsApiResponseSchema } from '@/lib/validations/accessStorage.validations';

// ===== SERVICE INTERFACES =====

export interface StorageUnitFilters {
  userId: string;
  includeReturned?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  status?: 'active' | 'inactive' | 'all';
  includeImages?: boolean;
  includeLocation?: boolean;
}

export interface StorageUnitServiceOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  validateResponse?: boolean;
  enableCaching?: boolean;
}

export interface StorageUnitStats {
  totalUnits: number;
  activeUnits: number;
  inactiveUnits: number;
  unitsWithImages: number;
  unitsWithLocation: number;
  averageUsageDays: number;
}

// ===== DEFAULT OPTIONS =====

const DEFAULT_OPTIONS: Required<StorageUnitServiceOptions> = {
  timeout: 15000, // 15 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  validateResponse: true,
  enableCaching: false,
};

// ===== UTILITY FUNCTIONS =====

/**
 * Delay function for retry logic
 */
function delay(ms: number): Promise<void> {
  if (ms === 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (error && typeof error === 'object' && 'status' in error && 
          typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
        throw lastError;
      }

      console.warn(`Storage units fetch attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
      await delay(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Format raw storage unit data for UI consumption
 */
function formatStorageUnits(rawUnits: StorageUnitUsage[]): FormattedStorageUnit[] {
  return rawUnits.map((unit) => ({
    id: unit.storageUnit.id.toString(),
    imageSrc: unit.mainImage || '/placeholder.jpg',
    title: `Boombox ${unit.storageUnit.storageUnitNumber}`,
    pickUpDate: new Date(unit.usageStartDate).toLocaleDateString(),
    lastAccessedDate: unit.returnDate
      ? new Date(unit.returnDate).toLocaleDateString()
      : unit.usageStartDate
      ? new Date(unit.usageStartDate).toLocaleDateString()
      : 'Has not been accessed',
    description: unit.description || 'No description provided',
    location: unit.location
  }));
}

// ===== MAIN SERVICE FUNCTIONS =====

/**
 * Fetch storage units for a specific user
 * @param filters - User ID and optional filtering criteria
 * @param options - Service configuration options
 * @returns Promise with storage units data
 */
export async function fetchStorageUnitsByUser(
  filters: StorageUnitFilters,
  options: StorageUnitServiceOptions = {}
): Promise<ApiResponse<{ raw: StorageUnitUsage[]; formatted: FormattedStorageUnit[] }>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { 
    userId, 
    includeReturned, 
    sortBy, 
    sortOrder, 
    limit, 
    offset,
    status = 'all', 
    includeImages = true, 
    includeLocation = true 
  } = filters;

  if (!userId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
      }
    };
  }

  try {
    const apiCall = async (): Promise<ApiResponse<{ raw: StorageUnitUsage[]; formatted: FormattedStorageUnit[] }>> => {
      // Build query parameters
      const params = new URLSearchParams({ userId });
      
      // Add optional parameters only if they are defined
      if (includeReturned !== undefined) params.append('includeReturned', includeReturned.toString());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());
      if (status !== 'all') params.append('status', status);
      if (includeImages) params.append('includeImages', 'true');
      if (includeLocation) params.append('includeLocation', 'true');

      const response = await fetchWithTimeout(
        `/api/customers/storage-units-by-customer?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      // Handle both direct array responses and wrapped API responses
      let rawUnits: StorageUnitUsage[];
      
      if (Array.isArray(responseData)) {
        // Direct array response (for testing)
        rawUnits = responseData;
      } else {
        // Wrapped API response
        if (config.validateResponse) {
          const validationResult = storageUnitsApiResponseSchema.safeParse(responseData);
          
          if (!validationResult.success) {
            console.error('Invalid storage units API response structure:', validationResult.error);
            return {
              success: false,
              error: {
                code: 'PARSE_ERROR',
                message: 'Invalid response format',
              }
            };
          }
        }

        if (!responseData.success) {
          throw new Error(responseData.error || responseData.message || 'Failed to fetch storage units');
        }

        rawUnits = responseData.data || [];
      }
      const formattedUnits = formatStorageUnits(rawUnits);

      return {
        success: true,
        data: {
          raw: rawUnits,
          formatted: formattedUnits
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
          count: rawUnits.length,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error fetching storage units:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out. Please try again.',
          }
        };
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection and try again.',
          }
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred while fetching storage units',
      }
    };
  }
}

/**
 * Get storage unit details by ID
 * @param unitId - Storage unit ID to fetch
 * @param options - Service configuration options
 * @returns Promise with storage unit details
 */
export async function getStorageUnitById(
  unitId: string,
  options: StorageUnitServiceOptions = {}
): Promise<ApiResponse<StorageUnitUsage>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!unitId) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Storage unit ID is required',
      }
    };
  }

  try {
    const apiCall = async (): Promise<ApiResponse<StorageUnitUsage>> => {
      const response = await fetchWithTimeout(
        `/api/customers/storage-units-by-customer/${unitId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to fetch storage unit');
      }

      return {
        success: true,
        data: responseData.data as StorageUnitUsage,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error fetching storage unit by ID:', error);

    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch storage unit details.',
      }
    };
  }
}

/**
 * Update storage unit description
 * @param unitId - Storage unit ID to update
 * @param description - New description
 * @param options - Service configuration options
 * @returns Promise with update result
 */
export async function updateStorageUnitDescription(
  unitId: string,
  description: string,
  options: StorageUnitServiceOptions = {}
): Promise<ApiResponse<{ updated: boolean }>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!unitId) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Storage unit ID is required',
      }
    };
  }

  try {
    const apiCall = async (): Promise<ApiResponse<{ updated: boolean }>> => {
      const response = await fetchWithTimeout(
        `/api/customers/storage-units-by-customer/${unitId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description }),
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to update storage unit');
      }

      return {
        success: true,
        data: { updated: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error updating storage unit description:', error);

    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update storage unit description.',
      }
    };
  }
}

// ===== UTILITY AND ANALYSIS FUNCTIONS =====

/**
 * Calculate storage unit statistics
 * @param units - Array of storage units to analyze
 * @returns Statistical summary of storage units
 */
export function calculateStorageUnitStats(units: StorageUnitUsage[]): StorageUnitStats {
  const totalUnits = units.length;
  const activeUnits = units.filter(unit => !unit.usageEndDate).length;
  const inactiveUnits = totalUnits - activeUnits;
  const unitsWithImages = units.filter(unit => unit.mainImage).length;
  const unitsWithLocation = units.filter(unit => unit.location).length;

  // Calculate average usage days
  const usageDays = units.map(unit => {
    const startDate = new Date(unit.usageStartDate);
    const endDate = unit.usageEndDate ? new Date(unit.usageEndDate) : new Date();
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  });

  const averageUsageDays = usageDays.length > 0 
    ? Math.round(usageDays.reduce((sum, days) => sum + days, 0) / usageDays.length)
    : 0;

  return {
    totalUnits,
    activeUnits,
    inactiveUnits,
    unitsWithImages,
    unitsWithLocation,
    averageUsageDays,
  };
}

/**
 * Filter storage units by criteria
 * @param units - Array of storage units to filter
 * @param criteria - Filtering criteria
 * @returns Filtered array of storage units
 */
export function filterStorageUnits(
  units: StorageUnitUsage[],
  criteria: {
    hasImages?: boolean;
    hasLocation?: boolean;
    isActive?: boolean;
    minUsageDays?: number;
    maxUsageDays?: number;
  }
): StorageUnitUsage[] {
  return units.filter(unit => {
    // Filter by image presence
    if (criteria.hasImages !== undefined) {
      const hasImage = !!unit.mainImage;
      if (hasImage !== criteria.hasImages) return false;
    }

    // Filter by location presence
    if (criteria.hasLocation !== undefined) {
      const hasLocation = !!unit.location;
      if (hasLocation !== criteria.hasLocation) return false;
    }

    // Filter by active status
    if (criteria.isActive !== undefined) {
      const isActive = !unit.usageEndDate;
      if (isActive !== criteria.isActive) return false;
    }

    // Filter by usage duration
    if (criteria.minUsageDays !== undefined || criteria.maxUsageDays !== undefined) {
      const startDate = new Date(unit.usageStartDate);
      const endDate = unit.usageEndDate ? new Date(unit.usageEndDate) : new Date();
      const usageDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (criteria.minUsageDays !== undefined && usageDays < criteria.minUsageDays) return false;
      if (criteria.maxUsageDays !== undefined && usageDays > criteria.maxUsageDays) return false;
    }

    return true;
  });
}

/**
 * Sort storage units by various criteria
 * @param units - Array of storage units to sort
 * @param sortBy - Sorting criteria
 * @param order - Sort order (asc/desc)
 * @returns Sorted array of storage units
 */
export function sortStorageUnits(
  units: StorageUnitUsage[],
  sortBy: 'unitNumber' | 'usageStartDate' | 'lastAccessed' | 'description',
  order: 'asc' | 'desc' = 'asc'
): StorageUnitUsage[] {
  const sorted = [...units].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'unitNumber':
        comparison = a.storageUnit.storageUnitNumber.localeCompare(b.storageUnit.storageUnitNumber);
        break;
      case 'usageStartDate':
        comparison = new Date(a.usageStartDate).getTime() - new Date(b.usageStartDate).getTime();
        break;
      case 'lastAccessed':
        const aLastAccessed = a.returnDate || a.usageStartDate;
        const bLastAccessed = b.returnDate || b.usageStartDate;
        comparison = new Date(aLastAccessed).getTime() - new Date(bLastAccessed).getTime();
        break;
      case 'description':
        const aDesc = a.description || '';
        const bDesc = b.description || '';
        comparison = aDesc.localeCompare(bDesc);
        break;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Validate storage unit selection for access storage form
 * @param selectedIds - Array of selected storage unit IDs
 * @param availableUnits - Array of available storage units
 * @param isEndStorageTerm - Whether this is for ending storage term
 * @returns Validation result
 */
export function validateStorageUnitSelection(
  selectedIds: string[],
  availableUnits: FormattedStorageUnit[],
  isEndStorageTerm: boolean = false
): { isValid: boolean; error?: string } {
  if (availableUnits.length === 0) {
    return { isValid: false, error: 'No storage units available' };
  }

  if (selectedIds.length === 0) {
    return { isValid: false, error: 'At least one storage unit must be selected' };
  }

  // Check if all selected IDs exist in available units
  const availableIds = availableUnits.map(unit => unit.id);
  const invalidIds = selectedIds.filter(id => !availableIds.includes(id));
  
  if (invalidIds.length > 0) {
    return { 
      isValid: false, 
      error: `Selected storage unit not found: ${invalidIds[0]}` 
    };
  }

  // For end storage term, all units must be selected
  if (isEndStorageTerm && selectedIds.length !== availableUnits.length) {
    return { 
      isValid: false, 
      error: 'All storage units must be selected when ending storage term' 
    };
  }

  return { isValid: true };
}
