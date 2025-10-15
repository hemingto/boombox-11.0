/**
 * @fileoverview Add Storage service for API integration
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (API submission logic)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/addAdditionalStorage → New: /api/orders/add-additional-storage
 * 
 * @refactor Extracted API calls to dedicated service layer with updated API endpoints following AccessStorageService patterns
 */

import { ApiResponse, ApiError } from '@/types/api.types';
import {
  AddStorageSubmissionPayload,
  AddStorageFormState,
} from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';
import { validateSubmissionPayload } from '@/lib/validations/addStorage.validations';

// ===== SERVICE INTERFACES =====

export interface AddStorageAppointment {
  id: number;
  appointmentDateTime: string;
  address: string;
  zipCode: string;
  storageUnitCount: number;
  planType: string;
  selectedInsurance: InsuranceOption | null;
  description: string;
  appointmentType: string;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  trackingUrl?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AddStorageSubmissionResult {
  appointmentId: number;
  trackingUrl?: string;
  estimatedArrival?: string;
  confirmationNumber?: string;
}

export interface AddStorageServiceOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// ===== API RESPONSE TYPES =====

export interface AddStorageApiResponse extends ApiResponse<AddStorageSubmissionResult> {
  data: AddStorageSubmissionResult;
}

export interface AddStorageApiError extends ApiResponse<null> {
  success: false;
  error: ApiError;
}

// ===== SERVICE IMPLEMENTATION =====

class AddStorageService {
  private readonly baseUrl: string;
  private readonly defaultOptions: Required<AddStorageServiceOptions>;

  constructor(options: AddStorageServiceOptions = {}) {
    this.baseUrl = '/api/orders';
    this.defaultOptions = {
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      ...options,
    };
  }

  /**
   * Submit add storage appointment request
   */
  async submitAddStorageRequest(
    payload: AddStorageSubmissionPayload,
    options?: AddStorageServiceOptions
  ): Promise<AddStorageSubmissionResult> {
    const config = { ...this.defaultOptions, ...options };

    // Validate payload before submission
    const validation = validateSubmissionPayload(payload);
    if (!validation.success) {
      const errorMessage = validation.error.errors.map(err => err.message).join(', ');
      throw new AddStorageServiceError(`Validation failed: ${errorMessage}`, 'VALIDATION_ERROR');
    }

    const validatedPayload = validation.data;

    try {
      const response = await this.makeRequest<AddStorageSubmissionResult>(
        '/add-additional-storage',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedPayload),
        },
        config
      );

      // Log successful submission
      if (response.appointmentId) {
        console.log('Add Storage appointment submitted successfully:', response.appointmentId);
      }

      return response;
    } catch (error) {
      if (error instanceof AddStorageServiceError) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Add Storage Service - Unexpected error:', error);
      throw new AddStorageServiceError(
        'Failed to schedule additional storage. Please try again.',
        'SUBMISSION_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Build submission payload from form state
   */
  buildSubmissionPayload(
    formState: AddStorageFormState,
    userId: string,
    appointmentDateTime: Date
  ): AddStorageSubmissionPayload {
    return {
      userId,
      address: formState.addressInfo.address,
      zipCode: formState.addressInfo.zipCode,
      storageUnitCount: formState.storageUnit.count,
      selectedInsurance: formState.selectedInsurance,
      appointmentDateTime: appointmentDateTime.toISOString(),
      planType: formState.planType,
      description: formState.description?.trim() || 'No added info',
      parsedLoadingHelpPrice: formState.pricing.parsedLoadingHelpPrice,
      monthlyStorageRate: formState.pricing.monthlyStorageRate,
      monthlyInsuranceRate: formState.pricing.monthlyInsuranceRate,
      calculatedTotal: formState.pricing.calculatedTotal,
      appointmentType: formState.appointmentType,
      movingPartnerId: formState.movingPartnerId,
      thirdPartyMovingPartnerId: formState.thirdPartyMovingPartnerId,
    };
  }

  /**
   * Validate form state before submission
   */
  validateFormState(formState: AddStorageFormState): string | null {
    if (!formState.addressInfo.address) {
      return 'Address is required.';
    }

    if (!formState.addressInfo.zipCode) {
      return 'Zip code is required.';
    }

    if (!formState.selectedPlan) {
      return 'Please select a service plan.';
    }

    if (!formState.selectedInsurance) {
      return 'Please select an insurance option.';
    }

    if (!formState.scheduling.scheduledDate || !formState.scheduling.scheduledTimeSlot) {
      return 'Please select a date and time slot.';
    }

    // Check labor selection for non-DIY plans
    if (formState.planType !== 'Do It Yourself Plan' && !formState.selectedLabor) {
      return 'Please choose a moving help option.';
    }

    return null;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    requestInit: RequestInit,
    options: Required<AddStorageServiceOptions>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(url, {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new AddStorageServiceError(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            'HTTP_ERROR',
            `Status: ${response.status}`
          );
        }

        const data = await response.json();
        
        // Handle API response format
        if (data.success === false) {
          throw new AddStorageServiceError(
            data.error || 'API request failed',
            'API_ERROR',
            data.details
          );
        }

        return data.data || data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on validation or client errors
        if (error instanceof AddStorageServiceError && 
            ['VALIDATION_ERROR', 'HTTP_ERROR'].includes(error.code)) {
          throw error;
        }

        // Don't retry on abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          throw new AddStorageServiceError(
            'Request timed out. Please try again.',
            'TIMEOUT_ERROR'
          );
        }

        // Wait before retry (except on last attempt)
        if (attempt < options.retries) {
          await new Promise(resolve => setTimeout(resolve, options.retryDelay * attempt));
        }
      }
    }

    // All retries failed
    throw new AddStorageServiceError(
      'Failed to connect to server. Please check your internet connection and try again.',
      'NETWORK_ERROR',
      lastError?.message
    );
  }
}

// ===== ERROR HANDLING =====

export class AddStorageServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'AddStorageServiceError';
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return ['NETWORK_ERROR', 'TIMEOUT_ERROR'].includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'VALIDATION_ERROR':
        return 'Please check your form data and try again.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to server. Please check your internet connection.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. Please try again.';
      case 'HTTP_ERROR':
      case 'API_ERROR':
        return this.message;
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

// ===== SERVICE INSTANCE =====

// Create singleton instance
export const addStorageService = new AddStorageService();

// Export service class for testing
export { AddStorageService };

// ===== UTILITY FUNCTIONS =====

/**
 * Check if error is an AddStorageServiceError
 */
export function isAddStorageServiceError(error: unknown): error is AddStorageServiceError {
  return error instanceof AddStorageServiceError;
}

/**
 * Handle service errors with user-friendly messages
 */
export function handleAddStorageServiceError(error: unknown): string {
  if (isAddStorageServiceError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

// ===== CONVENIENCE FUNCTION EXPORTS =====

/**
 * Submit add storage appointment (convenience function)
 */
export async function submitAddStorageAppointment(
  submissionData: AddStorageSubmissionPayload
): Promise<AddStorageSubmissionResult> {
  return addStorageService.submitAddStorageRequest(submissionData);
}

/**
 * Validate add storage submission (convenience function)
 */
export function validateAddStorageSubmission(
  submissionData: AddStorageSubmissionPayload
): void {
  const validation = validateSubmissionPayload(submissionData);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(err => err.message).join(', ');
    throw new AddStorageServiceError(`Validation failed: ${errorMessage}`, 'VALIDATION_ERROR');
  }
}

/**
 * Transform form data to submission payload (convenience function)
 */
export function transformAddStorageFormData(
  formState: AddStorageFormState,
  userId: string
): AddStorageSubmissionPayload {
  return {
    userId,
    address: formState.addressInfo.address,
    zipCode: formState.addressInfo.zipCode,
    storageUnitCount: formState.storageUnit.count,
    selectedInsurance: formState.selectedInsurance,
    appointmentDateTime: new Date(formState.scheduling.scheduledDate!).toISOString(),
    planType: formState.planType,
    description: formState.description || 'No added info',
    parsedLoadingHelpPrice: formState.pricing.parsedLoadingHelpPrice,
    monthlyStorageRate: formState.pricing.monthlyStorageRate,
    monthlyInsuranceRate: formState.pricing.monthlyInsuranceRate,
    calculatedTotal: formState.pricing.calculatedTotal,
    appointmentType: 'Additional Storage',
    movingPartnerId: formState.movingPartnerId || null,
    thirdPartyMovingPartnerId: formState.thirdPartyMovingPartnerId || null
  };
}
