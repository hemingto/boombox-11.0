/**
 * @fileoverview Access Storage service for API integration
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (API submission logic)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/accessStorageUnit → New: /api/orders/access-storage-unit
 * 
 * @refactor Extracted API calls to dedicated service layer with updated API endpoints
 */

import { ApiResponse } from '@/types/api.types';
import {
  AccessStorageSubmissionData,
  AccessStorageApiResponse,
  DeliveryReason,
  AppointmentType
} from '@/types/accessStorage.types';
import { validateAccessStorageSubmission } from '@/lib/validations/accessStorage.validations';

// ===== SERVICE INTERFACES =====

export interface AccessStorageAppointment {
  id: number;
  appointmentDateTime: string;
  address: string;
  zipCode: string;
  deliveryReason: DeliveryReason;
  planType: string;
  selectedStorageUnits: string[];
  description: string;
  appointmentType: AppointmentType;
  loadingHelpPrice: number;
  calculatedTotal: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  trackingUrl?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AccessStorageSubmissionResult {
  appointmentId: number;
  trackingUrl?: string;
  estimatedArrival?: string;
  confirmationNumber?: string;
}

export interface AccessStorageServiceOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// ===== DEFAULT OPTIONS =====

const DEFAULT_OPTIONS: Required<AccessStorageServiceOptions> = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// ===== UTILITY FUNCTIONS =====

/**
 * Delay function for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry wrapper for API calls
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Don't retry on client errors (4xx), only server errors (5xx) and network errors
      if (lastError.message.includes('400') || lastError.message.includes('404') || 
          lastError.message.includes('Bad request') || lastError.message.includes('Invalid appointment data')) {
        throw lastError;
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message);
      await delay(delayMs);
    }
  }

  throw lastError!;
}

// ===== MAIN SERVICE FUNCTIONS =====

/**
 * Submit access storage appointment request
 * @param submissionData - Complete form data for appointment creation
 * @param options - Service configuration options
 * @returns Promise with appointment creation result
 */
export async function submitAccessStorageAppointment(
  submissionData: AccessStorageSubmissionData,
  options: AccessStorageServiceOptions = {}
): Promise<ApiResponse<AccessStorageSubmissionResult>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate submission data before sending
    const validationResult = validateAccessStorageSubmission(submissionData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Form validation failed',
          details: validationResult.errors
        }
      };
    }

    // Prepare the API call
    const apiCall = async (): Promise<ApiResponse<AccessStorageSubmissionResult>> => {
      const response = await fetchWithTimeout(
        '/api/orders/access-storage-unit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validationResult.data),
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData: AccessStorageApiResponse = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Appointment creation failed');
      }

      return {
        success: true,
        data: responseData.data as AccessStorageSubmissionResult,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    // Execute with retry logic
    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error submitting access storage appointment:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT_ERROR',
            message: 'Request timed out. Please try again.',
          }
        };
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection and try again.',
          }
        };
      }
    }

    return {
      success: false,
      error: {
        code: 'SUBMISSION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to schedule access. Please try again.',
      }
    };
  }
}

/**
 * Get access storage appointment details by ID
 * @param appointmentId - Appointment ID to fetch
 * @param options - Service configuration options
 * @returns Promise with appointment details
 */
export async function getAccessStorageAppointment(
  appointmentId: number,
  options: AccessStorageServiceOptions = {}
): Promise<ApiResponse<AccessStorageAppointment>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    const apiCall = async (): Promise<ApiResponse<AccessStorageAppointment>> => {
      const response = await fetchWithTimeout(
        `/api/orders/access-storage-unit/${appointmentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to fetch appointment');
      }

      return {
        success: true,
        data: responseData.data as AccessStorageAppointment,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error fetching access storage appointment:', error);

    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch appointment details.',
      }
    };
  }
}

/**
 * Cancel access storage appointment
 * @param appointmentId - Appointment ID to cancel
 * @param reason - Cancellation reason
 * @param options - Service configuration options
 * @returns Promise with cancellation result
 */
export async function cancelAccessStorageAppointment(
  appointmentId: number,
  reason: string,
  options: AccessStorageServiceOptions = {}
): Promise<ApiResponse<{ cancelled: boolean; refundAmount?: number }>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate cancellation reason
    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cancellation reason is required',
        }
      };
    }

    const apiCall = async (): Promise<ApiResponse<{ cancelled: boolean; refundAmount?: number }>> => {
      const response = await fetchWithTimeout(
        `/api/orders/access-storage-unit/${appointmentId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to cancel appointment');
      }

      return {
        success: true,
        data: responseData.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error cancelling access storage appointment:', error);

    return {
      success: false,
      error: {
        code: 'CANCELLATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cancel appointment.',
      }
    };
  }
}

/**
 * Update access storage appointment
 * @param appointmentId - Appointment ID to update
 * @param updates - Partial appointment data to update
 * @param options - Service configuration options
 * @returns Promise with update result
 */
export async function updateAccessStorageAppointment(
  appointmentId: number,
  updates: Partial<AccessStorageSubmissionData>,
  options: AccessStorageServiceOptions = {}
): Promise<ApiResponse<AccessStorageAppointment>> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  try {
    const apiCall = async (): Promise<ApiResponse<AccessStorageAppointment>> => {
      const response = await fetchWithTimeout(
        `/api/orders/access-storage-unit/${appointmentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        },
        config.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to update appointment');
      }

      return {
        success: true,
        data: responseData.data as AccessStorageAppointment,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('x-request-id') || undefined,
        }
      };
    };

    return await withRetry(apiCall, config.retryAttempts, config.retryDelay);

  } catch (error) {
    console.error('Error updating access storage appointment:', error);

    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update appointment.',
      }
    };
  }
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Check if an appointment can be cancelled without fees
 * @param appointmentDateTime - Scheduled appointment date/time
 * @returns True if cancellation is free (48+ hours in advance)
 */
export function canCancelWithoutFee(appointmentDateTime: string | Date): boolean {
  const appointmentDate = new Date(appointmentDateTime);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilAppointment >= 48;
}

/**
 * Calculate cancellation fee based on timing
 * @param appointmentDateTime - Scheduled appointment date/time
 * @returns Cancellation fee amount
 */
export function calculateCancellationFee(appointmentDateTime: string | Date): number {
  const appointmentDate = new Date(appointmentDateTime);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilAppointment >= 48) {
    return 0; // Free cancellation
  } else if (hoursUntilAppointment >= 24) {
    return 100; // $100 fee for 24-48 hours
  } else {
    return 200; // $200 fee for same-day cancellation
  }
}

/**
 * Validate appointment timing (must be in the future)
 * @param appointmentDateTime - Appointment date/time to validate
 * @returns Validation result with error message if invalid
 */
export function validateAppointmentTiming(
  appointmentDateTime: string | Date
): { isValid: boolean; error?: string } {
  const appointmentDate = new Date(appointmentDateTime);
  const now = new Date();
  
  if (appointmentDate <= now) {
    return {
      isValid: false,
      error: 'Appointment cannot be scheduled in the past'
    };
  }
  
  // Check if appointment is too far in the future (e.g., 6 months)
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  
  if (appointmentDate > sixMonthsFromNow) {
    return {
      isValid: false,
      error: 'Appointment cannot be scheduled more than 6 months in advance'
    };
  }
  
  return { isValid: true };
}

/**
 * Check if appointment can be cancelled without fees
 * @param appointmentDateTime - Scheduled appointment date/time
 * @returns True if cancellation is free (more than 48 hours away)
 */
export function canCancelWithoutFees(appointmentDateTime: string | Date): boolean {
  try {
    const appointmentDate = new Date(appointmentDateTime);
    
    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }
    
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilAppointment > 48;
  } catch (error) {
    return false;
  }
}
