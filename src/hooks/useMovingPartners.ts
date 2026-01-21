/**
 * @fileoverview Custom hook for moving partner management and selection
 * @source boombox-10.0/src/app/components/getquote/chooselabor.tsx (state management and API logic)
 * @refactor Extracted moving partner logic from ChooseLabor component
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  MovingPartner, 
  MovingPartnerFilters,
  fetchAvailableMovingPartners,
  isMovingPartnerAvailable 
} from '@/lib/services/movingPartnerService';
import { sortItems, paginateItems, SortOption } from '@/lib/utils/sortingUtils';

interface UseMovingPartnersParams {
  selectedDate: Date | null;
  appointmentId?: string;
  itemsPerPage?: number;
}

interface UseMovingPartnersReturn {
  // Data
  movingPartners: MovingPartner[];
  sortedPartners: MovingPartner[];
  currentItems: MovingPartner[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  
  // Sorting
  sortBy: SortOption;
  
  // Actions
  setSortBy: (sort: SortOption) => void;
  setCurrentPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
  
  // Utilities
  isPartnerAvailable: (partnerId: string) => boolean;
}

export function useMovingPartners(params: UseMovingPartnersParams): UseMovingPartnersReturn {
  const { selectedDate, appointmentId, itemsPerPage = 5 } = params;
  
  // State
  const [movingPartners, setMovingPartners] = useState<MovingPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Fetch moving partners
  const fetchPartners = async () => {
    if (!selectedDate) {
      setIsLoading(false);
      setMovingPartners([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const filters: MovingPartnerFilters = {
      date: selectedDate,
      excludeAppointmentId: appointmentId,
    };

    const result = await fetchAvailableMovingPartners(filters);
    
    if (result.success) {
      setMovingPartners(result.data || []);
      setError(null);
    } else {
      setMovingPartners([]);
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : result.error?.message || 'Failed to fetch moving partners';
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  // Fetch partners when dependencies change
  useEffect(() => {
    fetchPartners();
  }, [selectedDate, appointmentId]);

  // Sorted partners
  const sortedPartners = useMemo(() => {
    return sortItems(movingPartners, sortBy);
  }, [movingPartners, sortBy]);

  // Paginated partners
  const paginationResult = useMemo(() => {
    return paginateItems(sortedPartners, {
      currentPage,
      itemsPerPage,
      totalItems: sortedPartners.length,
    });
  }, [sortedPartners, currentPage, itemsPerPage]);

  // Navigation functions
  const nextPage = () => {
    if (paginationResult.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (paginationResult.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Check if partner is available
  const isPartnerAvailable = (partnerId: string) => {
    return isMovingPartnerAvailable(partnerId, movingPartners);
  };

  return {
    // Data
    movingPartners,
    sortedPartners,
    currentItems: paginationResult.currentItems,
    
    // Loading and error states
    isLoading,
    error,
    
    // Pagination
    currentPage,
    totalPages: paginationResult.totalPages,
    hasNextPage: paginationResult.hasNextPage,
    hasPrevPage: paginationResult.hasPrevPage,
    
    // Sorting
    sortBy,
    
    // Actions
    setSortBy: handleSortChange,
    setCurrentPage,
    nextPage,
    prevPage,
    refetch: fetchPartners,
    
    // Utilities
    isPartnerAvailable,
  };
}
