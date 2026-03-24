/**
 * @fileoverview Pure billing calculation functions
 * @source boombox-11.0/src/lib/services/stripeInvoiceService.ts (extracted calculations)
 * @source boombox-11.0/src/lib/services/stripeSubscriptionService.ts (extracted calculations)
 *
 * SERVICE FUNCTIONALITY:
 * Pure calculation functions for all billing operations. No side effects, easily testable.
 * Handles loading help, storage charges, insurance charges, and fee calculations.
 *
 * USED BY:
 * - AppointmentBillingService for invoice generation
 * - Quote generation system for upfront pricing
 * - Admin tools for pricing calculations
 * - Customer portal for billing previews
 *
 * @refactor Extracted pure calculation logic for better testability and reusability
 */

import { accessStorageUnitPricing } from '@/data/accessStorageUnitPricing';
import { PROCESSING_FEE_RATE } from '@/data/processingFeeConfig';
import {
  type StorageTerm,
  getStorageTermTier,
  DIY_FREE_SERVICE_MINUTES,
  DIY_OVERAGE_RATE_PER_HOUR,
} from '@/data/storageTermPricing';

// Billing calculation results
export interface LoadingHelpCalculation {
  totalMinutes: number;
  billedMinutes: number; // Minimum 60 minutes
  hourlyRate: number;
  total: number;
}

export interface StorageChargesCalculation {
  storageTotal: number;
  insuranceTotal: number;
  numberOfUnits: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
}

export interface AccessStorageCalculation {
  unitCount: number;
  accessRatePerUnit: number;
  total: number;
}

export interface ProcessingFeeCalculation {
  subtotal: number;
  rate: number;
  fee: number;
}

export interface EarlyTerminationCalculation {
  daysInStorage: number;
  minimumDays: number;
  isEarlyTermination: boolean;
  remainingDays: number;
  remainingMonths: number;
  pickupFeeBilledBack: number;
  returnFeeBilledBack: number;
  totalFee: number;
}

export class BillingCalculator {
  private static readonly MINIMUM_LOADING_HELP_MINUTES = 90; // 1.5 hour minimum

  /**
   * Calculate loading help charges with minimum 1-hour billing
   */
  static calculateLoadingHelpTotal(
    serviceTimeMinutes: number,
    hourlyRate: number
  ): LoadingHelpCalculation {
    const billedMinutes = Math.max(
      this.MINIMUM_LOADING_HELP_MINUTES,
      Math.round(serviceTimeMinutes)
    );
    const perMinuteRate = hourlyRate / 60;
    const total = perMinuteRate * billedMinutes;

    return {
      totalMinutes: serviceTimeMinutes,
      billedMinutes,
      hourlyRate,
      total,
    };
  }

  /**
   * Calculate monthly storage and insurance charges
   */
  static calculateStorageCharges(
    numberOfUnits: number,
    monthlyStorageRate: number,
    monthlyInsuranceRate: number
  ): StorageChargesCalculation {
    const storageTotal = monthlyStorageRate * numberOfUnits;
    const insuranceTotal = monthlyInsuranceRate * numberOfUnits;

    return {
      storageTotal,
      insuranceTotal,
      numberOfUnits,
      monthlyStorageRate,
      monthlyInsuranceRate,
    };
  }

  /**
   * Calculate access storage charges (one-time fee)
   */
  static calculateAccessStorageTotal(
    unitCount: number
  ): AccessStorageCalculation {
    const accessRatePerUnit = accessStorageUnitPricing;
    const total = accessRatePerUnit * unitCount;

    return {
      unitCount,
      accessRatePerUnit,
      total,
    };
  }

  /**
   * Calculate early termination fee based on storage term commitment.
   * Month-to-month customers have no early termination fee.
   * For 6-month/12-month terms, waived fees are billed back if the minimum is not met.
   */
  static calculateEarlyTerminationFee(
    storageStartDate: Date,
    storageTerm: StorageTerm | null,
    pickupFeeWaived: boolean,
    returnFeeWaived: boolean
  ): EarlyTerminationCalculation {
    const currentDate = new Date();
    const daysInStorage = Math.floor(
      (currentDate.getTime() - storageStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (!storageTerm || storageTerm === 'month-to-month') {
      return {
        daysInStorage,
        minimumDays: 0,
        isEarlyTermination: false,
        remainingDays: 0,
        remainingMonths: 0,
        pickupFeeBilledBack: 0,
        returnFeeBilledBack: 0,
        totalFee: 0,
      };
    }

    const tier = getStorageTermTier(storageTerm);
    const minimumDays = tier.minimumMonths * 30;

    if (daysInStorage >= minimumDays) {
      return {
        daysInStorage,
        minimumDays,
        isEarlyTermination: false,
        remainingDays: 0,
        remainingMonths: 0,
        pickupFeeBilledBack: 0,
        returnFeeBilledBack: 0,
        totalFee: 0,
      };
    }

    const remainingDays = minimumDays - daysInStorage;
    const remainingMonths = Math.ceil(remainingDays / 30);
    const pickupFeeBilledBack = pickupFeeWaived ? 75 : 0;
    const returnFeeBilledBack = returnFeeWaived ? 75 : 0;
    const totalFee = pickupFeeBilledBack + returnFeeBilledBack;

    return {
      daysInStorage,
      minimumDays,
      isEarlyTermination: true,
      remainingDays,
      remainingMonths,
      pickupFeeBilledBack,
      returnFeeBilledBack,
      totalFee,
    };
  }

  /**
   * Calculate processing fee on a subtotal
   */
  static calculateProcessingFee(subtotal: number): ProcessingFeeCalculation {
    const fee = Math.round(subtotal * PROCESSING_FEE_RATE * 100) / 100;
    return {
      subtotal,
      rate: PROCESSING_FEE_RATE,
      fee,
    };
  }

  /**
   * Calculate total invoice amount for storage appointments (Initial Pickup, Additional Storage)
   */
  static calculateStorageAppointmentTotal(
    numberOfUnits: number,
    monthlyStorageRate: number,
    monthlyInsuranceRate: number,
    serviceTimeMinutes: number,
    hourlyRate: number,
    pickupFee?: number
  ): number {
    const storageCharges = this.calculateStorageCharges(
      numberOfUnits,
      monthlyStorageRate,
      monthlyInsuranceRate
    );
    const loadingHelp = this.calculateLoadingHelpTotal(
      serviceTimeMinutes,
      hourlyRate
    );
    const subtotal =
      storageCharges.storageTotal +
      storageCharges.insuranceTotal +
      loadingHelp.total +
      (pickupFee || 0);
    const processingFee = this.calculateProcessingFee(subtotal);

    return subtotal + processingFee.fee;
  }

  /**
   * Calculate total invoice amount for access appointments (Access Storage, End Storage Term)
   */
  static calculateAccessAppointmentTotal(
    unitCount: number,
    serviceTimeMinutes: number,
    hourlyRate: number
  ): number {
    const accessCharges = this.calculateAccessStorageTotal(unitCount);
    const loadingHelp = this.calculateLoadingHelpTotal(
      serviceTimeMinutes,
      hourlyRate
    );
    const subtotal = accessCharges.total + loadingHelp.total;
    const processingFee = this.calculateProcessingFee(subtotal);

    return subtotal + processingFee.fee;
  }

  /**
   * Calculate DIY overage charge when service time exceeds the free window
   */
  static calculateDiyOverageCharge(serviceTimeMinutes: number): number {
    if (serviceTimeMinutes <= DIY_FREE_SERVICE_MINUTES) return 0;
    const overageMinutes = serviceTimeMinutes - DIY_FREE_SERVICE_MINUTES;
    const halfHourIncrements = Math.ceil(overageMinutes / 30);
    return halfHourIncrements * (DIY_OVERAGE_RATE_PER_HOUR / 2);
  }

  /**
   * Format currency amount to cents for Stripe (handles rounding)
   */
  static toCents(dollarAmount: number): number {
    return Math.round(dollarAmount * 100);
  }

  /**
   * Format cents to dollar amount for display
   */
  static toDollars(centsAmount: number): number {
    return centsAmount / 100;
  }

  /**
   * Validate pricing inputs to prevent calculation errors
   */
  static validatePricingInputs(pricing: {
    numberOfUnits?: number | null;
    monthlyStorageRate?: number | null;
    monthlyInsuranceRate?: number | null;
    loadingHelpPrice?: number | null;
  }): { isValid: boolean; error?: string } {
    if (!pricing.numberOfUnits || pricing.numberOfUnits <= 0) {
      return {
        isValid: false,
        error: 'Number of units must be greater than 0',
      };
    }

    if (!pricing.monthlyStorageRate || pricing.monthlyStorageRate <= 0) {
      return {
        isValid: false,
        error: 'Monthly storage rate must be greater than 0',
      };
    }

    if (!pricing.monthlyInsuranceRate || pricing.monthlyInsuranceRate < 0) {
      return {
        isValid: false,
        error: 'Monthly insurance rate must be 0 or greater',
      };
    }

    if (!pricing.loadingHelpPrice || pricing.loadingHelpPrice <= 0) {
      return {
        isValid: false,
        error: 'Loading help price must be greater than 0',
      };
    }

    return { isValid: true };
  }
}
