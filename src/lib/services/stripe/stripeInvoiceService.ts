/**
 * @fileoverview Stripe invoice creation and payment service
 * @source boombox-11.0/src/app/api/onfleet/webhook/route.ts (extracted from webhook)
 *
 * SERVICE FUNCTIONALITY:
 * Centralized service for creating, finalizing, and paying invoices for storage appointments.
 * Handles different invoice types: Initial Pickup, Additional Storage, Access Storage, End Storage Term
 *
 * USED BY:
 * - Onfleet webhook processing for appointment completion billing
 * - Payment API routes for manual invoice operations
 * - Subscription management for service charges
 *
 * @refactor Extracted complex invoice logic from webhook for better maintainability
 */

import { stripe } from '@/lib/integrations/stripeClient';
import type Stripe from 'stripe';
import { accessStorageUnitPricing } from '@/data/accessStorageUnitPricing';
import {
  PROCESSING_FEE_RATE,
  PROCESSING_FEE_LABEL,
  calculateProcessingFee,
} from '@/data/processingFeeConfig';
import { BillingCalculator } from '../billing/BillingCalculator';
import { DIY_FREE_SERVICE_MINUTES } from '@/data/storageTermPricing';

// Import types from existing system (matches Prisma schema nullability)
interface AppointmentWithRelations {
  id: number;
  appointmentType: string;
  monthlyStorageRate: number | null;
  monthlyInsuranceRate: number | null;
  loadingHelpPrice: number | null;
  numberOfUnits: number | null;
  insuranceCoverage: string | null;
  pickupFee?: number | null;
  pickupFeeWaived?: boolean;
  returnFee?: number | null;
  returnFeeWaived?: boolean;
  planType?: string | null;
  requestedStorageUnits: Array<{
    storageUnitId: number;
  }>;
  user: {
    stripeCustomerId: string | null;
  };
}

// Service metrics from completion details
export interface ServiceMetrics {
  serviceTimeMinutes: number;
  completionTime: number;
}

// Invoice creation result
export interface InvoiceResult {
  success: boolean;
  invoice?: Stripe.Invoice;
  invoiceUrl?: string;
  chargeId?: string;
  total: number;
  error?: string;
}

// Import invoice item type from billing services
import type { InvoiceItemData } from '../billing/AppointmentBillingService';

export class StripeInvoiceService {
  /**
   * Main orchestration method for creating and paying appointment invoices
   */
  static async createAndPayAppointmentInvoice(
    appointment: AppointmentWithRelations,
    serviceMetrics: ServiceMetrics
  ): Promise<InvoiceResult> {
    try {
      // Validate required appointment data
      if (!appointment.user.stripeCustomerId) {
        return {
          success: false,
          error: 'No Stripe customer ID found for appointment',
          total: 0,
        };
      }

      // Calculate loading help total
      const loadingHelpTotal = this.calculateLoadingHelpTotal(
        serviceMetrics.serviceTimeMinutes,
        appointment.loadingHelpPrice || 0
      );

      let invoice: Stripe.Invoice;
      let total: number;

      // Create appropriate invoice based on appointment type
      switch (appointment.appointmentType) {
        case 'Initial Pickup':
        case 'Additional Storage':
          const storageResult = await this.createStorageInvoice(
            appointment,
            loadingHelpTotal,
            serviceMetrics.serviceTimeMinutes
          );
          invoice = storageResult.invoice;
          total = storageResult.total;
          break;

        case 'Storage Unit Access':
          const accessResult = await this.createAccessStorageInvoice(
            appointment,
            loadingHelpTotal,
            serviceMetrics.serviceTimeMinutes
          );
          invoice = accessResult.invoice;
          total = accessResult.total;
          break;

        case 'End Storage Term':
          const endResult = await this.createEndStorageTermInvoice(
            appointment,
            loadingHelpTotal,
            serviceMetrics.serviceTimeMinutes
          );
          invoice = endResult.invoice;
          total = endResult.total;
          break;

        default:
          return {
            success: false,
            error: `Unsupported appointment type: ${appointment.appointmentType}`,
            total: 0,
          };
      }

      // Finalize and pay the invoice
      await this.finalizeAndPayInvoice(invoice.id!);

      // Get the finalized invoice with URL and charge ID
      const finalizedInvoice = await stripe.invoices.retrieve(invoice.id!, {
        expand: ['charge'],
      });

      // Extract charge ID for linking driver payout transfers via source_transaction
      const chargeId =
        typeof finalizedInvoice.charge === 'string'
          ? finalizedInvoice.charge
          : (finalizedInvoice.charge?.id ?? undefined);

      if (chargeId) {
        console.log(`Invoice ${invoice.id} paid via charge: ${chargeId}`);
      }

      return {
        success: true,
        invoice: finalizedInvoice,
        invoiceUrl: finalizedInvoice.hosted_invoice_url!,
        chargeId,
        total,
      };
    } catch (error) {
      console.error('Error creating and paying appointment invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        total: 0,
      };
    }
  }

  /**
   * Create invoice for Initial Pickup or Additional Storage appointments
   */
  private static async createStorageInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number,
    serviceTimeMinutes: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    const storageTotal =
      appointment.monthlyStorageRate! * appointment.numberOfUnits!;
    const insuranceTotal =
      appointment.monthlyInsuranceRate! * appointment.numberOfUnits!;
    let subtotal = storageTotal + insuranceTotal + loadingHelpTotal;

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: appointment.user.stripeCustomerId!,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `${appointment.appointmentType} appointment`,
      custom_fields: [
        { name: 'Appointment ID', value: appointment.id.toString() },
      ],
    });

    const numberOfUnits = appointment.numberOfUnits || 1;
    const invoiceItems: InvoiceItemData[] = [
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(storageTotal * 100),
        currency: 'usd',
        description: `Monthly Storage Rate (${numberOfUnits} unit${numberOfUnits > 1 ? 's' : ''} @ $${appointment.monthlyStorageRate}/unit)`,
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(insuranceTotal * 100),
        currency: 'usd',
        description: `${appointment.insuranceCoverage || 'Insurance'} (${numberOfUnits} unit${numberOfUnits > 1 ? 's' : ''} @ $${appointment.monthlyInsuranceRate}/unit)`,
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(loadingHelpTotal * 100),
        currency: 'usd',
        description: `Loading Help Service (${Math.round(loadingHelpTotal / (appointment.loadingHelpPrice! / 60))} minutes, 1 hr minimum)`,
      },
    ];

    if (
      appointment.pickupFee &&
      appointment.pickupFee > 0 &&
      !appointment.pickupFeeWaived
    ) {
      const unitCount = appointment.numberOfUnits || 1;
      subtotal += appointment.pickupFee;
      invoiceItems.push({
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(appointment.pickupFee * 100),
        currency: 'usd',
        description: `Pickup Fee (${unitCount} unit${unitCount > 1 ? 's' : ''} @ $${Math.round(appointment.pickupFee! / unitCount)}/unit)`,
      });
    }

    if (appointment.planType === 'Do It Yourself Plan') {
      const overageCharge =
        BillingCalculator.calculateDiyOverageCharge(serviceTimeMinutes);
      if (overageCharge > 0) {
        subtotal += overageCharge;
        invoiceItems.push({
          customer: appointment.user.stripeCustomerId!,
          amount: Math.round(overageCharge * 100),
          currency: 'usd',
          description: `DIY Overage Charge (${Math.round(serviceTimeMinutes - DIY_FREE_SERVICE_MINUTES)} minutes over ${DIY_FREE_SERVICE_MINUTES}-minute free window)`,
        });
      }
    }

    const processingFee = calculateProcessingFee(subtotal);
    const total = subtotal + processingFee;

    invoiceItems.push({
      customer: appointment.user.stripeCustomerId!,
      amount: Math.round(processingFee * 100),
      currency: 'usd',
      description: PROCESSING_FEE_LABEL,
    });

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    return { invoice, total };
  }

  /**
   * Create invoice for Access Storage appointments
   */
  private static async createAccessStorageInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number,
    serviceTimeMinutes: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    const storageUnitCount = appointment.requestedStorageUnits.length;
    const accessStorageTotal = accessStorageUnitPricing * storageUnitCount;
    let subtotal = loadingHelpTotal + accessStorageTotal;

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: appointment.user.stripeCustomerId!,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `${appointment.appointmentType} appointment`,
      custom_fields: [
        { name: 'Appointment ID', value: appointment.id.toString() },
      ],
    });

    const invoiceItems: InvoiceItemData[] = [
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(accessStorageTotal * 100),
        currency: 'usd',
        description: `Storage Unit Access (${storageUnitCount} units)`,
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(loadingHelpTotal * 100),
        currency: 'usd',
        description: `Loading Help Service (${Math.round(loadingHelpTotal / (appointment.loadingHelpPrice! / 60))} minutes, 1 hr minimum)`,
      },
    ];

    if (appointment.planType === 'Do It Yourself Plan') {
      const overageCharge =
        BillingCalculator.calculateDiyOverageCharge(serviceTimeMinutes);
      if (overageCharge > 0) {
        subtotal += overageCharge;
        invoiceItems.push({
          customer: appointment.user.stripeCustomerId!,
          amount: Math.round(overageCharge * 100),
          currency: 'usd',
          description: `DIY Overage Charge (${Math.round(serviceTimeMinutes - DIY_FREE_SERVICE_MINUTES)} minutes over ${DIY_FREE_SERVICE_MINUTES}-minute free window)`,
        });
      }
    }

    const processingFee = calculateProcessingFee(subtotal);
    const total = subtotal + processingFee;

    invoiceItems.push({
      customer: appointment.user.stripeCustomerId!,
      amount: Math.round(processingFee * 100),
      currency: 'usd',
      description: PROCESSING_FEE_LABEL,
    });

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    return { invoice, total };
  }

  /**
   * Create invoice for End Storage Term appointments.
   * Includes return delivery fee when applicable and DIY overage charges.
   */
  private static async createEndStorageTermInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number,
    serviceTimeMinutes: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    const storageUnitCount = appointment.requestedStorageUnits.length;
    const accessStorageTotal = accessStorageUnitPricing * storageUnitCount;
    let subtotal = loadingHelpTotal + accessStorageTotal;

    const invoice = await stripe.invoices.create({
      customer: appointment.user.stripeCustomerId!,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `${appointment.appointmentType} appointment`,
      custom_fields: [
        { name: 'Appointment ID', value: appointment.id.toString() },
      ],
    });

    const invoiceItems: InvoiceItemData[] = [
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(accessStorageTotal * 100),
        currency: 'usd',
        description: `Storage Unit Access (${storageUnitCount} units)`,
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(loadingHelpTotal * 100),
        currency: 'usd',
        description: `Loading Help Service (${Math.round(loadingHelpTotal / (appointment.loadingHelpPrice! / 60))} minutes, 1 hr minimum)`,
      },
    ];

    if (
      appointment.returnFee &&
      appointment.returnFee > 0 &&
      !appointment.returnFeeWaived
    ) {
      subtotal += appointment.returnFee;
      invoiceItems.push({
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(appointment.returnFee * 100),
        currency: 'usd',
        description: 'Return Delivery Fee',
      });
    }

    if (appointment.planType === 'Do It Yourself Plan') {
      const overageCharge =
        BillingCalculator.calculateDiyOverageCharge(serviceTimeMinutes);
      if (overageCharge > 0) {
        subtotal += overageCharge;
        invoiceItems.push({
          customer: appointment.user.stripeCustomerId!,
          amount: Math.round(overageCharge * 100),
          currency: 'usd',
          description: `DIY Overage Charge (${Math.round(serviceTimeMinutes - DIY_FREE_SERVICE_MINUTES)} minutes over ${DIY_FREE_SERVICE_MINUTES}-minute free window)`,
        });
      }
    }

    const processingFee = calculateProcessingFee(subtotal);
    const total = subtotal + processingFee;

    invoiceItems.push({
      customer: appointment.user.stripeCustomerId!,
      amount: Math.round(processingFee * 100),
      currency: 'usd',
      description: PROCESSING_FEE_LABEL,
    });

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    return { invoice, total };
  }

  /**
   * Create early termination invoice for customers ending storage early
   */
  static async createEarlyTerminationInvoice(
    customerId: string,
    appointmentId: number,
    appointment: AppointmentWithRelations,
    remainingMonths: number
  ): Promise<Stripe.Invoice> {
    const numberOfUnits = appointment.numberOfUnits || 1;
    const storageTerminationFee =
      appointment.monthlyStorageRate! * numberOfUnits * remainingMonths;
    const insuranceTerminationFee =
      appointment.monthlyInsuranceRate! * numberOfUnits * remainingMonths;
    const subtotal = storageTerminationFee + insuranceTerminationFee;
    const processingFee = calculateProcessingFee(subtotal);

    // Create invoice for early termination
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `Early Termination - ${appointment.appointmentType}`,
      custom_fields: [
        { name: 'Appointment ID', value: appointmentId.toString() },
        { name: 'Early Termination', value: 'Yes' },
      ],
    });

    const invoiceItems: InvoiceItemData[] = [
      {
        customer: customerId,
        amount: Math.round(storageTerminationFee * 100),
        currency: 'usd',
        description: `Early Termination Fee - Storage (${numberOfUnits} unit${numberOfUnits > 1 ? 's' : ''} × ${remainingMonths} months @ $${appointment.monthlyStorageRate}/mo)`,
      },
      {
        customer: customerId,
        amount: Math.round(insuranceTerminationFee * 100),
        currency: 'usd',
        description: `Early Termination Fee - Insurance (${numberOfUnits} unit${numberOfUnits > 1 ? 's' : ''} × ${remainingMonths} months @ $${appointment.monthlyInsuranceRate}/mo)`,
      },
      {
        customer: customerId,
        amount: Math.round(processingFee * 100),
        currency: 'usd',
        description: PROCESSING_FEE_LABEL,
      },
    ];

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    // Finalize and pay early termination invoice
    await this.finalizeAndPayInvoice(invoice.id!);

    return invoice;
  }

  /**
   * Create an early termination invoice from pre-built line items (used by term-based logic)
   */
  static async createEarlyTerminationInvoiceFromItems(
    customerId: string,
    appointmentId: number,
    items: InvoiceItemData[]
  ): Promise<Stripe.Invoice> {
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: 'Early Termination - Waived Fees Billed Back',
      custom_fields: [
        { name: 'Appointment ID', value: appointmentId.toString() },
        { name: 'Early Termination', value: 'Yes' },
      ],
    });

    await this.createInvoiceItems(invoice.id!, items);
    await this.finalizeAndPayInvoice(invoice.id!);

    return invoice;
  }

  /**
   * Add multiple invoice items to an invoice
   */
  private static async createInvoiceItems(
    invoiceId: string,
    items: InvoiceItemData[]
  ): Promise<void> {
    await Promise.all(
      items.map(item =>
        stripe.invoiceItems.create({
          invoice: invoiceId,
          ...item,
        })
      )
    );
  }

  /**
   * Finalize and pay an invoice
   */
  private static async finalizeAndPayInvoice(invoiceId: string): Promise<void> {
    await stripe.invoices.finalizeInvoice(invoiceId);
    await stripe.invoices.pay(invoiceId);
  }

  /**
   * Calculate loading help total with minimum 1 hour charge
   */
  private static calculateLoadingHelpTotal(
    serviceTimeMinutes: number,
    hourlyRate: number
  ): number {
    const perMinuteRate = hourlyRate / 60;
    return perMinuteRate * Math.max(60, Math.round(serviceTimeMinutes));
  }
}
