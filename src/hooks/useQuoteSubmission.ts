/**
 * @fileoverview Quote submission with Stripe payment setup
 * @source Extracted from boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * Custom hook for handling:
 * - Stripe customer creation with payment method
 * - Quote/appointment submission
 * - Error handling and loading states
 */

import { useState, useCallback } from 'react';
import { useStripe, useElements, CardNumberElement } from '@stripe/react-stripe-js';
import type { QuoteSubmissionData } from '@/types';

/**
 * Customer data for Stripe customer creation
 */
interface CustomerData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
}

/**
 * Custom hook for quote submission with Stripe integration
 * 
 * @returns Submission state and actions
 * 
 * @example
 * ```tsx
 * const { isSubmitting, error, stripeCustomerId, submitQuote, setError } = 
 *   useQuoteSubmission();
 * 
 * // Submit complete quote
 * const result = await submitQuote(quoteData);
 * if (result) {
 *   // Success - result contains userId
 *   router.push(`/customer-account-page/${result.userId}`);
 * }
 * ```
 */
export function useQuoteSubmission() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  
  /**
   * Create Stripe customer and payment method
   */
  const createStripeCustomer = useCallback(async (
    customerData: CustomerData
  ): Promise<string | null> => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized');
    }
    
    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      throw new Error('Card element not found');
    }
    
    // Create payment method from card
    const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phoneNumber,
        address: {
          line1: customerData.address,
          postal_code: customerData.zipCode,
          country: 'US',
        },
      },
    });
    
    if (paymentMethodError) {
      throw new Error(paymentMethodError.message);
    }
    
    // Create customer with payment method
    const response = await fetch('/api/payments/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...customerData,
        paymentMethodId: paymentMethod.id,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create Stripe customer');
    }
    
    const result = await response.json();
    const customerId = result.stripeCustomerId;
    
    setStripeCustomerId(customerId);
    return customerId;
  }, [stripe, elements]);
  
  /**
   * Submit complete quote with appointment creation
   * 
   * @param data - Complete quote submission data
   * @param existingCustomerId - Optional existing Stripe customer ID
   * @returns Result with userId or null on failure
   */
  const submitQuote = useCallback(async (
    data: QuoteSubmissionData,
    existingCustomerId?: string
  ): Promise<{ userId: number } | null> => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create Stripe customer if not exists
      let customerId = existingCustomerId || stripeCustomerId;
      
      if (!customerId) {
        customerId = await createStripeCustomer({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.address,
          zipCode: data.zipCode,
        });
        
        if (!customerId) {
          throw new Error('Failed to create Stripe customer');
        }
      }
      
      // Submit quote with customer ID
      const response = await fetch('/api/orders/submit-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          stripeCustomerId: customerId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle field-specific validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors
            .map((err: { field: string; message: string }) => err.message)
            .join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.error || 'Failed to submit quote');
      }
      
      const result = await response.json();
      return { userId: result.userId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quote';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [stripeCustomerId, createStripeCustomer]);
  
  return {
    isSubmitting,
    error,
    stripeCustomerId,
    submitQuote,
    setError,
  };
}

