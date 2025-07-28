/**
 * @fileoverview Appointment billing orchestration service
 * @source boombox-11.0/src/lib/services/stripeInvoiceService.ts (extracted business logic)
 * 
 * SERVICE FUNCTIONALITY:
 * Business logic orchestration for appointment billing. Coordinates calculation services,
 * generates invoice data, and processes different appointment types with proper business rules.
 * 
 * USED BY:
 * - Onfleet webhook processing for appointment completion billing
 * - Quote generation system for upfront pricing estimates
 * - Admin tools for billing calculations and previews
 * - Customer portal for invoice explanations
 * 
 * @refactor Extracted business orchestration logic from Stripe service for better separation
 * @refactor Added webhook processing consolidation from webhooks/AppointmentBillingService
 */

import { BillingCalculator, type LoadingHelpCalculation, type StorageChargesCalculation, type AccessStorageCalculation } from './BillingCalculator';
import type { ServiceMetrics } from '../stripe/stripeInvoiceService';
// Webhook processing imports
import {
  StripeInvoiceService,
  StripeSubscriptionService
} from '../stripe';
import {
  updateAppointmentStatus,
  updateStorageUnitUsageForTermination,
  findActiveStorageUsage
} from '../../utils/webhookQueries';

// Import types (matches existing interfaces)
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

// Billing service result interfaces
export interface InvoiceItemData {
  customer: string;
  amount: number; // In cents for Stripe
  currency: string;
  quantity?: number;
  description: string;
}

export interface BillingCalculationResult {
  success: boolean;
  invoiceItems: InvoiceItemData[];
  total: number; // In dollars
  loadingHelpCalculation?: LoadingHelpCalculation;
  storageChargesCalculation?: StorageChargesCalculation;
  accessStorageCalculation?: AccessStorageCalculation;
  error?: string;
}

export interface AppointmentStatusResult {
  newStatus: string;
  appointmentType: string;
}

export class AppointmentBillingService {
  /**
   * Process billing for storage appointments (Initial Pickup, Additional Storage)
   */
  static async processStorageAppointmentBilling(
    appointment: AppointmentWithRelations,
    serviceMetrics: ServiceMetrics
  ): Promise<BillingCalculationResult> {
    try {
      // Validate appointment data
      const validation = BillingCalculator.validatePricingInputs(appointment);
      if (!validation.isValid) {
        return {
          success: false,
          invoiceItems: [],
          total: 0,
          error: validation.error
        };
      }

      // Calculate charges
      const storageCharges = BillingCalculator.calculateStorageCharges(
        appointment.numberOfUnits!,
        appointment.monthlyStorageRate!,
        appointment.monthlyInsuranceRate!
      );

      const loadingHelp = BillingCalculator.calculateLoadingHelpTotal(
        serviceMetrics.serviceTimeMinutes,
        appointment.loadingHelpPrice!
      );

      const total = storageCharges.storageTotal + storageCharges.insuranceTotal + loadingHelp.total;

      // Generate invoice items
      const invoiceItems = this.generateStorageInvoiceItems(
        appointment.user.stripeCustomerId!,
        storageCharges,
        loadingHelp,
        appointment.insuranceCoverage || 'Insurance'
      );

      return {
        success: true,
        invoiceItems,
        total,
        loadingHelpCalculation: loadingHelp,
        storageChargesCalculation: storageCharges
      };

    } catch (error) {
      console.error('Error processing storage appointment billing:', error);
      return {
        success: false,
        invoiceItems: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process billing for access appointments (Access Storage, End Storage Term)
   */
  static async processAccessAppointmentBilling(
    appointment: AppointmentWithRelations,
    serviceMetrics: ServiceMetrics
  ): Promise<BillingCalculationResult> {
    try {
      // Validate required data
      if (!appointment.loadingHelpPrice || appointment.loadingHelpPrice <= 0) {
        return {
          success: false,
          invoiceItems: [],
          total: 0,
          error: 'Invalid loading help price for access appointment'
        };
      }

      if (!appointment.user.stripeCustomerId) {
        return {
          success: false,
          invoiceItems: [],
          total: 0,
          error: 'No Stripe customer ID found'
        };
      }

      // Calculate charges
      const unitCount = appointment.requestedStorageUnits.length;
      const accessCharges = BillingCalculator.calculateAccessStorageTotal(unitCount);
      
      const loadingHelp = BillingCalculator.calculateLoadingHelpTotal(
        serviceMetrics.serviceTimeMinutes,
        appointment.loadingHelpPrice
      );

      const total = accessCharges.total + loadingHelp.total;

      // Generate invoice items
      const invoiceItems = this.generateAccessInvoiceItems(
        appointment.user.stripeCustomerId,
        accessCharges,
        loadingHelp
      );

      return {
        success: true,
        invoiceItems,
        total,
        loadingHelpCalculation: loadingHelp,
        accessStorageCalculation: accessCharges
      };

    } catch (error) {
      console.error('Error processing access appointment billing:', error);
      return {
        success: false,
        invoiceItems: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine appointment status after successful billing
   */
  static calculateAppointmentStatus(appointmentType: string): AppointmentStatusResult {
    let newStatus: string;

    switch (appointmentType) {
      case 'Initial Pickup':
      case 'Additional Storage':
        newStatus = 'Loading Complete';
        break;
      case 'End Storage Term':
        newStatus = 'Storage Term Ended';
        break;
      case 'Access Storage':
        newStatus = 'Access Complete';
        break;
      default:
        newStatus = 'Complete';
    }

    return {
      newStatus,
      appointmentType
    };
  }

  /**
   * Generate invoice items for storage appointments
   */
  private static generateStorageInvoiceItems(
    customerId: string,
    storageCharges: StorageChargesCalculation,
    loadingHelp: LoadingHelpCalculation,
    insuranceCoverage: string
  ): InvoiceItemData[] {
    return [
      {
        customer: customerId,
        amount: BillingCalculator.toCents(storageCharges.monthlyStorageRate),
        currency: 'usd',
        quantity: storageCharges.numberOfUnits,
        description: 'Monthly Storage Rate'
      },
      {
        customer: customerId,
        amount: BillingCalculator.toCents(storageCharges.monthlyInsuranceRate),
        currency: 'usd',
        quantity: storageCharges.numberOfUnits,
        description: insuranceCoverage
      },
      {
        customer: customerId,
        amount: BillingCalculator.toCents(loadingHelp.total),
        currency: 'usd',
        description: `Loading Help Service (${loadingHelp.billedMinutes} minutes, 1 hr minimum)`
      }
    ];
  }

  /**
   * Generate invoice items for access appointments
   */
  private static generateAccessInvoiceItems(
    customerId: string,
    accessCharges: AccessStorageCalculation,
    loadingHelp: LoadingHelpCalculation
  ): InvoiceItemData[] {
    return [
      {
        customer: customerId,
        amount: BillingCalculator.toCents(accessCharges.total),
        currency: 'usd',
        quantity: 1,
        description: `Storage Unit Access (${accessCharges.unitCount} units)`
      },
      {
        customer: customerId,
        amount: BillingCalculator.toCents(loadingHelp.total),
        currency: 'usd',
        description: `Loading Help Service (${loadingHelp.billedMinutes} minutes, 1 hr minimum)`
      }
    ];
  }

  /**
   * Validate service metrics for billing calculations
   */
  static validateServiceMetrics(serviceMetrics: ServiceMetrics): { isValid: boolean; error?: string } {
    if (!serviceMetrics) {
      return { isValid: false, error: 'No service metrics provided' };
    }

    if (serviceMetrics.serviceTimeMinutes < 0) {
      return { isValid: false, error: 'Service time cannot be negative' };
    }

    if (!serviceMetrics.completionTime) {
      return { isValid: false, error: 'Completion time is required' };
    }

    return { isValid: true };
  }

  /**
   * Generate billing preview for quote system (no Stripe operations)
   */
  static generateBillingPreview(
    appointmentType: string,
    numberOfUnits: number,
    monthlyStorageRate: number,
    monthlyInsuranceRate: number,
    estimatedServiceTimeMinutes: number,
    loadingHelpPrice: number
  ): {
    success: boolean;
    total: number;
    breakdown: { item: string; amount: number }[];
    error?: string;
  } {
    try {
      const loadingHelp = BillingCalculator.calculateLoadingHelpTotal(estimatedServiceTimeMinutes, loadingHelpPrice);
      
      let breakdown: { item: string; amount: number }[] = [];
      let total = 0;

      if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
        const storageCharges = BillingCalculator.calculateStorageCharges(numberOfUnits, monthlyStorageRate, monthlyInsuranceRate);
        
        breakdown = [
          { item: 'Monthly Storage Rate', amount: storageCharges.storageTotal },
          { item: 'Monthly Insurance', amount: storageCharges.insuranceTotal },
          { item: 'Loading Help Service', amount: loadingHelp.total }
        ];
        
        total = storageCharges.storageTotal + storageCharges.insuranceTotal + loadingHelp.total;
      } else {
        const accessCharges = BillingCalculator.calculateAccessStorageTotal(numberOfUnits);
        
        breakdown = [
          { item: 'Storage Unit Access', amount: accessCharges.total },
          { item: 'Loading Help Service', amount: loadingHelp.total }
        ];
        
        total = accessCharges.total + loadingHelp.total;
      }

      return {
        success: true,
        total,
        breakdown
      };

    } catch (error) {
      return {
        success: false,
        total: 0,
        breakdown: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process Step 2 completion billing for webhook processing
   * Handles invoice creation, subscription management, and early termination
   * @source Consolidated from webhooks/AppointmentBillingService.ts
   */
  static async processWebhookCompletion(
    appointment: any,
    taskDetails: any,
    completionTime: number
  ): Promise<void> {
    console.log('Processing Stripe billing for appointment:', appointment.appointmentType);

    // Calculate service metrics from completion details
    const serviceMetrics = this.calculateWebhookServiceMetrics(appointment, taskDetails);
    
    console.log('Service time in minutes:', serviceMetrics.serviceTimeMinutes);

    // Determine new appointment status based on type
    const newStatus = this.determineAppointmentStatus(appointment.appointmentType);

    try {
      // Create and pay invoice using refactored service
      const invoiceResult = await StripeInvoiceService.createAndPayAppointmentInvoice(
        appointment,
        serviceMetrics
      );

      if (!invoiceResult.success) {
        console.error('Invoice creation failed:', invoiceResult.error);
        throw new Error(`Invoice creation failed: ${invoiceResult.error}`);
      }

      // Update appointment with invoice details and new status
      await updateAppointmentStatus(appointment.id, newStatus, {
        invoiceUrl: invoiceResult.invoiceUrl,
        invoiceTotal: invoiceResult.total
      });

      console.log(`Invoice created successfully: ${invoiceResult.invoice?.id}, Total: $${invoiceResult.total}`);

      // Handle subscription creation for storage appointments
      if (this.isStorageAppointment(appointment.appointmentType)) {
        await this.handleStorageSubscription(appointment);
      }
      
      // Handle End Storage Term logic
      if (appointment.appointmentType === 'End Storage Term') {
        await this.handleStorageTermination(appointment);
      }

    } catch (stripeError) {
      console.error('Stripe processing error:', stripeError);
      throw stripeError;
    }
  }

  /**
   * Calculate service metrics from appointment and task details for webhook processing
   */
  private static calculateWebhookServiceMetrics(appointment: any, taskDetails: any): ServiceMetrics {
    const serviceStartTime = parseInt(appointment.serviceStartTime || "0");
    const serviceTimeMinutes = taskDetails.completionDetails?.time && serviceStartTime
      ? (taskDetails.completionDetails.time - serviceStartTime) / (60 * 1000) // Convert to minutes
      : 0;
    
    return {
      serviceTimeMinutes: serviceTimeMinutes,
      completionTime: taskDetails.completionDetails?.time || 0
    };
  }

  /**
   * Determine new appointment status based on appointment type
   */
  private static determineAppointmentStatus(appointmentType: string): string {
    if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
      return 'Loading Complete';
    } else if (appointmentType === 'End Storage Term') {
      return 'Storage Term Ended';
    } else {
      return 'Access Complete';
    }
  }

  /**
   * Check if appointment is a storage appointment that needs subscription
   */
  private static isStorageAppointment(appointmentType: string): boolean {
    return appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage';
  }

  /**
   * Handle subscription creation for storage appointments
   */
  private static async handleStorageSubscription(appointment: any): Promise<void> {
    if (!appointment.user.stripeCustomerId) {
      console.error('No Stripe customer ID found for subscription creation');
      return;
    }

    const subscriptionResult = await StripeSubscriptionService.createStorageSubscription(
      appointment.user.stripeCustomerId,
      appointment
    );

    if (subscriptionResult.success) {
      console.log('Storage subscription created:', subscriptionResult.subscription?.id);
    } else {
      console.error('Subscription creation failed:', subscriptionResult.error);
      // Don't throw error - invoice was successful, subscription failure shouldn't break workflow
    }
  }

  /**
   * Handle End Storage Term processing including early termination and subscription cancellation
   */
  private static async handleStorageTermination(appointment: any): Promise<void> {
    try {
      // Find the storage start date from StorageUnitUsage
      const storageUsage = await findActiveStorageUsage(
        appointment.requestedStorageUnits[0]?.storageUnitId
      );
      
      // Handle early termination if applicable
      if (storageUsage) {
        await this.processEarlyTermination(appointment, storageUsage);
      }
      
      // Cancel all customer subscriptions
      if (appointment.user.stripeCustomerId) {
        await this.cancelUserSubscriptions(appointment.user.stripeCustomerId);
      } else {
        console.log('No stripe customer ID found, skipping subscription cancellation');
      }
      
      // Update storage unit usage records
      const storageUnitIds = appointment.requestedStorageUnits.map(
        (unit: any) => unit.storageUnitId
      );
      
      await updateStorageUnitUsageForTermination(storageUnitIds, appointment.id);
      
    } catch (error) {
      console.error('Error processing End Storage Term operations:', error);
      // Continue with other operations even if storage term processing fails
    }
  }

  /**
   * Process early termination fee if applicable
   */
  private static async processEarlyTermination(appointment: any, storageUsage: any): Promise<void> {
    const earlyTerminationResult = await StripeSubscriptionService.handleEarlyTermination(
      appointment,
      storageUsage
    );

    if (earlyTerminationResult.success && earlyTerminationResult.hasEarlyTermination) {
      console.log(`Early termination fee processed: $${earlyTerminationResult.earlyTerminationFee}`);
    } else if (!earlyTerminationResult.success) {
      console.error('Early termination processing failed:', earlyTerminationResult.error);
      // Don't break workflow
    }
  }

  /**
   * Cancel all user subscriptions
   */
  private static async cancelUserSubscriptions(stripeCustomerId: string): Promise<void> {
    const cancellationResult = await StripeSubscriptionService.cancelAllUserSubscriptions(
      stripeCustomerId
    );

    if (cancellationResult.success) {
      console.log(`Cancelled ${cancellationResult.cancelledSubscriptions.length} subscriptions`);
    } else {
      console.error('Subscription cancellation failed:', cancellationResult.error);
      // Don't break workflow
    }
  }
} 