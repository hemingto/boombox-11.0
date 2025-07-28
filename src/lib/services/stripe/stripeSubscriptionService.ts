/**
 * @fileoverview Stripe subscription management service
 * @source boombox-11.0/src/app/api/onfleet/webhook/route.ts (extracted from webhook)
 * 
 * SERVICE FUNCTIONALITY:
 * Centralized service for creating, managing, and cancelling Stripe subscriptions for storage services.
 * Handles monthly storage and insurance subscriptions with trial periods and early termination logic.
 * 
 * USED BY:
 * - Onfleet webhook processing for subscription creation/cancellation
 * - Payment API routes for subscription management
 * - Early termination processing for storage unit returns
 * 
 * @refactor Extracted complex subscription logic from webhook for better maintainability
 */

import { stripe } from '@/lib/integrations/stripeClient';
import { StripeCustomerService, type StoragePeriodInfo } from './stripeCustomerService';
import { StripeInvoiceService } from './stripeInvoiceService';
import type Stripe from 'stripe';

// Import types from existing system (matches Prisma schema nullability)
interface AppointmentWithRelations {
  id: number;
  appointmentType: string;
  monthlyStorageRate: number | null;
  monthlyInsuranceRate: number | null;
  loadingHelpPrice: number | null;
  numberOfUnits: number | null;
  insuranceCoverage: string | null;
  requestedStorageUnits: Array<{
    storageUnitId: number;
  }>;
  user: {
    stripeCustomerId: string | null;
  };
}

interface StorageUnitUsage {
  usageStartDate: Date;
  usageEndDate: Date | null;
  storageUnitId: number;
  endAppointmentId: number | null;
}

// Service result types
export interface SubscriptionResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  cancelledSubscriptions: string[];
  error?: string;
}

export interface EarlyTerminationResult {
  success: boolean;
  hasEarlyTermination: boolean;
  remainingDays: number;
  remainingMonths: number;
  earlyTerminationFee: number;
  earlyTerminationInvoice?: Stripe.Invoice;
  error?: string;
}

export class StripeSubscriptionService {
  /**
   * Create monthly storage subscription for Initial Pickup or Additional Storage
   */
  static async createStorageSubscription(
    customerId: string,
    appointment: AppointmentWithRelations
  ): Promise<SubscriptionResult> {
    try {
      // Validate customer first
      const customerValidation = await StripeCustomerService.validateCustomer(customerId);
      if (!customerValidation.isValid) {
        return {
          success: false,
          error: `Invalid customer: ${customerValidation.error}`
        };
      }

      // @REFACTOR-P9-TYPES: Add proper validation for nullable appointment fields
      if (!appointment.monthlyStorageRate || !appointment.monthlyInsuranceRate || !appointment.numberOfUnits) {
        return {
          success: false,
          error: 'Missing required pricing information for subscription'
        };
      }

      // Create subscription with storage and insurance items
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: 'usd',
              product: process.env.STRIPE_STORAGE_PRODUCT_ID!,
              recurring: { interval: 'month' },
              unit_amount: Math.round(appointment.monthlyStorageRate! * 100)
            },
            quantity: appointment.numberOfUnits!
          },
          {
            price_data: {
              currency: 'usd',
              product: process.env.STRIPE_INSURANCE_PRODUCT_ID!,
              recurring: { interval: 'month' },
              unit_amount: Math.round(appointment.monthlyInsuranceRate! * 100)
            },
            quantity: appointment.numberOfUnits!
          }
        ],
        trial_period_days: 30,
        proration_behavior: 'none',
        metadata: {
          appointmentId: appointment.id.toString(),
          appointmentType: appointment.appointmentType
        }
      });

      console.log('Created storage subscription:', subscription.id);
      return {
        success: true,
        subscription
      };

    } catch (error) {
      console.error('Error creating storage subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel all subscriptions for a customer (used during End Storage Term)
   */
  static async cancelAllUserSubscriptions(customerId: string): Promise<CancellationResult> {
    try {
      // Validate customer ID
      if (!customerId) {
        return {
          success: false,
          cancelledSubscriptions: [],
          error: 'No customer ID provided'
        };
      }

      // Get all subscriptions for the customer
      const subscriptions = await StripeCustomerService.getCustomerSubscriptions(customerId);
      const cancelledSubscriptions: string[] = [];

      // Cancel all subscriptions
      for (const subscription of subscriptions) {
        if (subscription.status !== 'canceled') {
          console.log(`Canceling subscription ${subscription.id} with status: ${subscription.status}`);
          await stripe.subscriptions.cancel(subscription.id);
          cancelledSubscriptions.push(subscription.id);
          console.log(`Successfully cancelled subscription: ${subscription.id}`);
        }
      }

      return {
        success: true,
        cancelledSubscriptions
      };

    } catch (error) {
      console.error('Error cancelling user subscriptions:', error);
      return {
        success: false,
        cancelledSubscriptions: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle early termination logic for End Storage Term appointments
   */
  static async handleEarlyTermination(
    appointment: AppointmentWithRelations,
    storageUsage: StorageUnitUsage
  ): Promise<EarlyTerminationResult> {
    try {
      // Calculate storage period
      const periodInfo = StripeCustomerService.calculateStoragePeriod(storageUsage.usageStartDate);

      console.log(`Customer has been in storage for ${periodInfo.daysInStorage} days (minimum: ${periodInfo.minimumDays})`);

      // If customer is within minimum period, no early termination fee
      if (!periodInfo.isEarlyTermination) {
        return {
          success: true,
          hasEarlyTermination: false,
          remainingDays: 0,
          remainingMonths: 0,
          earlyTerminationFee: 0
        };
      }

      // Calculate remaining time and fee
      const remainingDays = periodInfo.minimumDays - periodInfo.daysInStorage;
      const remainingMonths = Math.ceil(remainingDays / 30);
      const earlyTerminationFee = this.calculateEarlyTerminationFee(appointment, remainingMonths);

      console.log(`Charging early termination fee for ${remainingMonths} remaining months: $${earlyTerminationFee}`);

      // Create early termination invoice
      if (!appointment.user.stripeCustomerId) {
        return {
          success: false,
          hasEarlyTermination: true,
          remainingDays,
          remainingMonths,
          earlyTerminationFee,
          error: 'No Stripe customer ID found for early termination billing'
        };
      }

      const earlyTerminationInvoice = await StripeInvoiceService.createEarlyTerminationInvoice(
        appointment.user.stripeCustomerId,
        appointment.id,
        appointment,
        remainingMonths
      );

      console.log(`Early termination fee invoice created and paid: ${earlyTerminationInvoice.id}`);

      return {
        success: true,
        hasEarlyTermination: true,
        remainingDays,
        remainingMonths,
        earlyTerminationFee,
        earlyTerminationInvoice
      };

    } catch (error) {
      console.error('Error processing early termination:', error);
      return {
        success: false,
        hasEarlyTermination: false,
        remainingDays: 0,
        remainingMonths: 0,
        earlyTerminationFee: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active storage subscriptions for a customer
   */
  static async getActiveStorageSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await StripeCustomerService.getCustomerSubscriptions(customerId);
      
      return subscriptions.filter(subscription => 
        subscription.status === 'active' || subscription.status === 'trialing'
      );
    } catch (error) {
      console.error('Error fetching active storage subscriptions:', error);
      return [];
    }
  }

  /**
   * Update subscription quantities (e.g., when adding/removing storage units)
   */
  static async updateSubscriptionQuantity(
    subscriptionId: string,
    storageQuantity: number,
    insuranceQuantity: number
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update quantities for storage and insurance line items
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id, // Storage item
            quantity: storageQuantity
          },
          {
            id: subscription.items.data[1].id, // Insurance item
            quantity: insuranceQuantity
          }
        ],
        proration_behavior: 'always_invoice'
      });

      return {
        success: true,
        subscription: updatedSubscription
      };

    } catch (error) {
      console.error('Error updating subscription quantity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if customer has trial period remaining
   */
  static async hasTrialPeriodRemaining(customerId: string): Promise<boolean> {
    try {
      const subscriptions = await this.getActiveStorageSubscriptions(customerId);
      
      return subscriptions.some(subscription => 
        subscription.status === 'trialing' && 
        subscription.trial_end && 
        subscription.trial_end * 1000 > Date.now()
      );
    } catch (error) {
      console.error('Error checking trial period:', error);
      return false;
    }
  }

  /**
   * Calculate early termination fee based on remaining months
   */
  private static calculateEarlyTerminationFee(
    appointment: AppointmentWithRelations,
    remainingMonths: number
  ): number {
    const storageFeePortion = (appointment.monthlyStorageRate! * appointment.numberOfUnits! * remainingMonths);
    const insuranceFeePortion = (appointment.monthlyInsuranceRate! * appointment.numberOfUnits! * remainingMonths);
    
    return storageFeePortion + insuranceFeePortion;
  }
} 