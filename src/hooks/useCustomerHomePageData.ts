/**
 * @fileoverview Centralized data fetching hook for Customer Home Page
 * Fetches all customer dashboard data at the page level to enable coordinated loading.
 * 
 * This hook consolidates data fetching for:
 * - Active appointments
 * - Packing supply orders
 * - Storage units
 * - Active storage check (for conditional UI)
 * 
 * Benefits:
 * - Single loading state for entire page
 * - No layout shift from sections appearing/disappearing
 * - Coordinated data refresh
 * - Better error handling at page level
 * - Focus-based refetching for cross-tab synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getActiveCustomerAppointments,
  getActivePackingSupplyOrders,
  getActiveStorageUnits,
  hasActiveStorageUnits,
  type CustomerAppointmentDisplay,
  type PackingSupplyOrderDisplay,
  type StorageUnitUsageDisplay,
} from '@/lib/services/customerDataService';

// Re-export types for convenience
export type {
  CustomerAppointmentDisplay,
  PackingSupplyOrderDisplay,
  StorageUnitUsageDisplay,
};

interface UseCustomerHomePageDataProps {
  userId: string;
}

interface UseCustomerHomePageDataReturn {
  // Data
  appointments: CustomerAppointmentDisplay[];
  packingSupplyOrders: PackingSupplyOrderDisplay[];
  storageUnits: StorageUnitUsageDisplay[];
  hasActiveStorage: boolean;
  // Loading states
  isLoading: boolean;
  // Error states
  error: string | null;
  // Actions
  refetchAppointments: () => Promise<void>;
  refetchPackingSupplyOrders: () => Promise<void>;
  refetchStorageUnits: () => Promise<void>;
  refetchAll: () => Promise<void>;
  // Setters for optimistic updates
  setAppointments: React.Dispatch<React.SetStateAction<CustomerAppointmentDisplay[]>>;
  setPackingSupplyOrders: React.Dispatch<React.SetStateAction<PackingSupplyOrderDisplay[]>>;
  setStorageUnits: React.Dispatch<React.SetStateAction<StorageUnitUsageDisplay[]>>;
}

export function useCustomerHomePageData({ userId }: UseCustomerHomePageDataProps): UseCustomerHomePageDataReturn {
  const [appointments, setAppointments] = useState<CustomerAppointmentDisplay[]>([]);
  const [packingSupplyOrders, setPackingSupplyOrders] = useState<PackingSupplyOrderDisplay[]>([]);
  const [storageUnits, setStorageUnits] = useState<StorageUnitUsageDisplay[]>([]);
  const [hasActiveStorage, setHasActiveStorage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if data has been fetched at least once (for focus-based refetching)
  const hasInitialData = useRef(false);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      const data = await getActiveCustomerAppointments(userId);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      throw err;
    }
  }, [userId]);

  // Fetch packing supply orders
  const fetchPackingSupplyOrders = useCallback(async () => {
    try {
      const data = await getActivePackingSupplyOrders(userId);
      setPackingSupplyOrders(data);
    } catch (err) {
      console.error('Error fetching packing supply orders:', err);
      throw err;
    }
  }, [userId]);

  // Fetch storage units
  const fetchStorageUnits = useCallback(async () => {
    try {
      const data = await getActiveStorageUnits(userId);
      // Sort by storageUnitNumber
      const sorted = [...data].sort((a, b) => {
        const numA = parseInt(a.storageUnit.storageUnitNumber);
        const numB = parseInt(b.storageUnit.storageUnitNumber);
        
        if (isNaN(numA) || isNaN(numB)) {
          return a.storageUnit.storageUnitNumber.localeCompare(b.storageUnit.storageUnitNumber);
        }
        
        return numA - numB;
      });
      setStorageUnits(sorted);
    } catch (err) {
      console.error('Error fetching storage units:', err);
      throw err;
    }
  }, [userId]);

  // Check if user has active storage
  const checkActiveStorage = useCallback(async () => {
    try {
      const hasStorage = await hasActiveStorageUnits(userId);
      setHasActiveStorage(hasStorage);
    } catch (err) {
      console.error('Error checking active storage:', err);
      // Don't throw - this is a non-critical check
    }
  }, [userId]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchAppointments(),
        fetchPackingSupplyOrders(),
        fetchStorageUnits(),
        checkActiveStorage(),
      ]);
      hasInitialData.current = true;
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments, fetchPackingSupplyOrders, fetchStorageUnits, checkActiveStorage]);
  
  // Silent refetch (doesn't show loading state) for focus-based updates
  const silentRefetch = useCallback(async () => {
    try {
      await Promise.all([
        fetchAppointments(),
        fetchPackingSupplyOrders(),
        fetchStorageUnits(),
        checkActiveStorage(),
      ]);
    } catch (err) {
      // Silent failures - don't update error state for background refreshes
      console.warn('Background refetch failed:', err);
    }
  }, [fetchAppointments, fetchPackingSupplyOrders, fetchStorageUnits, checkActiveStorage]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchAll();
    }
  }, [userId, fetchAll]);

  // Focus-based refetching for cross-tab synchronization
  // When user returns to the tab, silently refetch data to ensure it's up-to-date
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasInitialData.current) {
        silentRefetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [silentRefetch]);

  return {
    appointments,
    packingSupplyOrders,
    storageUnits,
    hasActiveStorage,
    isLoading,
    error,
    refetchAppointments: fetchAppointments,
    refetchPackingSupplyOrders: fetchPackingSupplyOrders,
    refetchStorageUnits: fetchStorageUnits,
    refetchAll: fetchAll,
    setAppointments,
    setPackingSupplyOrders,
    setStorageUnits,
  };
}

