/**
 * @fileoverview Custom hook for labor selection and validation logic
 * @source boombox-10.0/src/app/components/getquote/chooselabor.tsx (labor selection logic)
 * @refactor Extracted labor selection state and validation logic
 */

import { useState, useEffect } from 'react';
import { MovingPartner } from '@/lib/services/movingPartnerService';

export interface SelectedLabor {
  id: string;
  price: string;
  title: string;
  onfleetTeamId?: string;
}

interface UseLaborSelectionParams {
  selectedLabor: SelectedLabor | null;
  planType: string;
  movingPartners: MovingPartner[];
  onUnavailableLaborChange?: (hasError: boolean) => void;
}

interface UseLaborSelectionReturn {
  // State
  selectedWeblink: string | null;
  unavailableLaborError: string | null;
  
  // Actions
  setSelectedWeblink: (weblink: string | null) => void;
  clearUnavailableLaborError: () => void;
  
  // Validation
  hasUnavailableLaborError: boolean;
}

export function useLaborSelection(params: UseLaborSelectionParams): UseLaborSelectionReturn {
  const { selectedLabor, planType, movingPartners, onUnavailableLaborChange } = params;
  
  const [selectedWeblink, setSelectedWeblink] = useState<string | null>(null);
  const [unavailableLaborError, setUnavailableLaborError] = useState<string | null>(null);

  // Check if selected partner is still available
  useEffect(() => {
    const hasError = !!(
      selectedLabor &&
      planType === "Full Service Plan" && 
      movingPartners.length > 0 &&
      !movingPartners.some((partner) => partner.id.toString() === selectedLabor.id)
    );

    if (hasError) {
      const errorMessage = `Your previously selected mover, ${selectedLabor.title}, is no longer available for the selected date/time. Please select another moving partner.`;
      setUnavailableLaborError(prev => {
        // Only update if error message changed
        if (prev !== errorMessage) {
          onUnavailableLaborChange?.(true);
          return errorMessage;
        }
        return prev;
      });
    } else {
      setUnavailableLaborError(prev => {
        // Only update if there was an error before
        if (prev !== null) {
          onUnavailableLaborChange?.(false);
          return null;
        }
        return prev;
      });
    }
  }, [selectedLabor, planType, movingPartners, onUnavailableLaborChange]);

  const clearUnavailableLaborError = () => {
    setUnavailableLaborError(null);
    onUnavailableLaborChange?.(false);
  };

  return {
    // State
    selectedWeblink,
    unavailableLaborError,
    
    // Actions
    setSelectedWeblink,
    clearUnavailableLaborError,
    
    // Validation
    hasUnavailableLaborError: !!unavailableLaborError,
  };
}
