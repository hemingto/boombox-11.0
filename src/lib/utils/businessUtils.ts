/**
 * @fileoverview Business logic utility functions
 * @source boombox-10.0/src/lib/utils/capacityCalculator.ts (calculateOrderWeight, hasCapacity)
 * @source boombox-10.0/src/app/components/edit-appointment/* (parseLoadingHelpPrice)
 * @refactor Consolidated business logic calculations and utilities
 */

/**
 * Order item interface for capacity calculations
 */
export interface OrderItem {
  /** Weight of a single unit (lbs) */
  weight: number;
  /** Number of units ordered */
  quantity: number;
}

/**
 * Aggregate weight for a list of order items
 */
export function calculateOrderWeight(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

/**
 * Check if adding a new order to the current load will exceed the driver's capacity
 * @param currentLoad Current load in pounds already assigned to the driver
 * @param newOrderWeight Weight of the new order (lbs)
 * @param capacityLimit Capacity limit in pounds (variable per driver / vehicle)
 */
export function hasCapacity(
  currentLoad: number,
  newOrderWeight: number,
  capacityLimit: number
): boolean {
  return currentLoad + newOrderWeight <= capacityLimit;
}

/**
 * Parse loading help price from string format like "$25" or "---"
 * Returns 0 for "---" or invalid formats
 */
export function parseLoadingHelpPrice(price: string): number {
  if (price !== '---') {
    const priceMatch = price.match(/\$(\d+)/);
    if (priceMatch) return parseInt(priceMatch[1], 10);
  }
  return 0;
}

/**
 * Standard vehicle capacity limits in pounds
 */
export const VehicleCapacities = {
  SEDAN: 100,
  SUV: 200,
  PICKUP_TRUCK: 1000,
  CARGO_VAN: 1500,
  BOX_TRUCK: 3000,
  LARGE_TRUCK: 5000,
} as const;

/**
 * Standard storage unit sizes and pricing
 */
export const StorageUnitSizes = {
  SMALL: {
    dimensions: '5x5',
    cubicFeet: 125,
    monthlyRate: 150,
    description: 'Small closet',
  },
  MEDIUM: {
    dimensions: '5x10',
    cubicFeet: 250,
    monthlyRate: 250,
    description: 'Large closet',
  },
  LARGE: {
    dimensions: '10x10',
    cubicFeet: 500,
    monthlyRate: 400,
    description: 'Large bedroom',
  },
  EXTRA_LARGE: {
    dimensions: '10x15',
    cubicFeet: 750,
    monthlyRate: 500,
    description: 'One bedroom apartment',
  },
} as const;

/**
 * Calculate estimated storage units needed based on items
 */
export function estimateStorageUnitsNeeded(items: OrderItem[]): number {
  const totalWeight = calculateOrderWeight(items);

  // Rough estimation: 1 unit per 300 lbs (adjustable based on business rules)
  const estimatedUnits = Math.ceil(totalWeight / 300);

  return Math.max(1, estimatedUnits); // Minimum 1 unit
}

/**
 * Calculate monthly storage cost based on unit count and size
 */
export function calculateMonthlyStorageCost(
  unitCount: number,
  unitSize: keyof typeof StorageUnitSizes = 'MEDIUM'
): number {
  const unitRate = StorageUnitSizes[unitSize].monthlyRate;
  return unitCount * unitRate;
}

/**
 * Standard insurance coverage options
 */
export const InsuranceCoverage = {
  BASIC: {
    coverage: 5000,
    monthlyRate: 25,
    description: 'Basic Protection ($5,000)',
  },
  STANDARD: {
    coverage: 10000,
    monthlyRate: 45,
    description: 'Standard Protection ($10,000)',
  },
  PREMIUM: {
    coverage: 25000,
    monthlyRate: 85,
    description: 'Premium Protection ($25,000)',
  },
} as const;

/**
 * Calculate insurance cost based on coverage level
 */
export function calculateInsuranceCost(
  coverageLevel: keyof typeof InsuranceCoverage = 'STANDARD'
): number {
  return InsuranceCoverage[coverageLevel].monthlyRate;
}

/**
 * Service area zip codes (example - should be configurable)
 */
export const ServiceAreas = {
  SAN_FRANCISCO: [
    '94102',
    '94103',
    '94104',
    '94105',
    '94107',
    '94108',
    '94109',
    '94110',
    '94111',
    '94112',
  ],
  BERKELEY: [
    '94701',
    '94702',
    '94703',
    '94704',
    '94705',
    '94707',
    '94708',
    '94709',
    '94710',
    '94712',
  ],
  OAKLAND: [
    '94601',
    '94602',
    '94603',
    '94605',
    '94606',
    '94607',
    '94608',
    '94609',
    '94610',
    '94611',
  ],
};

/**
 * Check if zip code is in service area
 * Checks against the zipCodePrices data which contains all serviced zip codes
 */
export function isInServiceArea(zipCode: string): boolean {
  // Import zipCodePrices dynamically to check if zip is serviced
  // This is the source of truth for service area coverage
  try {
    const { zipCodePrices } = require('@/data/zipcodeprices');
    return zipCode in zipCodePrices;
  } catch (error) {
    // Fallback to hardcoded list if import fails
    const allServiceZips = Object.values(ServiceAreas).flat();
    return allServiceZips.includes(zipCode);
  }
}

/**
 * Get service area name for zip code
 */
export function getServiceAreaForZip(zipCode: string): string | null {
  for (const [area, zips] of Object.entries(ServiceAreas)) {
    if (zips.includes(zipCode)) {
      return area
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  return null;
}

/**
 * Standard delivery time windows
 */
export const DeliveryWindows = {
  MORNING: {
    start: '8:00 AM',
    end: '12:00 PM',
    label: 'Morning (8 AM - 12 PM)',
  },
  AFTERNOON: {
    start: '12:00 PM',
    end: '5:00 PM',
    label: 'Afternoon (12 PM - 5 PM)',
  },
  EVENING: { start: '5:00 PM', end: '8:00 PM', label: 'Evening (5 PM - 8 PM)' },
} as const;

/**
 * Calculate estimated job duration based on units and services
 */
export function estimateJobDuration(
  unitCount: number,
  hasLoadingHelp: boolean = false,
  hasPackingSupplies: boolean = false
): number {
  let baseDuration = 60; // 1 hour base

  // Add time per unit (30 minutes each)
  baseDuration += (unitCount - 1) * 30;

  // Add time for loading help (30 minutes)
  if (hasLoadingHelp) {
    baseDuration += 30;
  }

  // Add time for packing supplies (15 minutes)
  if (hasPackingSupplies) {
    baseDuration += 15;
  }

  return baseDuration; // Return in minutes
}

/**
 * Calculate driver payout based on job parameters
 */
export function calculateDriverPayout(
  baseRate: number,
  distanceMiles: number,
  durationMinutes: number,
  bonusAmount: number = 0
): number {
  const mileageRate = 0.56; // IRS standard rate
  const timeRate = baseRate / 60; // Per minute rate

  const mileagePay = distanceMiles * mileageRate;
  const timePay = durationMinutes * timeRate;

  return Math.round((mileagePay + timePay + bonusAmount) * 100) / 100;
}

/**
 * Business validation rules
 */
export const BusinessRules = {
  MIN_ORDER_VALUE: 50,
  MAX_UNITS_PER_APPOINTMENT: 10,
  MIN_ADVANCE_BOOKING_HOURS: 24,
  MAX_ADVANCE_BOOKING_DAYS: 30,
  CANCELLATION_DEADLINE_HOURS: 24,
  MAX_WEIGHT_PER_DRIVER: 2000, // pounds
} as const;

/**
 * Validate business rules for appointment
 */
export function validateAppointmentRules(appointment: {
  unitCount: number;
  totalValue: number;
  appointmentDate: Date;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check minimum order value
  if (appointment.totalValue < BusinessRules.MIN_ORDER_VALUE) {
    errors.push(`Minimum order value is $${BusinessRules.MIN_ORDER_VALUE}`);
  }

  // Check maximum units
  if (appointment.unitCount > BusinessRules.MAX_UNITS_PER_APPOINTMENT) {
    errors.push(
      `Maximum ${BusinessRules.MAX_UNITS_PER_APPOINTMENT} units per appointment`
    );
  }

  // Check advance booking requirements
  const now = new Date();
  const hoursDiff =
    (appointment.appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff < BusinessRules.MIN_ADVANCE_BOOKING_HOURS) {
    errors.push(
      `Minimum ${BusinessRules.MIN_ADVANCE_BOOKING_HOURS} hours advance booking required`
    );
  }

  if (hoursDiff > BusinessRules.MAX_ADVANCE_BOOKING_DAYS * 24) {
    errors.push(
      `Cannot book more than ${BusinessRules.MAX_ADVANCE_BOOKING_DAYS} days in advance`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
