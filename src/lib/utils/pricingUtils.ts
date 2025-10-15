/**
 * @fileoverview Pricing calculation utilities for quotes and orders
 * @source boombox-10.0/src/app/components/getquote/myquote.tsx (getBoomboxPrice, calculateTotal)
 * @source boombox-10.0/src/app/components/getquote/mobilemyquote.tsx (getBoomboxPrice, calculateTotal)
 * @refactor Consolidated pricing logic from MyQuote components
 */

import { zipCodePrices } from '@/data/zipcodeprices';
import { accessStorageUnitPricing } from '@/data/accessStorageUnitPricing';
import { InsuranceOption } from '@/types/insurance';

export interface PricingCalculation {
  monthlyStorageRate: number;
  insuranceRate: number;
  loadingHelpRate: number;
  accessStorageRate: number;
  total: number;
}

/**
 * Get Boombox price based on zip code
 * @param zipCode - Customer's zip code
 * @returns Price per unit or null if not found
 */
export function getBoomboxPriceByZipCode(zipCode: string): number | null {
  return zipCode && zipCodePrices[zipCode] ? zipCodePrices[zipCode] : null;
}

/**
 * Calculate monthly storage rate based on zip code and unit count
 * @param zipCode - Customer's zip code
 * @param storageUnitCount - Number of storage units
 * @param isAccessStorage - Whether this is access storage (no monthly rate)
 * @returns Monthly storage rate
 */
export function calculateMonthlyStorageRate(
  zipCode: string,
  storageUnitCount: number = 1,
  isAccessStorage: boolean = false
): number {
  if (isAccessStorage) {
    return 0;
  }
  
  const unitPrice = getBoomboxPriceByZipCode(zipCode);
  if (unitPrice !== null) {
    return unitPrice * storageUnitCount;
  }
  
  return 0;
}

/**
 * Parse insurance price from string format (e.g., "$25/mo")
 * @param insurancePrice - Price string from insurance option
 * @returns Numeric price or 0 if parsing fails
 */
export function parseInsurancePrice(insurancePrice: string): number {
  const insuranceMatch = insurancePrice.match(/\$(\d+)/);
  return insuranceMatch ? parseInt(insuranceMatch[1], 10) : 0;
}

/**
 * Calculate insurance rate based on selected insurance and unit count
 * @param selectedInsurance - Selected insurance option
 * @param storageUnitCount - Number of storage units
 * @param isAccessStorage - Whether this is access storage (no insurance)
 * @returns Insurance rate
 */
export function calculateInsuranceRate(
  selectedInsurance: InsuranceOption | null | undefined,
  storageUnitCount: number = 1,
  isAccessStorage: boolean = false
): number {
  if (isAccessStorage || !selectedInsurance?.price) {
    return 0;
  }
  
  const baseRate = parseInsurancePrice(selectedInsurance.price);
  return baseRate * storageUnitCount;
}

/**
 * Parse loading help price from string format
 * @param loadingHelpPrice - Price string (e.g., "$150" or "---")
 * @returns Numeric price or 0 if parsing fails or is "---"
 */
export function parseLoadingHelpPrice(loadingHelpPrice: string): number {
  if (loadingHelpPrice === '---') {
    return 0;
  }
  
  const loadingHelpMatch = loadingHelpPrice.match(/\$(\d+)/);
  return loadingHelpMatch ? parseInt(loadingHelpMatch[1], 10) : 0;
}

/**
 * Calculate access storage unit rate
 * @param accessStorageUnitCount - Number of access storage units
 * @returns Total access storage rate
 */
export function calculateAccessStorageRate(accessStorageUnitCount: number = 0): number {
  return accessStorageUnitCount * accessStorageUnitPricing;
}

/**
 * Calculate total pricing for a quote
 * @param params - Pricing calculation parameters
 * @returns Complete pricing breakdown
 */
export function calculateQuotePricing(params: {
  zipCode: string;
  storageUnitCount?: number;
  selectedInsurance?: InsuranceOption | null;
  loadingHelpPrice: string;
  accessStorageUnitCount?: number;
  isAccessStorage: boolean;
}): PricingCalculation {
  const {
    zipCode,
    storageUnitCount = 1,
    selectedInsurance,
    loadingHelpPrice,
    accessStorageUnitCount = 0,
    isAccessStorage,
  } = params;

  const monthlyStorageRate = calculateMonthlyStorageRate(
    zipCode,
    storageUnitCount,
    isAccessStorage
  );

  const insuranceRate = calculateInsuranceRate(
    selectedInsurance,
    storageUnitCount,
    isAccessStorage
  );

  const loadingHelpRate = parseLoadingHelpPrice(loadingHelpPrice);
  const accessStorageRate = calculateAccessStorageRate(accessStorageUnitCount);

  const total = monthlyStorageRate + insuranceRate + loadingHelpRate + accessStorageRate;

  return {
    monthlyStorageRate,
    insuranceRate,
    loadingHelpRate,
    accessStorageRate,
    total,
  };
}

/**
 * Format insurance price display with unit count multiplier
 * @param selectedInsurance - Selected insurance option
 * @param storageUnitCount - Number of storage units
 * @returns Formatted price string
 */
export function formatInsurancePrice(
  selectedInsurance: InsuranceOption,
  storageUnitCount: number = 1
): string {
  if (!selectedInsurance.price) {
    return '---';
  }

  const baseRate = parseInsurancePrice(selectedInsurance.price);
  if (baseRate > 0 && storageUnitCount > 1) {
    return `$${baseRate * storageUnitCount}/mo`;
  }

  return `${selectedInsurance.price}/mo`;
}

/**
 * Format storage unit price display with strikethrough original price
 * @param unitPrice - Price per unit
 * @param storageUnitCount - Number of storage units
 * @returns Object with formatted price and strikethrough price
 */
export function formatStorageUnitPrice(
  unitPrice: number,
  storageUnitCount: number = 1
): { price: string; strikethroughPrice: string } {
  const totalPrice = unitPrice * storageUnitCount;
  const originalPrice = (unitPrice + 22) * storageUnitCount; // $22 discount per unit
  
  return {
    price: `$${totalPrice}/mo`,
    strikethroughPrice: `$${originalPrice}`,
  };
}
