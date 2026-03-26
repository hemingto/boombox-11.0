/**
 * @fileoverview Stripe tip payment processing service for appointments and packing supply orders
 *
 * SERVICE FUNCTIONALITY:
 * - Charges customer card for tip amount
 * - Distributes tip to drivers/moving partners via Stripe Connect transfers
 * - Handles multi-driver and moving partner tip splitting
 *
 * TIP SPLITTING RULES:
 * - Boombox-only job, 1 driver: 100% to that driver
 * - Boombox-only job, N drivers: 1/N to each unique driver
 * - Moving partner job, no Boombox drivers: 100% to moving partner
 * - Moving partner job + Boombox drivers: 75% to moving partner, 25% split evenly among unique Boombox drivers
 */

import { prisma } from '@/lib/database/prismaClient';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-06-30.basil'
});

const MOVING_PARTNER_TIP_SHARE = 0.75;
const BOOMBOX_DRIVER_TIP_SHARE = 0.25;

export interface TipPaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status?: string;
  error?: string;
  code?: string;
  details?: string;
  transfers?: TipTransferResult[];
}

export interface TipTransferResult {
  recipientType: 'boombox_driver' | 'moving_partner';
  recipientId: number;
  recipientName: string;
  stripeConnectAccountId: string;
  stripeTransferId?: string;
  amount: number;
  status: 'completed' | 'failed' | 'skipped';
  failureReason?: string;
}

export interface AppointmentTipData {
  appointmentId: number;
  tipAmount: number;
  feedbackId: number;
}

export interface PackingSupplyTipData {
  orderId: number;
  tipAmount: number;
  stripeCustomerId: string;
}

interface TipRecipient {
  type: 'boombox_driver' | 'moving_partner';
  id: number;
  name: string;
  stripeConnectAccountId: string | null;
  payoutsEnabled: boolean;
  share: number;
}

export class StripeTipPaymentService {
  /**
   * Process tip payment for appointment feedback.
   * Charges customer then distributes to drivers via Stripe Connect.
   */
  static async processAppointmentTip(data: AppointmentTipData): Promise<TipPaymentResult> {
    try {
      const { appointmentId, tipAmount, feedbackId } = data;

      if (!appointmentId || !tipAmount || tipAmount <= 0) {
        return { success: false, error: 'Invalid parameters' };
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: { select: { stripeCustomerId: true } },
          movingPartner: {
            select: {
              id: true,
              name: true,
              stripeConnectAccountId: true,
              stripeConnectPayoutsEnabled: true,
            }
          }
        }
      });

      if (!appointment || !appointment.user?.stripeCustomerId) {
        return { success: false, error: 'Appointment not found or no Stripe customer associated' };
      }

      // Step 1: Charge customer
      const chargeResult = await this.processPaymentIntent({
        customerId: appointment.user.stripeCustomerId,
        tipAmount,
        description: `${appointment.appointmentType || 'Appointment'} Tip`
      });

      if (!chargeResult.success) {
        return chargeResult;
      }

      // Step 2: Determine recipients and compute shares
      const recipients = await this.computeTipRecipients(appointmentId, tipAmount, appointment.movingPartner);

      if (recipients.length === 0) {
        console.warn(`No tip recipients found for appointment ${appointmentId}`);
        return {
          ...chargeResult,
          transfers: [],
        };
      }

      // Step 3: Execute transfers and record them
      const transfers = await this.executeTipTransfers(recipients, feedbackId, appointmentId);

      return {
        ...chargeResult,
        transfers,
      };
    } catch (error: any) {
      console.error('Server error processing appointment tip payment:', error);
      return { success: false, error: 'Internal server error', details: error.message };
    }
  }

  /**
   * Process tip payment for packing supply delivery feedback.
   * Packing supply tips are not split -- they go to Boombox platform.
   */
  static async processPackingSupplyTip(data: PackingSupplyTipData): Promise<TipPaymentResult> {
    try {
      const { orderId, tipAmount, stripeCustomerId } = data;

      if (!orderId || !tipAmount || tipAmount <= 0) {
        return { success: false, error: 'Invalid parameters' };
      }

      if (!stripeCustomerId) {
        return { success: false, error: 'No Stripe customer associated with this order' };
      }

      return await this.processPaymentIntent({
        customerId: stripeCustomerId,
        tipAmount,
        description: `Packing Supply Delivery Tip - Order #${orderId}`
      });
    } catch (error: any) {
      console.error('Server error processing packing supply tip payment:', error);
      return { success: false, error: 'Internal server error', details: error.message };
    }
  }

  /**
   * Query OnfleetTasks for the appointment and compute each recipient's share
   * based on the 75/25 moving-partner/Boombox-driver split rule.
   */
  private static async computeTipRecipients(
    appointmentId: number,
    tipAmount: number,
    movingPartner: {
      id: number;
      name: string;
      stripeConnectAccountId: string | null;
      stripeConnectPayoutsEnabled: boolean;
    } | null,
  ): Promise<TipRecipient[]> {
    const tasks = await prisma.onfleetTask.findMany({
      where: { appointmentId },
      select: {
        driverId: true,
        workerType: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            stripeConnectAccountId: true,
            stripeConnectPayoutsEnabled: true,
          }
        }
      }
    });

    const movingPartnerDriverIds = new Set<number>();
    const boomboxDrivers = new Map<number, TipRecipient>();

    for (const task of tasks) {
      if (!task.driverId || !task.driver) continue;

      if (task.workerType === 'moving_partner') {
        movingPartnerDriverIds.add(task.driverId);
      } else {
        if (!boomboxDrivers.has(task.driverId)) {
          boomboxDrivers.set(task.driverId, {
            type: 'boombox_driver',
            id: task.driver.id,
            name: `${task.driver.firstName} ${task.driver.lastName}`,
            stripeConnectAccountId: task.driver.stripeConnectAccountId,
            payoutsEnabled: task.driver.stripeConnectPayoutsEnabled,
            share: 0,
          });
        }
      }
    }

    const hasMovingPartnerTasks = movingPartnerDriverIds.size > 0 && movingPartner !== null;
    const hasBoomboxDrivers = boomboxDrivers.size > 0;
    const recipients: TipRecipient[] = [];

    if (hasMovingPartnerTasks && hasBoomboxDrivers) {
      // Mixed job: 75% to moving partner, 25% split among Boombox drivers
      const mpShare = tipAmount * MOVING_PARTNER_TIP_SHARE;
      const boomboxPool = tipAmount * BOOMBOX_DRIVER_TIP_SHARE;
      const perDriverShare = boomboxPool / boomboxDrivers.size;

      recipients.push({
        type: 'moving_partner',
        id: movingPartner.id,
        name: movingPartner.name,
        stripeConnectAccountId: movingPartner.stripeConnectAccountId,
        payoutsEnabled: movingPartner.stripeConnectPayoutsEnabled,
        share: Math.round(mpShare * 100) / 100,
      });

      for (const driver of boomboxDrivers.values()) {
        driver.share = Math.round(perDriverShare * 100) / 100;
        recipients.push(driver);
      }
    } else if (hasMovingPartnerTasks && !hasBoomboxDrivers) {
      // Moving partner only (single-unit Full Service): 100% to moving partner
      recipients.push({
        type: 'moving_partner',
        id: movingPartner!.id,
        name: movingPartner!.name,
        stripeConnectAccountId: movingPartner!.stripeConnectAccountId,
        payoutsEnabled: movingPartner!.stripeConnectPayoutsEnabled,
        share: tipAmount,
      });
    } else if (hasBoomboxDrivers) {
      // Boombox-only job: split evenly among unique drivers
      const perDriverShare = tipAmount / boomboxDrivers.size;
      for (const driver of boomboxDrivers.values()) {
        driver.share = Math.round(perDriverShare * 100) / 100;
        recipients.push(driver);
      }
    }

    // Adjust for rounding so total transfers match the charged tip
    if (recipients.length > 0) {
      const totalAllocated = recipients.reduce((sum, r) => sum + r.share, 0);
      const roundingDiff = Math.round((tipAmount - totalAllocated) * 100) / 100;
      if (roundingDiff !== 0) {
        recipients[0].share = Math.round((recipients[0].share + roundingDiff) * 100) / 100;
      }
    }

    console.log(`Tip recipients for appointment ${appointmentId}:`,
      recipients.map(r => `${r.name} (${r.type}): $${r.share.toFixed(2)}`));

    return recipients;
  }

  /**
   * Execute Stripe Connect transfers for each recipient and create TipTransfer records.
   */
  private static async executeTipTransfers(
    recipients: TipRecipient[],
    feedbackId: number,
    appointmentId: number,
  ): Promise<TipTransferResult[]> {
    const results: TipTransferResult[] = [];

    for (const recipient of recipients) {
      const baseResult: TipTransferResult = {
        recipientType: recipient.type,
        recipientId: recipient.id,
        recipientName: recipient.name,
        stripeConnectAccountId: recipient.stripeConnectAccountId || '',
        amount: recipient.share,
        status: 'skipped',
      };

      if (!recipient.stripeConnectAccountId || !recipient.payoutsEnabled) {
        const reason = !recipient.stripeConnectAccountId
          ? 'No Stripe Connect account'
          : 'Stripe Connect payouts not enabled';

        console.warn(`Skipping tip transfer to ${recipient.name}: ${reason}`);
        baseResult.failureReason = reason;

        await prisma.tipTransfer.create({
          data: {
            feedbackId,
            recipientType: recipient.type,
            recipientDriverId: recipient.type === 'boombox_driver' ? recipient.id : null,
            recipientMovingPartnerId: recipient.type === 'moving_partner' ? recipient.id : null,
            stripeConnectAccountId: recipient.stripeConnectAccountId || 'none',
            amount: recipient.share,
            status: 'skipped',
            failureReason: reason,
          }
        });

        results.push(baseResult);
        continue;
      }

      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(recipient.share * 100),
          currency: 'usd',
          destination: recipient.stripeConnectAccountId,
          description: `Tip for Appointment ${appointmentId}`,
          metadata: {
            appointmentId: appointmentId.toString(),
            feedbackId: feedbackId.toString(),
            recipientType: recipient.type,
            recipientId: recipient.id.toString(),
          }
        }, {
          idempotencyKey: `tip-transfer-${feedbackId}-${recipient.type}-${recipient.id}`
        });

        console.log(`Tip transfer to ${recipient.name}: $${recipient.share.toFixed(2)} → ${transfer.id}`);

        await prisma.tipTransfer.create({
          data: {
            feedbackId,
            recipientType: recipient.type,
            recipientDriverId: recipient.type === 'boombox_driver' ? recipient.id : null,
            recipientMovingPartnerId: recipient.type === 'moving_partner' ? recipient.id : null,
            stripeConnectAccountId: recipient.stripeConnectAccountId,
            stripeTransferId: transfer.id,
            amount: recipient.share,
            status: 'completed',
            processedAt: new Date(),
          }
        });

        baseResult.stripeTransferId = transfer.id;
        baseResult.status = 'completed';
        results.push(baseResult);
      } catch (error: any) {
        console.error(`Tip transfer failed for ${recipient.name}:`, error);

        await prisma.tipTransfer.create({
          data: {
            feedbackId,
            recipientType: recipient.type,
            recipientDriverId: recipient.type === 'boombox_driver' ? recipient.id : null,
            recipientMovingPartnerId: recipient.type === 'moving_partner' ? recipient.id : null,
            stripeConnectAccountId: recipient.stripeConnectAccountId,
            amount: recipient.share,
            status: 'failed',
            failureReason: error.message,
          }
        });

        baseResult.status = 'failed';
        baseResult.failureReason = error.message;
        results.push(baseResult);
      }
    }

    return results;
  }

  /**
   * Common payment intent processing logic.
   * Charges the customer's saved card off-session.
   */
  private static async processPaymentIntent({
    customerId,
    tipAmount,
    description
  }: {
    customerId: string;
    tipAmount: number;
    description: string;
  }): Promise<TipPaymentResult> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      if (paymentMethods.data.length === 0) {
        return { success: false, error: 'No payment methods found for this customer', code: 'no_payment_method' };
      }

      const paymentMethodId = paymentMethods.data[0].id;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(tipAmount * 100),
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        description,
        confirm: true,
        off_session: true
      });

      console.log('Tip payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (stripeError: any) {
      console.error('Stripe payment error:', stripeError);

      if (stripeError.code === 'authentication_required') {
        return {
          success: false,
          error: 'This payment requires authentication from the customer',
          code: stripeError.code,
          paymentIntentId: stripeError.payment_intent?.id
        };
      } else if (stripeError.code === 'card_declined') {
        return { success: false, error: 'The card was declined', code: stripeError.code };
      }

      return {
        success: false,
        error: 'Payment processing failed',
        details: stripeError.message,
        code: stripeError.code
      };
    }
  }
}
