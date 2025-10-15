/**
 * @fileoverview useThirdPartyMovingPartners Hook - State management for third-party moving partners
 * @source Extracted from boombox-10.0/src/app/components/reusablecomponents/thirdpartylaborlist.tsx
 * 
 * HOOK FUNCTIONALITY:
 * - Manages loading, error, and data states for third-party moving partners
 * - Implements caching through the service layer
 * - Provides methods for refreshing data and clearing cache
 * - Handles component lifecycle and cleanup
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - API call logic moved to ThirdPartyMovingPartnerService
 * - State management centralized in this custom hook
 * - Error handling and loading states managed here
 */

import { useState, useEffect, useCallback } from 'react';
import ThirdPartyMovingPartnerService, { 
  ThirdPartyMovingPartner, 
  ThirdPartyMovingPartnerServiceResult 
} from '@/lib/services/thirdPartyMovingPartnerService';

interface UseThirdPartyMovingPartnersReturn {
  partners: ThirdPartyMovingPartner[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Custom hook for managing third-party moving partners data
 * @returns Object containing partners data, loading state, error state, and utility functions
 */
export const useThirdPartyMovingPartners = (): UseThirdPartyMovingPartnersReturn => {
  const [partners, setPartners] = useState<ThirdPartyMovingPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = ThirdPartyMovingPartnerService.getInstance();

  /**
   * Fetches partners data from the service
   */
  const fetchPartners = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result: ThirdPartyMovingPartnerServiceResult = await service.fetchPartners();

      setPartners(result.partners);
      setIsLoading(result.isLoading);
      setError(result.error);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch partners';
      setError(errorMessage);
      setIsLoading(false);
      setPartners([]);
    }
  }, [service]);

  /**
   * Refetches partners data (clears cache first)
   */
  const refetch = useCallback(async () => {
    service.clearCache();
    await fetchPartners();
  }, [service, fetchPartners]);

  /**
   * Clears the cached data
   */
  const clearCache = useCallback(() => {
    service.clearCache();
    setPartners([]);
    setError(null);
  }, [service]);

  // Initial data fetch on mount
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    isLoading,
    error,
    refetch,
    clearCache,
  };
};

export default useThirdPartyMovingPartners;
