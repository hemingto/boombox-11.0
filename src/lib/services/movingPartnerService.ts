/**
 * @fileoverview Moving partner service for API integration
 * @source boombox-10.0/src/app/components/getquote/chooselabor.tsx (API fetching logic)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/moving-partners → New: /api/moving-partners/search
 * 
 * @refactor Extracted API calls to dedicated service layer with updated API endpoints
 */

import { ApiResponse } from '@/types/api.types';

export interface MovingPartner {
  id: number;
  name: string;
  description: string;
  hourlyRate: number;
  numberOfReviews: number;
  rating: number;
  gmbLink: string;
  featured?: boolean;
  imageSrc: string;
  onfleetTeamId?: string;
  availability: {
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  status: string;
}

export interface MovingPartnerFilters {
  date: Date;
  excludeAppointmentId?: string;
}

/**
 * Fetch available moving partners for a specific date and time
 * @param filters - Date and optional appointment exclusion
 * @returns Promise with moving partners data
 */
export async function fetchAvailableMovingPartners(
  filters: MovingPartnerFilters
): Promise<ApiResponse<MovingPartner[]>> {
  try {
    const { date, excludeAppointmentId } = filters;
    
    if (!date) {
      return {
        success: true,
        data: [],
      };
    }

    const dateISO = date.toISOString();
    // Use local time instead of UTC to match user's selected time slot
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeHHMM = `${hours}:${minutes}`;
    
    let apiUrl = `/api/moving-partners/search?date=${encodeURIComponent(dateISO)}&time=${encodeURIComponent(timeHHMM)}`;
    
    if (excludeAppointmentId) {
      apiUrl += `&excludeAppointmentId=${excludeAppointmentId}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch moving partners: ${response.statusText}`);
    }
    
    const data: MovingPartner[] = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching available moving partners:', error);
    
    return {
      success: false,
      data: [],
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Check if a moving partner is available for the selected date/time
 * @param partnerId - Moving partner ID to check
 * @param availablePartners - List of currently available partners
 * @returns True if partner is available
 */
export function isMovingPartnerAvailable(
  partnerId: string,
  availablePartners: MovingPartner[]
): boolean {
  return availablePartners.some(partner => partner.id.toString() === partnerId);
}

/**
 * Find a moving partner by ID
 * @param partnerId - Moving partner ID
 * @param partners - List of partners to search
 * @returns Moving partner or null if not found
 */
export function findMovingPartnerById(
  partnerId: string,
  partners: MovingPartner[]
): MovingPartner | null {
  return partners.find(partner => partner.id.toString() === partnerId) || null;
}

/**
 * Format moving partner for labor selection
 * @param partner - Moving partner data
 * @returns Formatted labor selection object
 */
export function formatMovingPartnerForLabor(partner: MovingPartner) {
  return {
    id: partner.id.toString(),
    price: partner.hourlyRate.toString(),
    title: partner.name,
    onfleetTeamId: partner.onfleetTeamId,
  };
}
