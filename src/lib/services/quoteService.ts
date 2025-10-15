/**
 * @fileoverview Quote service for handling quote-related API operations
 * @source boombox-10.0/src/app/components/reusablecomponents/sendquoteemailpopup.tsx (API call logic)
 * 
 * SERVICE FUNCTIONALITY:
 * Handles quote email sending operations with proper error handling, validation,
 * and type safety. Centralizes quote-related API calls for reuse across components.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/send-quote-email → New: /api/orders/send-quote-email
 * 
 * ARCHITECTURE IMPROVEMENTS:
 * - Extracted API logic from component into dedicated service
 * - Added comprehensive error handling and response validation
 * - Implemented proper TypeScript interfaces for type safety
 * - Centralized quote data processing and validation
 * 
 * @refactor Separated business logic from UI components for better maintainability
 */

import { ApiResponse } from '@/types/api.types';

export interface QuoteData {
  address: string;
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
  storageUnitCount?: number;
  storageUnitText?: string;
  selectedPlanName: string;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  selectedInsurance?: {
    label: string;
    price: string;
  } | null;
  accessStorageUnitCount?: number;
  totalPrice: number;
  isAccessStorage: boolean;
  zipCode: string;
}

export interface SendQuoteEmailRequest {
  email: string;
  quoteData: QuoteData;
}

export interface SendQuoteEmailResponse {
  success: boolean;
  message?: string;
}

/**
 * Service class for quote-related operations
 */
export class QuoteService {
  private static readonly API_BASE = '/api/orders';

  /**
   * Send quote email to customer
   * 
   * @param email - Customer email address
   * @param quoteData - Quote information to send
   * @returns Promise with success status and optional message
   * 
   * @example
   * ```typescript
   * const result = await QuoteService.sendQuoteEmail('customer@example.com', quoteData);
   * if (result.success) {
   *   console.log('Quote email sent successfully');
   * } else {
   *   console.error('Failed to send quote:', result.error);
   * }
   * ```
   */
  static async sendQuoteEmail(
    email: string, 
    quoteData: QuoteData
  ): Promise<ApiResponse<SendQuoteEmailResponse>> {
    try {
      // Validate inputs
      if (!email || !email.trim()) {
              return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email address is required',
        },
      };
      }

      if (!quoteData) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Quote data is required',
          },
        };
      }

      // Prepare request payload
      const payload = {
        email: email.trim().toLowerCase(),
        address: quoteData.address,
        scheduledDate: quoteData.scheduledDate?.toISOString() || '',
        scheduledTimeSlot: quoteData.scheduledTimeSlot || '',
        storageUnitCount: quoteData.storageUnitCount,
        storageUnitText: quoteData.storageUnitText,
        selectedPlanName: quoteData.selectedPlanName,
        loadingHelpPrice: quoteData.loadingHelpPrice,
        loadingHelpDescription: quoteData.loadingHelpDescription,
        selectedInsurance: quoteData.selectedInsurance,
        accessStorageUnitCount: quoteData.accessStorageUnitCount,
        totalPrice: quoteData.totalPrice,
        isAccessStorage: quoteData.isAccessStorage,
        zipCode: quoteData.zipCode,
      };

      // Make API call
      const response = await fetch(`${this.API_BASE}/send-quote-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle response
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            success: true,
            message: 'Quote email sent successfully',
          },
        };
      } else {
        // Handle error response
        let errorMessage = 'Failed to send quote email';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: errorMessage,
          },
        };
      }
    } catch (error) {
      console.error('QuoteService.sendQuoteEmail error:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection and try again.',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      };
    }
  }

  /**
   * Validate quote data completeness
   * 
   * @param quoteData - Quote data to validate
   * @returns Validation result with error message if invalid
   */
  static validateQuoteData(quoteData: QuoteData | undefined): {
    isValid: boolean;
    error?: string;
  } {
    if (!quoteData) {
      return {
        isValid: false,
        error: 'Quote data is not available. Please ensure quote details are loaded.',
      };
    }

    // Check required fields
    const requiredFields = [
      'address',
      'selectedPlanName',
      'loadingHelpPrice',
      'loadingHelpDescription',
      'zipCode',
    ] as const;

    for (const field of requiredFields) {
      if (!quoteData[field]) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`,
        };
      }
    }

    // Validate total price
    if (typeof quoteData.totalPrice !== 'number' || quoteData.totalPrice < 0) {
      return {
        isValid: false,
        error: 'Invalid total price',
      };
    }

    return { isValid: true };
  }
}
