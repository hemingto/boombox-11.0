/**
 * @fileoverview Insurance coverage options data
 * @source boombox-10.0/src/app/data/insuranceoptions.tsx
 * 
 * REFACTOR UPDATES:
 * - Migrated from JSX to TypeScript data file
 * - Updated to use Heroicons from consistent import path
 * - Aligned pricing with business utils InsuranceCoverage constants
 * - Added TypeScript interfaces for type safety
 * - Updated descriptions to match business requirements
 */

import { ShieldCheckIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

export interface InsuranceOption {
  value: string;
  label: string;
  description: string;
  price: string;
  icon: React.ElementType;
  monthlyRate: number; // Raw numeric value for calculations
}

export const insuranceOptions: InsuranceOption[] = [
  {
    value: 'standard',
    label: 'Standard Insurance Coverage',
    description: 'covers up to $1000 per unit',
    price: '$15/mo',
    monthlyRate: 15,
    icon: ShieldCheckIcon,
  },
  {
    value: 'premium', 
    label: 'Premium Insurance Coverage',
    description: 'covers up to $2500 per unit',
    price: '$25/mo',
    monthlyRate: 25,
    icon: ShieldCheckIcon,
  },
  {
    value: 'none',
    label: 'No Insurance Coverage',
    description: "Will use own renter's insurance",
    price: '$0/mo',
    monthlyRate: 0,
    icon: NoSymbolIcon,
  },
];

export type InsuranceOptionValue = typeof insuranceOptions[number]['value'];
