/**
 * @fileoverview useVehicles custom hook for multi-vehicle management
 * 
 * HOOK FUNCTIONALITY:
 * Custom React hook that manages multiple vehicles for moving partners.
 * Movers can have a fleet of vehicles, unlike drivers who are limited to one.
 * Provides loading states, error handling, and all vehicle-related operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { VehicleService, Vehicle } from '@/lib/services/vehicleService';

export interface UseVehiclesReturn {
  // State
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  isRemoving: boolean;
  isUploading: boolean;
  removingVehicleId: number | null;

  // Actions
  removeVehicle: (vehicleId: number) => Promise<void>;
  uploadInsurance: (vehicleId: number, files: File[]) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing multiple vehicles (for movers)
 */
export function useVehicles(userId: string, onRemove?: () => void): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [removingVehicleId, setRemovingVehicleId] = useState<number | null>(null);

  /**
   * Fetch all vehicles for the mover
   */
  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const vehiclesData = await VehicleService.fetchAllVehicles(userId);
      setVehicles(vehiclesData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Remove a specific vehicle
   */
  const removeVehicle = useCallback(async (vehicleId: number) => {
    try {
      setIsRemoving(true);
      setRemovingVehicleId(vehicleId);
      setError(null);
      
      await VehicleService.removeVehicleById(userId, 'mover', vehicleId);
      
      // Update local state to remove the vehicle
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      
      // Call the callback if provided
      if (onRemove) {
        onRemove();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRemoving(false);
      setRemovingVehicleId(null);
    }
  }, [userId, onRemove]);

  /**
   * Upload insurance document for a specific vehicle
   */
  const uploadInsurance = useCallback(async (vehicleId: number, files: File[]) => {
    if (!files.length) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Note: This uses the existing upload method - may need to be updated
      // to support specifying which vehicle's insurance is being uploaded
      await VehicleService.uploadInsurance(userId, 'mover', files[0]);
      
      // Refresh vehicles data to get updated insurance info
      const updatedVehicles = await VehicleService.refreshAllVehicles(userId);
      setVehicles(updatedVehicles);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  /**
   * Refresh vehicles data
   */
  const refreshVehicles = useCallback(async () => {
    await fetchVehicles();
  }, [fetchVehicles]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    isRemoving,
    isUploading,
    removingVehicleId,
    removeVehicle,
    uploadInsurance,
    refreshVehicles,
    clearError,
  };
}

