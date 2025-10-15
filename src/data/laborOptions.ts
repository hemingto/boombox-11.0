/**
 * @fileoverview Labor Help Options - Centralized constants for unloading assistance options
 * @source boombox-10.0/src/app/components/reusablecomponents/laborhelpdropdown.tsx
 * 
 * CENTRALIZED CONFIGURATION:
 * Contains the standardized labor help options used across multiple forms:
 * - Get Quote forms
 * - Add Storage forms  
 * - Access Storage forms
 * - Edit Appointment forms
 * 
 * @refactor Extracted from inline options to centralized data constants
 */

import { CheckCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';

export interface LaborOption {
  id: string;
  title: string;
  plan: string;
  description?: string;
  icon: React.ElementType;
  pricing?: {
    hourlyRate: number;
    currency: string;
    estimateType: 'fixed' | 'estimate';
  };
}

/**
 * Standard labor help options for unloading assistance
 * These options are used across all appointment and quote forms
 */
export const LABOR_HELP_OPTIONS: LaborOption[] = [
  {
    id: 'option2',
    title: 'Yes, I would love some help unloading',
    plan: 'Full Service Plan',
    description: '$189/hr estimate',
    icon: CheckCircleIcon,
    pricing: {
      hourlyRate: 189,
      currency: 'USD',
      estimateType: 'estimate',
    },
  },
  {
    id: 'option1',
    title: "No, I'll unload my storage unit myself",
    plan: 'Do It Yourself Plan',
    description: 'Free!',
    icon: NoSymbolIcon,
    pricing: {
      hourlyRate: 0,
      currency: 'USD',
      estimateType: 'fixed',
    },
  },
];

/**
 * Labor plan type mappings used in business logic
 */
export const LABOR_PLAN_TYPES = {
  FULL_SERVICE: 'Full Service Plan',
  DO_IT_YOURSELF: 'Do It Yourself Plan',
  THIRD_PARTY: 'Third Party Loading Help',
} as const;

/**
 * Labor option IDs for easy reference
 */
export const LABOR_OPTION_IDS = {
  FULL_SERVICE: 'option2',
  DO_IT_YOURSELF: 'option1',
} as const;

/**
 * Helper function to get labor option by ID
 */
export function getLaborOptionById(id: string): LaborOption | undefined {
  return LABOR_HELP_OPTIONS.find(option => option.id === id);
}

/**
 * Helper function to check if an option is the "Do It Yourself" plan
 */
export function isDIYPlan(optionId: string): boolean {
  return optionId === LABOR_OPTION_IDS.DO_IT_YOURSELF;
}

/**
 * Helper function to check if an option is the "Full Service" plan
 */
export function isFullServicePlan(optionId: string): boolean {
  return optionId === LABOR_OPTION_IDS.FULL_SERVICE;
}
