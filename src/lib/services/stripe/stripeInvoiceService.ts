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
  total: number;
  error?: string;
}

// Import invoice item type from billing services
import type { InvoiceItemData } from '../billing/AppointmentBillingService';

export class StripeInvoiceService {
  private static readonly ACCESS_STORAGE_UNIT_PRICING = 50; // Temporary - should come from pricing config

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
          total: 0
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
          const storageResult = await this.createStorageInvoice(appointment, loadingHelpTotal);
          invoice = storageResult.invoice;
          total = storageResult.total;
          break;

        case 'Access Storage':
          const accessResult = await this.createAccessStorageInvoice(appointment, loadingHelpTotal);
          invoice = accessResult.invoice;
          total = accessResult.total;
          break;

        case 'End Storage Term':
          const endResult = await this.createEndStorageTermInvoice(appointment, loadingHelpTotal);
          invoice = endResult.invoice;
          total = endResult.total;
          break;

        default:
          return {
            success: false,
            error: `Unsupported appointment type: ${appointment.appointmentType}`,
            total: 0
          };
      }

      // Finalize and pay the invoice
      await this.finalizeAndPayInvoice(invoice.id!);

      // Get the finalized invoice with URL
      const finalizedInvoice = await stripe.invoices.retrieve(invoice.id!);

      return {
        success: true,
        invoice: finalizedInvoice,
        invoiceUrl: finalizedInvoice.hosted_invoice_url!,
        total
      };

    } catch (error) {
      console.error('Error creating and paying appointment invoice:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        total: 0
      };
    }
  }

  /**
   * Create invoice for Initial Pickup or Additional Storage appointments
   */
  private static async createStorageInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    const storageTotal = (appointment.monthlyStorageRate! * appointment.numberOfUnits!);
    const insuranceTotal = (appointment.monthlyInsuranceRate! * appointment.numberOfUnits!);
    const total = storageTotal + insuranceTotal + loadingHelpTotal;

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: appointment.user.stripeCustomerId!,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `${appointment.appointmentType} appointment`,
      custom_fields: [
        { name: 'Appointment ID', value: appointment.id.toString() }
      ]
    });

    // Add invoice items
    const invoiceItems: InvoiceItemData[] = [
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(appointment.monthlyStorageRate! * 100),
        currency: 'usd',
        quantity: appointment.numberOfUnits!,
        description: 'Monthly Storage Rate'
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(appointment.monthlyInsuranceRate! * 100),
        currency: 'usd',
        quantity: appointment.numberOfUnits!,
        description: appointment.insuranceCoverage || 'Insurance'
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(loadingHelpTotal * 100),
        currency: 'usd',
        description: `Loading Help Service (${Math.round(loadingHelpTotal / (appointment.loadingHelpPrice! / 60))} minutes, 1 hr minimum)`
      }
    ];

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    return { invoice, total };
  }

  /**
   * Create invoice for Access Storage appointments
   */
  private static async createAccessStorageInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    const storageUnitCount = appointment.requestedStorageUnits.length;
    const accessStorageTotal = this.ACCESS_STORAGE_UNIT_PRICING * storageUnitCount;
    const total = loadingHelpTotal + accessStorageTotal;

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: appointment.user.stripeCustomerId!,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `${appointment.appointmentType} appointment`,
      custom_fields: [
        { name: 'Appointment ID', value: appointment.id.toString() }
      ]
    });

    // Add invoice items
    const invoiceItems: InvoiceItemData[] = [
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(accessStorageTotal * 100),
        currency: 'usd',
        quantity: 1,
        description: `Storage Unit Access (${storageUnitCount} units)`
      },
      {
        customer: appointment.user.stripeCustomerId!,
        amount: Math.round(loadingHelpTotal * 100),
        currency: 'usd',
        description: `Loading Help Service (${Math.round(loadingHelpTotal / (appointment.loadingHelpPrice! / 60))} minutes, 1 hr minimum)`
      }
    ];

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    return { invoice, total };
  }

  /**
   * Create invoice for End Storage Term appointments
   */
  private static async createEndStorageTermInvoice(
    appointment: AppointmentWithRelations,
    loadingHelpTotal: number
  ): Promise<{ invoice: Stripe.Invoice; total: number }> {
    // Same as access storage for the base invoice
    return await this.createAccessStorageInvoice(appointment, loadingHelpTotal);
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
    const earlyTerminationFee = 
      (appointment.monthlyStorageRate! * appointment.numberOfUnits! * remainingMonths) +
      (appointment.monthlyInsuranceRate! * appointment.numberOfUnits! * remainingMonths);

    // Create invoice for early termination
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'charge_automatically',
      description: `Early Termination - ${appointment.appointmentType}`,
      custom_fields: [
        { name: 'Appointment ID', value: appointmentId.toString() },
        { name: 'Early Termination', value: 'Yes' }
      ]
    });

    // Add invoice items
    const invoiceItems: InvoiceItemData[] = [
      {
        customer: customerId,
        amount: Math.round(appointment.monthlyStorageRate! * 100),
        currency: 'usd',
        quantity: appointment.numberOfUnits! * remainingMonths,
        description: `Early Termination Fee - Storage (${remainingMonths} months remaining)`
      },
      {
        customer: customerId,
        amount: Math.round(appointment.monthlyInsuranceRate! * 100),
        currency: 'usd',
        quantity: appointment.numberOfUnits! * remainingMonths,
        description: `Early Termination Fee - Insurance (${remainingMonths} months remaining)`
      }
    ];

    await this.createInvoiceItems(invoice.id!, invoiceItems);

    // Finalize and pay early termination invoice
    await this.finalizeAndPayInvoice(invoice.id!);

    return invoice;
  }

  /**
   * Add multiple invoice items to an invoice
   */
  private static async createInvoiceItems(invoiceId: string, items: InvoiceItemData[]): Promise<void> {
    await Promise.all(
      items.map(item =>
        stripe.invoiceItems.create({
          invoice: invoiceId,
          ...item
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
  private static calculateLoadingHelpTotal(serviceTimeMinutes: number, hourlyRate: number): number {
    const perMinuteRate = hourlyRate / 60;
    return perMinuteRate * Math.max(60, Math.round(serviceTimeMinutes));
  }
} 