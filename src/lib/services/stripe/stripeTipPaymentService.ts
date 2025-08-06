/**
 * @fileoverview Stripe tip payment processing service for appointments and packing supply orders
 * @source boombox-10.0/src/app/api/feedback/process-tip/utils.ts
 * @source boombox-10.0/src/app/api/packing-supplies/process-tip/utils.ts  
 * @refactor Consolidated tip payment logic into centralized service
 * 
 * SERVICE FUNCTIONALITY:
 * - Process tip payments for appointment feedback
 * - Process tip payments for packing supply delivery feedback
 * - Handle Stripe payment method validation and selection
 * - Manage payment intent creation and confirmation
 * - Comprehensive error handling for different payment scenarios
 * 
 * BUSINESS LOGIC:
 * - Validates customer payment methods before processing
 * - Uses first available payment method for off-session payments
 * - Handles authentication required and card declined scenarios
 * - Maintains consistent payment descriptions and metadata
 * 
 * USED BY:
 * - Feedback submission workflows (appointment tips)
 * - Packing supply feedback workflows (delivery tips)
 * - Customer satisfaction and service rating systems
 */

import { prisma } from '@/lib/database/prismaClient';
import Stripe from 'stripe';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

// Payment result interface
export interface TipPaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status?: string;
  error?: string;
  code?: string;
  details?: string;
}

// Appointment tip payment interface
export interface AppointmentTipData {
  appointmentId: number;
  tipAmount: number;
}

// Packing supply tip payment interface
export interface PackingSupplyTipData {
  orderId: number;
  tipAmount: number;
  stripeCustomerId: string;
}

export class StripeTipPaymentService {
  /**
   * Process tip payment for appointment feedback
   * @source boombox-10.0/src/app/api/feedback/process-tip/utils.ts (lines 10-121)
   */
  static async processAppointmentTip(data: AppointmentTipData): Promise<TipPaymentResult> {
    try {
      const { appointmentId, tipAmount } = data;

      if (!appointmentId || !tipAmount || tipAmount <= 0) {
        return {
          success: false,
          error: 'Invalid parameters'
        };
      }

      // Get the appointment to retrieve the Stripe customer ID
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: {
            select: {
              stripeCustomerId: true
            }
          }
        }
      });

      console.log('Stripe customer ID:', appointment?.user?.stripeCustomerId);

      if (!appointment || !appointment.user?.stripeCustomerId) {
        return {
          success: false,
          error: 'Appointment not found or no Stripe customer associated'
        };
      }

      const customerId = appointment.user.stripeCustomerId;
      
      return await this.processPaymentIntent({
        customerId,
        tipAmount,
        description: `${appointment?.appointmentType || 'Appointment'} Tip`
      });
    } catch (error: any) {
      console.error('Server error processing appointment tip payment:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Process tip payment for packing supply delivery feedback  
   * @source boombox-10.0/src/app/api/packing-supplies/process-tip/utils.ts (lines 10-109)
   */
  static async processPackingSupplyTip(data: PackingSupplyTipData): Promise<TipPaymentResult> {
    try {
      const { orderId, tipAmount, stripeCustomerId } = data;

      if (!orderId || !tipAmount || tipAmount <= 0) {
        return {
          success: false,
          error: 'Invalid parameters'
        };
      }

      if (!stripeCustomerId) {
        return {
          success: false,
          error: 'No Stripe customer associated with this order'
        };
      }

      console.log('Processing packing supply tip payment:', { orderId, tipAmount, stripeCustomerId });
      
      return await this.processPaymentIntent({
        customerId: stripeCustomerId,
        tipAmount,
        description: `Packing Supply Delivery Tip - Order #${orderId}`
      });
    } catch (error: any) {
      console.error('Server error processing packing supply tip payment:', error);
      return {
        success: false,
        error: 'Internal server error',
        details: error.message
      };
    }
  }

  /**
   * Common payment intent processing logic
   * Handles payment method validation, selection, and payment execution
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
      // Check if the customer has any payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      
      console.log(`Found ${paymentMethods.data.length} payment methods for customer ${customerId}`);
      
      if (paymentMethods.data.length === 0) {
        return {
          success: false,
          error: 'No payment methods found for this customer',
          code: 'no_payment_method'
        };
      }
      
      // Use the first payment method
      const paymentMethodId = paymentMethods.data[0].id;
      console.log(`Using payment method ${paymentMethodId} for customer ${customerId}`);

      // Create and confirm the payment intent with the explicit payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(tipAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId, // Explicitly specify the payment method
        description,
        confirm: true,
        off_session: true
      });

      console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      };
    } catch (stripeError: any) {
      console.error('Stripe payment error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.code === 'authentication_required') {
        // Payment requires authentication
        return {
          success: false,
          error: 'This payment requires authentication from the customer',
          code: stripeError.code,
          paymentIntentId: stripeError.payment_intent?.id
        };
      } else if (stripeError.code === 'card_declined') {
        // Card was declined
        return {
          success: false,
          error: 'The card was declined',
          code: stripeError.code
        };
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