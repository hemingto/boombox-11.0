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

export interface EarlyTerminationCalculation {
  daysInStorage: number;
  minimumDays: number;
  isEarlyTermination: boolean;
  remainingDays: number;
  remainingMonths: number;
  storageFeePortion: number;
  insuranceFeePortion: number;
  totalFee: number;
}

export class BillingCalculator {
  private static readonly MINIMUM_LOADING_HELP_MINUTES = 60; // 1 hour minimum
  private static readonly MINIMUM_STORAGE_DAYS = 60; // 2 months minimum
  private static readonly ACCESS_STORAGE_UNIT_PRICING = 50; // TODO: Move to config

  /**
   * Calculate loading help charges with minimum 1-hour billing
   */
  static calculateLoadingHelpTotal(serviceTimeMinutes: number, hourlyRate: number): LoadingHelpCalculation {
    const billedMinutes = Math.max(this.MINIMUM_LOADING_HELP_MINUTES, Math.round(serviceTimeMinutes));
    const perMinuteRate = hourlyRate / 60;
    const total = perMinuteRate * billedMinutes;

    return {
      totalMinutes: serviceTimeMinutes,
      billedMinutes,
      hourlyRate,
      total
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
      monthlyInsuranceRate
    };
  }

  /**
   * Calculate access storage charges (one-time fee)
   */
  static calculateAccessStorageTotal(unitCount: number): AccessStorageCalculation {
    const accessRatePerUnit = this.ACCESS_STORAGE_UNIT_PRICING;
    const total = accessRatePerUnit * unitCount;

    return {
      unitCount,
      accessRatePerUnit,
      total
    };
  }

  /**
   * Calculate early termination fee based on storage duration
   */
  static calculateEarlyTerminationFee(
    storageStartDate: Date,
    numberOfUnits: number,
    monthlyStorageRate: number,
    monthlyInsuranceRate: number
  ): EarlyTerminationCalculation {
    const currentDate = new Date();
    const daysInStorage = Math.floor(
      (currentDate.getTime() - storageStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isEarlyTermination = daysInStorage < this.MINIMUM_STORAGE_DAYS;
    
    if (!isEarlyTermination) {
      return {
        daysInStorage,
        minimumDays: this.MINIMUM_STORAGE_DAYS,
        isEarlyTermination: false,
        remainingDays: 0,
        remainingMonths: 0,
        storageFeePortion: 0,
        insuranceFeePortion: 0,
        totalFee: 0
      };
    }

    const remainingDays = this.MINIMUM_STORAGE_DAYS - daysInStorage;
    const remainingMonths = Math.ceil(remainingDays / 30);
    const storageFeePortion = monthlyStorageRate * numberOfUnits * remainingMonths;
    const insuranceFeePortion = monthlyInsuranceRate * numberOfUnits * remainingMonths;
    const totalFee = storageFeePortion + insuranceFeePortion;

    return {
      daysInStorage,
      minimumDays: this.MINIMUM_STORAGE_DAYS,
      isEarlyTermination: true,
      remainingDays,
      remainingMonths,
      storageFeePortion,
      insuranceFeePortion,
      totalFee
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
    hourlyRate: number
  ): number {
    const storageCharges = this.calculateStorageCharges(numberOfUnits, monthlyStorageRate, monthlyInsuranceRate);
    const loadingHelp = this.calculateLoadingHelpTotal(serviceTimeMinutes, hourlyRate);
    
    return storageCharges.storageTotal + storageCharges.insuranceTotal + loadingHelp.total;
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
    const loadingHelp = this.calculateLoadingHelpTotal(serviceTimeMinutes, hourlyRate);
    
    return accessCharges.total + loadingHelp.total;
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
      return { isValid: false, error: 'Number of units must be greater than 0' };
    }

    if (!pricing.monthlyStorageRate || pricing.monthlyStorageRate <= 0) {
      return { isValid: false, error: 'Monthly storage rate must be greater than 0' };
    }

    if (!pricing.monthlyInsuranceRate || pricing.monthlyInsuranceRate < 0) {
      return { isValid: false, error: 'Monthly insurance rate must be 0 or greater' };
    }

    if (!pricing.loadingHelpPrice || pricing.loadingHelpPrice <= 0) {
      return { isValid: false, error: 'Loading help price must be greater than 0' };
    }

    return { isValid: true };
  }
} 