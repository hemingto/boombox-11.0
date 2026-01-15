/**
 * @fileoverview Client-side appointment data service for fetching appointment details
 * @source boombox-10.0/src/app/components/edit-appointment/editaccessstorageappointment.tsx (fetchAppointmentDetails)
 * 
 * SERVICE FUNCTIONALITY:
 * - Fetch appointment details for editing (client-side only)
 * - Handle appointment data transformation for forms
 * - Provide type-safe API responses
 * 
 * API ROUTES SUPPORTED:
 * - GET /api/orders/appointments/[id]/details (appointment fetching)
 * 
 * @refactor Extracted client-side appointment data fetching from appointmentService.ts
 * to avoid server-side import issues in client components
 */

import { AppointmentDetailsResponse } from '@/types/accessStorage.types';
import { validateAppointmentDetailsResponse } from '@/lib/validations/accessStorage.validations';

// ===== CLIENT-SIDE SERVICE OPTIONS =====

export interface AppointmentDataServiceOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

// ===== SERVICE RESPONSE TYPES =====

export interface AppointmentDataServiceResponse {
  success: boolean;
  data?: AppointmentDetailsResponse;
  error?: string;
}

// ===== CLIENT-SIDE APPOINTMENT DATA FETCHING =====

/**
 * Fetches appointment details from the API (client-side only)
 * @param appointmentId - The ID of the appointment to fetch
 * @param options - Service options for timeout, retries, etc.
 * @returns Promise with appointment data or error
 */
export async function fetchAppointmentDetails(
  appointmentId: string | number,
  options: AppointmentDataServiceOptions = {}
): Promise<AppointmentDataServiceResponse> {
  const { timeout = 10000, retries = 2, signal } = options;

  // Validate appointment ID
  const numericAppointmentId = typeof appointmentId === 'string' 
    ? parseInt(appointmentId, 10) 
    : appointmentId;

  if (isNaN(numericAppointmentId) || numericAppointmentId <= 0) {
    return {
      success: false,
      error: 'Invalid appointment ID provided'
    };
  }

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout controller
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

      // Combine timeout signal with optional external signal
      // Note: AbortSignal.any() is not widely supported, so we'll use a simpler approach
      const combinedSignal = signal || timeoutController.signal;

      // Make API request
      const response = await fetch(`/api/orders/appointments/${numericAppointmentId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: combinedSignal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Unauthorized access to appointment'
          };
        } else if (response.status === 404) {
          return {
            success: false,
            error: 'Appointment not found'
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: 'Access denied to this appointment'
          };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          return {
            success: false,
            error: `Failed to load appointment details: ${response.status} ${response.statusText}. ${errorText}`
          };
        }
      }

      // Parse response
      const responseData = await response.json();

      // Validate response data
      const validationResult = validateAppointmentDetailsResponse(responseData);
      if (!validationResult.isValid) {
        // Log detailed validation errors for debugging
        console.error('Invalid appointment data received:', {
          errors: validationResult.errors,
          receivedData: {
            hasId: typeof responseData?.id,
            hasUserId: typeof responseData?.userId,
            hasAddress: typeof responseData?.address,
            hasZipcode: typeof responseData?.zipcode,
            hasDate: typeof responseData?.date,
            hasTime: typeof responseData?.time,
            hasPlanType: typeof responseData?.planType,
            hasDeliveryReason: typeof responseData?.deliveryReason,
            hasNumberOfUnits: typeof responseData?.numberOfUnits,
            hasAppointmentType: typeof responseData?.appointmentType,
            hasLoadingHelpPrice: typeof responseData?.loadingHelpPrice,
            hasMonthlyStorageRate: typeof responseData?.monthlyStorageRate,
            hasMonthlyInsuranceRate: typeof responseData?.monthlyInsuranceRate,
            hasQuotedPrice: typeof responseData?.quotedPrice,
            hasStatus: typeof responseData?.status
          }
        });
        
        // Construct more specific error message from validation errors
        const errorDetails = Object.entries(validationResult.errors || {})
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        
        return {
          success: false,
          error: errorDetails 
            ? `Invalid appointment data: ${errorDetails}` 
            : 'Invalid appointment data received from server'
        };
      }

      // Return successful response
      return {
        success: true,
        data: validationResult.data as AppointmentDetailsResponse
      };

    } catch (error: any) {
      // Handle abort errors
      if (error.name === 'AbortError') {
        if (signal?.aborted) {
          return {
            success: false,
            error: 'Request was cancelled'
          };
        } else {
          return {
            success: false,
            error: 'Request timed out'
          };
        }
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          console.warn(`Network error on attempt ${attempt + 1}, retrying...`, error.message);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        } else {
          return {
            success: false,
            error: 'Network error: Unable to connect to server'
          };
        }
      }

      // Handle other errors
      if (attempt < retries) {
        console.warn(`Error on attempt ${attempt + 1}, retrying...`, error.message);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      } else {
        return {
          success: false,
          error: error.message || 'An unexpected error occurred while fetching appointment details'
        };
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    success: false,
    error: 'Maximum retry attempts exceeded'
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Transforms appointment data for form population
 * @param appointmentData - Raw appointment data from API
 * @returns Transformed data suitable for form state
 */
export function transformAppointmentDataForForm(appointmentData: AppointmentDetailsResponse) {
  // Helper function to safely parse date and create time slot
  const parseAppointmentDateTime = (dateString: string | Date | null): { date: Date | null; timeSlot: string | null } => {
    if (!dateString) return { date: null, timeSlot: null };
    
    const appointmentDate = new Date(dateString);
    if (isNaN(appointmentDate.getTime())) return { date: null, timeSlot: null };
    
    const hour = appointmentDate.getHours();
    const nextHour = (hour + 1) % 24;
    
    const format12Hour = (h: number) => {
      const twelveHour = h % 12 || 12;
      const period = h >= 12 ? 'pm' : 'am';
      return `${twelveHour}${period}`;
    };
    
    const timeSlot = `${format12Hour(hour)}-${format12Hour(nextHour)}`;
    
    return { date: appointmentDate, timeSlot };
  };

  // Parse date and time
  const { date: scheduledDate, timeSlot: scheduledTimeSlot } = parseAppointmentDateTime(appointmentData.date);
  
  // Extract city name from address
  const cityName = appointmentData.address ? appointmentData.address.split(',')[1]?.trim() || '' : '';
  
  // Map storage unit IDs to strings
  const storageUnitIds = appointmentData.requestedStorageUnits?.map((unit) => unit.storageUnitId.toString()) || [];
  
  return {
    // Basic appointment info
    address: appointmentData.address || '',
    zipCode: appointmentData.zipcode || '',
    cityName,
    description: appointmentData.description || '',
    deliveryReason: appointmentData.deliveryReason || null,
    
    // Date and time
    scheduledDate,
    scheduledTimeSlot,
    
    // Storage units
    selectedStorageUnits: storageUnitIds,
    
    // Plan and pricing
    planType: appointmentData.planType || '',
    loadingHelpPrice: appointmentData.loadingHelpPrice || 0,
    monthlyStorageRate: appointmentData.monthlyStorageRate || 0,
    monthlyInsuranceRate: appointmentData.monthlyInsuranceRate || 0,
    quotedPrice: appointmentData.quotedPrice || 0,
    
    // Partner information
    movingPartner: appointmentData.movingPartner,
    thirdPartyMovingPartner: appointmentData.thirdPartyMovingPartner,
    
    // User information
    user: appointmentData.user,
    additionalInfo: appointmentData.additionalInfo,
    
    // Appointment metadata
    appointmentType: appointmentData.appointmentType || 'Storage Unit Access',
    status: appointmentData.status || 'Scheduled'
  };
}

/**
 * Validates appointment ownership for the current user
 * @param appointmentData - Appointment data to validate
 * @param currentUserId - Current user's ID
 * @returns True if user owns the appointment
 */
export function validateAppointmentOwnership(
  appointmentData: AppointmentDetailsResponse,
  currentUserId: string | number
): boolean {
  const numericCurrentUserId = typeof currentUserId === 'string' 
    ? parseInt(currentUserId, 10) 
    : currentUserId;
  
  return appointmentData.userId === numericCurrentUserId;
}
