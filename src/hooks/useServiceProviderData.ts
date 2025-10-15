/**
 * @fileoverview Custom hook for fetching service provider display data
 * @source boombox-10.0/src/app/components/mover-account/accountinfocontent.tsx (data fetching logic)
 * @refactor Extracted data fetching logic from AccountInfoContent component
 */

import { useState, useEffect } from 'react';
import {
  getMovingPartnerDisplayData,
  ServiceProviderDisplayData,
} from '@/lib/services/serviceProviderDataService';

interface UseServiceProviderDataParams {
  userId: string;
  userType: 'driver' | 'mover';
}

interface UseServiceProviderDataReturn {
  data: ServiceProviderDisplayData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching service provider display data
 * Used to show how moving partners appear to customers on the platform
 */
export function useServiceProviderData(
  params: UseServiceProviderDataParams
): UseServiceProviderDataReturn {
  const { userId, userType } = params;

  const [data, setData] = useState<ServiceProviderDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // Only fetch for moving partners
    if (userType !== 'mover') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getMovingPartnerDisplayData(userId);
      setData(result);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load moving partner data';
      setError(errorMessage);
      console.error('Error fetching service provider data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, userType]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

