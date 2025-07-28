/**
 * @fileoverview Early termination service for storage appointments
 * @source boombox-11.0/src/lib/services/stripeSubscriptionService.ts (extracted early termination logic)
 * 
 * SERVICE FUNCTIONALITY:
 * Handles all early termination business logic including fee calculations, invoice creation,
 * and storage usage record updates. Enforces minimum storage periods and proper billing.
 * 
 * USED BY:
 * - Onfleet webhook processing for End Storage Term appointments
 * - Admin tools for manual early termination processing
 * - Customer portal for early termination cost estimation
 * 
 * @refactor Extracted specialized early termination logic for better organization
 */

import { prisma } from '@/lib/database/prismaClient';
import { BillingCalculator, type EarlyTerminationCalculation } from './BillingCalculator';
import { StripeInvoiceService } from '../stripe/stripeInvoiceService';

// Import types (matches StripeInvoiceService interface)
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

export interface BillingEarlyTerminationResult {
  success: boolean;
  hasEarlyTermination: boolean;
  calculation?: EarlyTerminationCalculation;
  earlyTerminationInvoice?: any; // Stripe.Invoice type
  storageUsageUpdated: boolean;
  error?: string;
}

export class EarlyTerminationService {
  /**
   * Process complete early termination workflow for End Storage Term appointments
   */
  static async processEarlyTermination(
    appointment: AppointmentWithRelations,
    storageUsage: StorageUnitUsage
  ): Promise<BillingEarlyTerminationResult> {
    try {
      console.log('Processing early termination for appointment:', appointment.id);

      // Validate required data
      const validation = this.validateEarlyTerminationData(appointment, storageUsage);
      if (!validation.isValid) {
        return {
          success: false,
          hasEarlyTermination: false,
          storageUsageUpdated: false,
          error: validation.error
        };
      }

      // Calculate early termination fee
      const calculation = BillingCalculator.calculateEarlyTerminationFee(
        storageUsage.usageStartDate,
        appointment.numberOfUnits!,
        appointment.monthlyStorageRate!,
        appointment.monthlyInsuranceRate!
      );

      console.log(`Customer has been in storage for ${calculation.daysInStorage} days (minimum: ${calculation.minimumDays})`);

      // If customer is within minimum period, no early termination fee
      if (!calculation.isEarlyTermination) {
        console.log('No early termination fee required - customer met minimum storage period');
        
        // Still update storage usage records
        await this.updateStorageUsageRecords(appointment.id, appointment.requestedStorageUnits);
        
        return {
          success: true,
          hasEarlyTermination: false,
          calculation,
          storageUsageUpdated: true
        };
      }

      console.log(`Charging early termination fee for ${calculation.remainingMonths} remaining months: $${calculation.totalFee}`);

      // Create early termination invoice
      const earlyTerminationInvoice = await StripeInvoiceService.createEarlyTerminationInvoice(
        appointment.user.stripeCustomerId!,
        appointment.id,
        appointment,
        calculation.remainingMonths
      );

      console.log(`Early termination fee invoice created and paid: ${earlyTerminationInvoice.id}`);

      // Update storage usage records
      await this.updateStorageUsageRecords(appointment.id, appointment.requestedStorageUnits);

      return {
        success: true,
        hasEarlyTermination: true,
        calculation,
        earlyTerminationInvoice,
        storageUsageUpdated: true
      };

    } catch (error) {
      console.error('Error processing early termination:', error);
      return {
        success: false,
        hasEarlyTermination: false,
        storageUsageUpdated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate early termination fee without processing (for estimates)
   */
  static calculateEarlyTerminationFee(
    storageStartDate: Date,
    numberOfUnits: number,
    monthlyStorageRate: number,
    monthlyInsuranceRate: number
  ): EarlyTerminationCalculation {
    return BillingCalculator.calculateEarlyTerminationFee(
      storageStartDate,
      numberOfUnits,
      monthlyStorageRate,
      monthlyInsuranceRate
    );
  }

  /**
   * Update storage unit usage records to mark storage as ended
   */
  static async updateStorageUsageRecords(
    appointmentId: number,
    requestedStorageUnits: Array<{ storageUnitId: number }>
  ): Promise<void> {
    try {
      console.log(`Updating storage usage records for appointment ${appointmentId}`);
      
      for (const requestedUnit of requestedStorageUnits) {
        await prisma.storageUnitUsage.updateMany({
          where: {
            storageUnitId: requestedUnit.storageUnitId,
            usageEndDate: null // Only update active usage records
          },
          data: {
            usageEndDate: new Date(),
            endAppointmentId: appointmentId
          }
        });
        
        console.log(`Updated storage usage for unit ${requestedUnit.storageUnitId}`);
      }
    } catch (error) {
      console.error('Error updating storage usage records:', error);
      throw error;
    }
  }

  /**
   * Get storage usage information for early termination calculation
   */
  static async getStorageUsageForEarlyTermination(
    storageUnitId: number
  ): Promise<StorageUnitUsage | null> {
    try {
      const storageUsage = await prisma.storageUnitUsage.findFirst({
        where: {
          storageUnitId,
          usageEndDate: null // Active usage only
        },
        orderBy: {
          usageStartDate: 'asc' // Get the earliest start date if multiple records
        }
      });

      return storageUsage;
    } catch (error) {
      console.error('Error fetching storage usage for early termination:', error);
      return null;
    }
  }

  /**
   * Check if appointment qualifies for early termination processing
   */
  static isEarlyTerminationEligible(appointmentType: string): boolean {
    return appointmentType === 'End Storage Term';
  }

  /**
   * Validate early termination data before processing
   */
  private static validateEarlyTerminationData(
    appointment: AppointmentWithRelations,
    storageUsage: StorageUnitUsage
  ): { isValid: boolean; error?: string } {
    if (!appointment.user.stripeCustomerId) {
      return { isValid: false, error: 'No Stripe customer ID found' };
    }

    if (!appointment.numberOfUnits || appointment.numberOfUnits <= 0) {
      return { isValid: false, error: 'Invalid number of units' };
    }

    if (!appointment.monthlyStorageRate || appointment.monthlyStorageRate <= 0) {
      return { isValid: false, error: 'Invalid monthly storage rate' };
    }

    if (!appointment.monthlyInsuranceRate || appointment.monthlyInsuranceRate < 0) {
      return { isValid: false, error: 'Invalid monthly insurance rate' };
    }

    if (!storageUsage.usageStartDate) {
      return { isValid: false, error: 'No storage usage start date found' };
    }

    if (storageUsage.usageEndDate) {
      return { isValid: false, error: 'Storage usage already ended' };
    }

    return { isValid: true };
  }

  /**
   * Get early termination fee estimate for customer portal
   */
  static async getEarlyTerminationEstimate(
    appointmentId: number
  ): Promise<{ hasEarlyTermination: boolean; calculation?: EarlyTerminationCalculation; error?: string }> {
    try {
      // Get appointment with pricing information
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          user: true,
          requestedStorageUnits: true
        }
      });

      if (!appointment) {
        return { hasEarlyTermination: false, error: 'Appointment not found' };
      }

      // Get storage usage information
      const storageUsage = await this.getStorageUsageForEarlyTermination(
        appointment.requestedStorageUnits[0]?.storageUnitId
      );

      if (!storageUsage) {
        return { hasEarlyTermination: false, error: 'No active storage usage found' };
      }

      // Calculate early termination fee
      const calculation = this.calculateEarlyTerminationFee(
        storageUsage.usageStartDate,
        appointment.numberOfUnits!,
        appointment.monthlyStorageRate!,
        appointment.monthlyInsuranceRate!
      );

      return {
        hasEarlyTermination: calculation.isEarlyTermination,
        calculation
      };

    } catch (error) {
      console.error('Error getting early termination estimate:', error);
      return {
        hasEarlyTermination: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 