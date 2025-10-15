/**
 * @fileoverview useVehicle custom hook for vehicle management
 * @source Extracted from boombox-10.0/src/app/components/reusablecomponents/addedvehicle.tsx
 * 
 * HOOK FUNCTIONALITY:
 * Custom React hook that manages vehicle state and operations for both drivers and movers.
 * Provides loading states, error handling, and all vehicle-related operations.
 * 
 * @refactor Extracted business logic from AddedVehicle component into reusable hook
 */

import { useState, useEffect, useCallback } from 'react';
import { VehicleService, Vehicle, UserType } from '@/lib/services/vehicleService';

export interface UseVehicleReturn {
  // State
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
  isRemoving: boolean;
  isUploading: boolean;

  // Actions
  removeVehicle: () => Promise<void>;
  uploadInsurance: (files: File[]) => Promise<void>;
  refreshVehicle: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for vehicle management
 */
export function useVehicle(userId: string, userType: UserType, onRemove?: () => void): UseVehicleReturn {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fetch vehicle data
   */
  const fetchVehicle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vehicleData = await VehicleService.fetchVehicle(userId, userType);
      setVehicle(vehicleData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  /**
   * Remove vehicle
   */
  const removeVehicle = useCallback(async () => {
    if (!vehicle) return;
    
    try {
      setIsRemoving(true);
      setError(null);
      
      await VehicleService.removeVehicle(userId, userType);
      
      // Always update local state to reflect removal
      setVehicle(null);
      
      // Call the callback if provided
      if (onRemove) {
        onRemove();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRemoving(false);
    }
  }, [vehicle, userId, userType, onRemove]);

  /**
   * Upload insurance document
   */
  const uploadInsurance = useCallback(async (files: File[]) => {
    if (!vehicle || !files.length) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      await VehicleService.uploadInsurance(userId, userType, files[0]);
      
      // Refresh vehicle data to get updated insurance info
      const updatedVehicle = await VehicleService.refreshVehicle(userId, userType);
      setVehicle(updatedVehicle);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  }, [vehicle, userId, userType]);

  /**
   * Refresh vehicle data
   */
  const refreshVehicle = useCallback(async () => {
    await fetchVehicle();
  }, [fetchVehicle]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return {
    vehicle,
    isLoading,
    error,
    isRemoving,
    isUploading,
    removeVehicle,
    uploadInsurance,
    refreshVehicle,
    clearError,
  };
}
