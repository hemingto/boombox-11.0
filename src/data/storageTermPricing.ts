export type StorageTerm = 'month-to-month' | '6-month' | '12-month';

export interface StorageTermTier {
  id: StorageTerm;
  label: string;
  description: string;
  minimumMonths: number;
  pickupFee: number;
  returnFee: number;
  pickupFeeWaived: boolean;
  returnFeeWaived: boolean;
}

export const DIY_FREE_SERVICE_MINUTES = 90;
export const DIY_OVERAGE_RATE_PER_HOUR = 50;
export const PICKUP_FEE_PER_UNIT = 75;

export const STORAGE_TERM_TIERS: StorageTermTier[] = [
  {
    id: 'month-to-month',
    label: '0-6 months',
    description: 'No commitment',
    minimumMonths: 0,
    pickupFee: 75,
    returnFee: 75,
    pickupFeeWaived: false,
    returnFeeWaived: false,
  },
  {
    id: '6-month',
    label: '6-12 months',
    description: 'Free pickup',
    minimumMonths: 6,
    pickupFee: 0,
    returnFee: 75,
    pickupFeeWaived: true,
    returnFeeWaived: false,
  },
  {
    id: '12-month',
    label: '12+ months',
    description: 'Free pickup & delivery',
    minimumMonths: 12,
    pickupFee: 0,
    returnFee: 0,
    pickupFeeWaived: true,
    returnFeeWaived: true,
  },
];

export function getStorageTermTier(term: StorageTerm): StorageTermTier {
  const tier = STORAGE_TERM_TIERS.find(t => t.id === term);
  if (!tier) {
    throw new Error(`Unknown storage term: ${term}`);
  }
  return tier;
}

/** Maps a selected term (or none) to API / submission payload fields */
export function getStorageTermSubmissionFields(
  term: StorageTerm | null,
  unitCount: number = 1
): {
  storageTerm: StorageTerm | null;
  pickupFee: number | null;
  returnFee: number | null;
  pickupFeeWaived: boolean;
  returnFeeWaived: boolean;
} {
  if (!term) {
    return {
      storageTerm: null,
      pickupFee: null,
      returnFee: null,
      pickupFeeWaived: false,
      returnFeeWaived: false,
    };
  }
  const tier = getStorageTermTier(term);
  return {
    storageTerm: term,
    pickupFee: tier.pickupFee * unitCount,
    returnFee: tier.returnFee,
    pickupFeeWaived: tier.pickupFeeWaived,
    returnFeeWaived: tier.returnFeeWaived,
  };
}

export function getPickupFeeForTerm(
  term: StorageTerm,
  unitCount: number = 1
): number {
  return getStorageTermTier(term).pickupFee * unitCount;
}

export function getReturnFeeForTerm(term: StorageTerm): number {
  return getStorageTermTier(term).returnFee;
}

export function getMinimumDaysForTerm(term: StorageTerm): number {
  return getStorageTermTier(term).minimumMonths * 30;
}
