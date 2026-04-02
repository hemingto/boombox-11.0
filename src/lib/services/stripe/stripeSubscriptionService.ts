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
import { prisma } from '@/lib/database/prismaClient';
import { StripeCustomerService } from './stripeCustomerService';
import { StripeInvoiceService } from './stripeInvoiceService';
import { BillingCalculator } from '../billing/BillingCalculator';
import { PROCESSING_FEE_RATE } from '@/data/processingFeeConfig';
import type { StorageTerm } from '@/data/storageTermPricing';
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
  storageTerm?: StorageTerm | null;
  pickupFeeWaived?: boolean;
  returnFeeWaived?: boolean;
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

export interface SubscriptionAdjustmentResult {
  success: boolean;
  remainingUnits: number;
  updatedSubscriptions: string[];
  cancelledSubscriptions: string[];
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
      const customerValidation =
        await StripeCustomerService.validateCustomer(customerId);
      if (!customerValidation.isValid) {
        return {
          success: false,
          error: `Invalid customer: ${customerValidation.error}`,
        };
      }

      // @REFACTOR-P9-TYPES: Add proper validation for nullable appointment fields
      if (
        !appointment.monthlyStorageRate ||
        !appointment.monthlyInsuranceRate ||
        !appointment.numberOfUnits
      ) {
        return {
          success: false,
          error: 'Missing required pricing information for subscription',
        };
      }

      // Calculate processing fee on the monthly total
      const monthlySubtotal =
        (appointment.monthlyStorageRate! + appointment.monthlyInsuranceRate!) *
        appointment.numberOfUnits!;
      const processingFeeAmount =
        Math.round(monthlySubtotal * PROCESSING_FEE_RATE * 100) / 100;

      // Create subscription with storage, insurance, and processing fee items
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        description: 'Monthly Storage Payment',
        items: [
          {
            price_data: {
              currency: 'usd',
              product: process.env.STRIPE_STORAGE_PRODUCT_ID!,
              recurring: { interval: 'month' },
              unit_amount: Math.round(appointment.monthlyStorageRate! * 100),
            },
            quantity: appointment.numberOfUnits!,
          },
          {
            price_data: {
              currency: 'usd',
              product: process.env.STRIPE_INSURANCE_PRODUCT_ID!,
              recurring: { interval: 'month' },
              unit_amount: Math.round(appointment.monthlyInsuranceRate! * 100),
            },
            quantity: appointment.numberOfUnits!,
          },
          {
            price_data: {
              currency: 'usd',
              product:
                process.env.STRIPE_PROCESSING_FEE_PRODUCT_ID ||
                process.env.STRIPE_STORAGE_PRODUCT_ID!,
              recurring: { interval: 'month' },
              unit_amount: Math.round(processingFeeAmount * 100),
            },
            quantity: 1,
          },
        ],
        trial_period_days: 30,
        proration_behavior: 'none',
        metadata: {
          appointmentId: appointment.id.toString(),
          appointmentType: appointment.appointmentType,
          storageTerm: appointment.storageTerm || 'month-to-month',
          pickupFeeWaived: String(appointment.pickupFeeWaived ?? false),
          returnFeeWaived: String(appointment.returnFeeWaived ?? false),
        },
      });

      console.log('Created storage subscription:', subscription.id);
      return {
        success: true,
        subscription,
      };
    } catch (error) {
      console.error('Error creating storage subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cancel all subscriptions for a customer (used during End Storage Term)
   */
  static async cancelAllUserSubscriptions(
    customerId: string
  ): Promise<CancellationResult> {
    try {
      // Validate customer ID
      if (!customerId) {
        return {
          success: false,
          cancelledSubscriptions: [],
          error: 'No customer ID provided',
        };
      }

      // Get all subscriptions for the customer
      const subscriptions =
        await StripeCustomerService.getCustomerSubscriptions(customerId);
      const cancelledSubscriptions: string[] = [];

      // Cancel all subscriptions
      for (const subscription of subscriptions) {
        if (subscription.status !== 'canceled') {
          console.log(
            `Canceling subscription ${subscription.id} with status: ${subscription.status}`
          );
          await stripe.subscriptions.cancel(subscription.id);
          cancelledSubscriptions.push(subscription.id);
          console.log(
            `Successfully cancelled subscription: ${subscription.id}`
          );
        }
      }

      return {
        success: true,
        cancelledSubscriptions,
      };
    } catch (error) {
      console.error('Error cancelling user subscriptions:', error);
      return {
        success: false,
        cancelledSubscriptions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle early termination logic for End Storage Term appointments.
   * Uses term-based logic from BillingCalculator instead of the old 60-day minimum.
   */
  static async handleEarlyTermination(
    appointment: AppointmentWithRelations,
    storageUsage: StorageUnitUsage
  ): Promise<EarlyTerminationResult> {
    try {
      const storageTerm =
        (appointment.storageTerm as StorageTerm | null) ?? null;

      // M2M or no term: no early termination
      if (!storageTerm || storageTerm === 'month-to-month') {
        return {
          success: true,
          hasEarlyTermination: false,
          remainingDays: 0,
          remainingMonths: 0,
          earlyTerminationFee: 0,
        };
      }

      const pickupFeeWaived = appointment.pickupFeeWaived ?? false;
      const returnFeeWaived = appointment.returnFeeWaived ?? false;

      const calculation = BillingCalculator.calculateEarlyTerminationFee(
        storageUsage.usageStartDate,
        storageTerm,
        pickupFeeWaived,
        returnFeeWaived
      );

      console.log(
        `Customer has been in storage for ${calculation.daysInStorage} days (minimum: ${calculation.minimumDays})`
      );

      if (!calculation.isEarlyTermination) {
        return {
          success: true,
          hasEarlyTermination: false,
          remainingDays: 0,
          remainingMonths: 0,
          earlyTerminationFee: 0,
        };
      }

      console.log(
        `Early termination: billing back waived fees — $${calculation.totalFee}`
      );

      if (!appointment.user.stripeCustomerId) {
        return {
          success: false,
          hasEarlyTermination: true,
          remainingDays: calculation.remainingDays,
          remainingMonths: calculation.remainingMonths,
          earlyTerminationFee: calculation.totalFee,
          error: 'No Stripe customer ID found for early termination billing',
        };
      }

      // Build itemised line items for waived fees
      const items: Array<{
        customer: string;
        amount: number;
        currency: string;
        description: string;
      }> = [];

      if (calculation.pickupFeeBilledBack > 0) {
        items.push({
          customer: appointment.user.stripeCustomerId,
          amount: Math.round(calculation.pickupFeeBilledBack * 100),
          currency: 'usd',
          description: 'Pickup Fee - Early Termination',
        });
      }

      if (calculation.returnFeeBilledBack > 0) {
        items.push({
          customer: appointment.user.stripeCustomerId,
          amount: Math.round(calculation.returnFeeBilledBack * 100),
          currency: 'usd',
          description: 'Return Delivery Fee - Early Termination',
        });
      }

      const earlyTerminationInvoice =
        await StripeInvoiceService.createEarlyTerminationInvoiceFromItems(
          appointment.user.stripeCustomerId,
          appointment.id,
          items
        );

      console.log(
        `Early termination fee invoice created and paid: ${earlyTerminationInvoice.id}`
      );

      return {
        success: true,
        hasEarlyTermination: true,
        remainingDays: calculation.remainingDays,
        remainingMonths: calculation.remainingMonths,
        earlyTerminationFee: calculation.totalFee,
        earlyTerminationInvoice,
      };
    } catch (error) {
      console.error('Error processing early termination:', error);
      return {
        success: false,
        hasEarlyTermination: false,
        remainingDays: 0,
        remainingMonths: 0,
        earlyTerminationFee: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get active storage subscriptions for a customer
   */
  static async getActiveStorageSubscriptions(
    customerId: string
  ): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions =
        await StripeCustomerService.getCustomerSubscriptions(customerId);

      return subscriptions.filter(
        subscription =>
          subscription.status === 'active' || subscription.status === 'trialing'
      );
    } catch (error) {
      console.error('Error fetching active storage subscriptions:', error);
      return [];
    }
  }

  /**
   * Update subscription quantities (e.g., when adding/removing storage units).
   * Recalculates the processing fee line item to stay in sync with the new totals.
   */
  static async updateSubscriptionQuantity(
    subscriptionId: string,
    newQuantity: number
  ): Promise<SubscriptionResult> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const items = subscription.items.data;

      if (items.length < 3) {
        return {
          success: false,
          error: `Subscription ${subscriptionId} has ${items.length} items, expected 3 (storage, insurance, processing fee)`,
        };
      }

      const storageItem = items[0];
      const insuranceItem = items[1];
      const processingFeeItem = items[2];

      const storageUnitAmount = storageItem.price.unit_amount ?? 0;
      const insuranceUnitAmount = insuranceItem.price.unit_amount ?? 0;

      const newMonthlySubtotal =
        (storageUnitAmount + insuranceUnitAmount) * newQuantity;
      const newProcessingFeeAmount = Math.round(
        newMonthlySubtotal * PROCESSING_FEE_RATE
      );

      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
        {
          items: [
            {
              id: storageItem.id,
              quantity: newQuantity,
            },
            {
              id: insuranceItem.id,
              quantity: newQuantity,
            },
            {
              id: processingFeeItem.id,
              price_data: {
                currency: 'usd',
                product:
                  process.env.STRIPE_PROCESSING_FEE_PRODUCT_ID ||
                  process.env.STRIPE_STORAGE_PRODUCT_ID!,
                recurring: { interval: 'month' },
                unit_amount: newProcessingFeeAmount,
              },
              quantity: 1,
            },
          ],
          proration_behavior: 'always_invoice',
        }
      );

      console.log(
        `Updated subscription ${subscriptionId}: quantity → ${newQuantity}, processing fee → ${newProcessingFeeAmount}`
      );

      return {
        success: true,
        subscription: updatedSubscription,
      };
    } catch (error) {
      console.error('Error updating subscription quantity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Adjust subscriptions after a partial storage termination (customer returns
   * some units but keeps others). Counts remaining active usages, groups them
   * by the appointment that created each subscription, then either reduces
   * quantity or cancels subscriptions that no longer have active units.
   */
  static async adjustSubscriptionsForPartialTermination(
    userId: number,
    stripeCustomerId: string
  ): Promise<SubscriptionAdjustmentResult> {
    try {
      const remainingUsages = await prisma.storageUnitUsage.findMany({
        where: { userId, usageEndDate: null },
        select: { startAppointmentId: true },
      });

      const remainingUnits = remainingUsages.length;

      if (remainingUnits === 0) {
        console.log(
          `[adjustSubscriptions] No remaining units for user ${userId}, cancelling all subscriptions`
        );
        const result = await this.cancelAllUserSubscriptions(stripeCustomerId);
        return {
          success: result.success,
          remainingUnits: 0,
          updatedSubscriptions: [],
          cancelledSubscriptions: result.cancelledSubscriptions,
          error: result.error,
        };
      }

      // Group remaining usages by the appointment that started them
      const unitsByAppointment = new Map<number, number>();
      for (const usage of remainingUsages) {
        if (usage.startAppointmentId) {
          const current = unitsByAppointment.get(usage.startAppointmentId) ?? 0;
          unitsByAppointment.set(usage.startAppointmentId, current + 1);
        }
      }

      // Look up stripeSubscriptionId for each relevant appointment
      const appointmentIds = Array.from(unitsByAppointment.keys());
      const appointments = await prisma.appointment.findMany({
        where: { id: { in: appointmentIds } },
        select: { id: true, stripeSubscriptionId: true },
      });

      const subIdByAppointment = new Map<number, string | null>();
      for (const appt of appointments) {
        subIdByAppointment.set(appt.id, appt.stripeSubscriptionId);
      }

      // Build a map of subscriptionId → desired quantity
      const desiredQuantityBySub = new Map<string, number>();
      const unmatchedAppointmentIds: number[] = [];

      for (const [apptId, count] of unitsByAppointment) {
        const subId = subIdByAppointment.get(apptId);
        if (subId) {
          const current = desiredQuantityBySub.get(subId) ?? 0;
          desiredQuantityBySub.set(subId, current + count);
        } else {
          unmatchedAppointmentIds.push(apptId);
        }
      }

      // Fallback: match unmatched appointments via Stripe subscription metadata
      if (unmatchedAppointmentIds.length > 0) {
        console.log(
          `[adjustSubscriptions] ${unmatchedAppointmentIds.length} appointment(s) missing stripeSubscriptionId, falling back to metadata match`
        );
        const activeSubscriptions =
          await this.getActiveStorageSubscriptions(stripeCustomerId);

        for (const sub of activeSubscriptions) {
          const metaApptId = sub.metadata?.appointmentId
            ? parseInt(sub.metadata.appointmentId, 10)
            : null;
          if (metaApptId && unmatchedAppointmentIds.includes(metaApptId)) {
            const count = unitsByAppointment.get(metaApptId) ?? 0;
            const current = desiredQuantityBySub.get(sub.id) ?? 0;
            desiredQuantityBySub.set(sub.id, current + count);

            // Persist the match for future lookups
            await prisma.appointment.update({
              where: { id: metaApptId },
              data: { stripeSubscriptionId: sub.id },
            });
          }
        }
      }

      // Get all active subscriptions so we can cancel any that are no longer needed
      const allActiveSubscriptions =
        await this.getActiveStorageSubscriptions(stripeCustomerId);

      const updatedSubscriptions: string[] = [];
      const cancelledSubscriptions: string[] = [];

      for (const sub of allActiveSubscriptions) {
        const desiredQty = desiredQuantityBySub.get(sub.id);

        if (desiredQty === undefined || desiredQty === 0) {
          console.log(
            `[adjustSubscriptions] Cancelling subscription ${sub.id} — no remaining active units`
          );
          await stripe.subscriptions.cancel(sub.id);
          cancelledSubscriptions.push(sub.id);
        } else {
          const currentQty = sub.items.data[0]?.quantity ?? 0;
          if (currentQty !== desiredQty) {
            console.log(
              `[adjustSubscriptions] Updating subscription ${sub.id}: ${currentQty} → ${desiredQty}`
            );
            const result = await this.updateSubscriptionQuantity(
              sub.id,
              desiredQty
            );
            if (result.success) {
              updatedSubscriptions.push(sub.id);
            } else {
              console.error(
                `[adjustSubscriptions] Failed to update ${sub.id}: ${result.error}`
              );
            }
          }
        }
      }

      console.log(
        `[adjustSubscriptions] Complete — ${remainingUnits} units remaining, ${updatedSubscriptions.length} updated, ${cancelledSubscriptions.length} cancelled`
      );

      return {
        success: true,
        remainingUnits,
        updatedSubscriptions,
        cancelledSubscriptions,
      };
    } catch (error) {
      console.error(
        '[adjustSubscriptions] Error adjusting subscriptions:',
        error
      );
      return {
        success: false,
        remainingUnits: -1,
        updatedSubscriptions: [],
        cancelledSubscriptions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if customer has trial period remaining
   */
  static async hasTrialPeriodRemaining(customerId: string): Promise<boolean> {
    try {
      const subscriptions =
        await this.getActiveStorageSubscriptions(customerId);

      return subscriptions.some(
        subscription =>
          subscription.status === 'trialing' &&
          subscription.trial_end &&
          subscription.trial_end * 1000 > Date.now()
      );
    } catch (error) {
      console.error('Error checking trial period:', error);
      return false;
    }
  }
}
