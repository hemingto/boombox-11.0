/**
 * @fileoverview Custom hook for fetching admin data with loading/error states
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * HOOK FUNCTIONALITY:
 * Generic data fetching with:
 * - Loading state management
 * - Error handling
 * - Automatic refetch on mount
 * - Manual refetch capability
 * - Dependency-based refetching
 * 
 * BUSINESS LOGIC EXTRACTION:
 * - Consolidates duplicate fetch logic from 12+ admin pages
 * - Provides consistent error handling
 * - Reduces component complexity
 * 
 * @refactor Extracted from inline data fetching in admin pages
 */

import { useState, useEffect, useCallback } from 'react';

interface UseAdminDataFetchOptions<T> {
  /** API endpoint to fetch from */
  apiEndpoint: string;
  /** Optional dependencies for refetching */
  dependencies?: any[];
  /** Optional initial data */
  initialData?: T | null;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Optional transform function for response data */
  transformData?: (data: any) => T;
}

interface UseAdminDataFetchReturn<T> {
  /** Fetched data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manual refetch function */
  refetch: () => Promise<void>;
  /** Set data directly (for optimistic updates) */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * useAdminDataFetch - Generic hook for fetching admin data
 * 
 * @example
 * ```tsx
 * const { data: drivers, loading, error, refetch } = useAdminDataFetch<Driver[]>({
 *   apiEndpoint: '/api/admin/drivers',
 *   dependencies: [],
 * });
 * 
 * // Refetch after an action
 * const handleApprove = async () => {
 *   await approveDriver(driverId);
 *   await refetch();
 * };
 * ```
 */
export function useAdminDataFetch<T = any>({
  apiEndpoint,
  dependencies = [],
  initialData = null,
  fetchOnMount = true,
  transformData,
}: UseAdminDataFetchOptions<T>): UseAdminDataFetchReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch data from API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const json = await response.json();
      const transformedData = transformData ? transformData(json) : json;
      setData(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, transformData]);

  /**
   * Manual refetch function
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Fetch on mount and when dependencies change
   */
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
  };
}

