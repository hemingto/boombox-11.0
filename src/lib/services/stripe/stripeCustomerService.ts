/**
 * @fileoverview Stripe customer management service
 * @source boombox-11.0/src/app/api/onfleet/webhook/route.ts (extracted from webhook)
 * 
 * SERVICE FUNCTIONALITY:
 * Centralized service for Stripe customer operations including validation,
 * subscription retrieval, and customer-related utilities
 * 
 * USED BY:
 * - Onfleet webhook processing for payment validation
 * - Payment API routes for customer verification
 * - Subscription management workflows
 * 
 * @refactor Extracted from inline webhook code for better maintainability
 */

import { stripe } from '@/lib/integrations/stripeClient';
import type Stripe from 'stripe';

// Types for customer operations
export interface CustomerValidationResult {
  isValid: boolean;
  customer?: Stripe.Customer;
  error?: string;
}

export interface StoragePeriodInfo {
  startDate: Date;
  daysInStorage: number;
  minimumDays: number;
  isEarlyTermination: boolean;
}

export class StripeCustomerService {
  private static readonly MINIMUM_STORAGE_DAYS = 60; // 2 months minimum

  /**
   * Validate that a customer exists and has a valid Stripe customer ID
   */
  static async validateCustomer(customerId: string): Promise<CustomerValidationResult> {
    try {
      if (!customerId) {
        return { isValid: false, error: 'No customer ID provided' };
      }

      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return { isValid: false, error: 'Customer has been deleted' };
      }

      return { 
        isValid: true, 
        customer: customer as Stripe.Customer 
      };
    } catch (error) {
      console.error('Error validating Stripe customer:', error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all active subscriptions for a customer
   */
  static async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all' // Include trial subscriptions
      });

      return subscriptions.data;
    } catch (error) {
      console.error('Error fetching customer subscriptions:', error);
      return [];
    }
  }

  /**
   * Calculate storage period information for early termination logic
   */
  static calculateStoragePeriod(storageStartDate: Date): StoragePeriodInfo {
    const currentDate = new Date();
    const daysInStorage = Math.floor(
      (currentDate.getTime() - storageStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      startDate: storageStartDate,
      daysInStorage,
      minimumDays: this.MINIMUM_STORAGE_DAYS,
      isEarlyTermination: daysInStorage < this.MINIMUM_STORAGE_DAYS
    };
  }

  /**
   * Get customer payment methods
   */
  static async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching customer payment methods:', error);
      return [];
    }
  }

  /**
   * Check if customer has a default payment method
   */
  static async hasDefaultPaymentMethod(customerId: string): Promise<boolean> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return false;
      }

      return !!(customer as Stripe.Customer).invoice_settings?.default_payment_method;
    } catch (error) {
      console.error('Error checking default payment method:', error);
      return false;
    }
  }
} 