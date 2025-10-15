/**
 * @fileoverview Zod validation schemas for Add Storage form
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx (validation logic)
 * @refactor Extracted validation logic into centralized Zod schemas
 */

import { z } from 'zod';
import { AddStorageStep, PlanType } from '@/types/addStorage.types';

/**
 * Coordinates validation schema
 */
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Address information validation schema
 */
export const addressInfoSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().min(5, 'Valid zip code required').max(10),
  coordinates: coordinatesSchema.nullable(),
  cityName: z.string().min(1, 'City name is required'),
});

/**
 * Storage unit configuration validation schema
 */
export const storageUnitConfigSchema = z.object({
  count: z.number().min(1, 'At least 1 storage unit required').max(5, 'Maximum 5 storage units allowed'),
  text: z.string().min(1, 'Storage unit text is required'),
});

/**
 * Selected labor validation schema
 */
export const selectedLaborSchema = z.object({
  id: z.string().min(1, 'Labor ID is required'),
  price: z.string().min(1, 'Labor price is required'),
  title: z.string().min(1, 'Labor title is required'),
  onfleetTeamId: z.string().optional(),
});

/**
 * Insurance option validation schema
 */
export const insuranceOptionSchema = z.object({
  label: z.string().min(1, 'Insurance label is required'),
  price: z.string().optional(),
  value: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Scheduling information validation schema
 */
export const schedulingInfoSchema = z.object({
  scheduledDate: z.date({
    required_error: 'Scheduled date is required',
    invalid_type_error: 'Invalid date format',
  }).nullable(),
  scheduledTimeSlot: z.string().nullable(),
});

/**
 * Pricing information validation schema
 */
export const pricingInfoSchema = z.object({
  monthlyStorageRate: z.number().min(0, 'Monthly storage rate must be non-negative'),
  monthlyInsuranceRate: z.number().min(0, 'Monthly insurance rate must be non-negative'),
  parsedLoadingHelpPrice: z.number().min(0, 'Loading help price must be non-negative'),
  calculatedTotal: z.number().min(0, 'Total must be non-negative'),
  loadingHelpPrice: z.string().min(1, 'Loading help price is required'),
  loadingHelpDescription: z.string().min(1, 'Loading help description is required'),
});

/**
 * Step 1: Address, Storage Units, Plan Selection, and Insurance
 */
export const addStorageStep1Schema = z.object({
  addressInfo: addressInfoSchema,
  storageUnit: storageUnitConfigSchema,
  selectedPlan: z.string().min(1, 'Please choose a service plan option'),
  selectedPlanName: z.string().min(1, 'Plan name is required'),
  planType: z.nativeEnum(PlanType, {
    required_error: 'Plan type is required',
    invalid_type_error: 'Invalid plan type',
  }),
  selectedInsurance: insuranceOptionSchema.nullable().refine(
    (val) => val !== null,
    { message: 'Please select an insurance option' }
  ),
});

/**
 * Step 2: Scheduling
 */
export const addStorageStep2Schema = z.object({
  scheduling: schedulingInfoSchema,
});

/**
 * Step 3: Labor Selection (conditional based on plan type)
 */
export const addStorageStep3Schema = z.object({
  planType: z.nativeEnum(PlanType),
  selectedLabor: selectedLaborSchema.nullable(),
  movingPartnerId: z.number().nullable(),
  thirdPartyMovingPartnerId: z.number().nullable(),
}).refine(
  (data) => {
    // DIY plan doesn't require labor selection
    if (data.planType === PlanType.DIY) {
      return true;
    }
    // Full Service and Third Party plans require labor selection
    return data.selectedLabor !== null;
  },
  {
    message: 'Please choose a moving help option',
    path: ['selectedLabor'],
  }
);

/**
 * Step 4: Confirmation
 */
export const addStorageStep4Schema = z.object({
  description: z.string().optional(),
  appointmentType: z.string().default('Additional Storage'),
  pricing: pricingInfoSchema,
});

/**
 * Complete form validation schema
 */
export const addStorageFormSchema = z.object({
  addressInfo: addressInfoSchema,
  storageUnit: storageUnitConfigSchema,
  selectedPlan: z.string().min(1, 'Plan selection is required'),
  selectedPlanName: z.string().min(1, 'Plan name is required'),
  planType: z.nativeEnum(PlanType),
  selectedLabor: selectedLaborSchema.nullable(),
  movingPartnerId: z.number().nullable(),
  thirdPartyMovingPartnerId: z.number().nullable(),
  selectedInsurance: insuranceOptionSchema.nullable().refine(
    (val) => val !== null,
    { message: 'Insurance selection is required' }
  ),
  scheduling: schedulingInfoSchema,
  pricing: pricingInfoSchema,
  description: z.string().optional(),
  appointmentType: z.string().default('Additional Storage'),
  currentStep: z.nativeEnum(AddStorageStep),
  isPlanDetailsVisible: z.boolean().default(false),
  contentHeight: z.number().nullable(),
});

/**
 * API submission payload validation schema
 */
export const addStorageSubmissionPayloadSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().min(5, 'Valid zip code required'),
  storageUnitCount: z.number().min(1).max(5),
  selectedInsurance: insuranceOptionSchema.nullable(),
  appointmentDateTime: z.string().datetime('Invalid appointment date time'),
  planType: z.string().min(1, 'Plan type is required'),
  description: z.string().default('No added info'),
  parsedLoadingHelpPrice: z.number().min(0),
  monthlyStorageRate: z.number().min(0),
  monthlyInsuranceRate: z.number().min(0),
  calculatedTotal: z.number().min(0),
  appointmentType: z.string().default('Additional Storage'),
  movingPartnerId: z.number().nullable(),
  thirdPartyMovingPartnerId: z.number().nullable(),
});

/**
 * Form persistence data validation schema
 */
export const addStorageFormPersistenceSchema = z.object({
  step: z.number().min(1).max(4).optional(),
  storageUnitCount: z.number().min(1).max(5).optional(),
  zipCode: z.string().min(5).max(10).optional(),
  selectedPlan: z.string().optional(),
  planType: z.nativeEnum(PlanType).optional(),
});

/**
 * Validation helper functions
 */

/**
 * Validate a specific form step
 */
export function validateFormStep(step: AddStorageStep, data: unknown) {
  switch (step) {
    case AddStorageStep.ADDRESS_AND_PLAN:
      return addStorageStep1Schema.safeParse(data);
    case AddStorageStep.SCHEDULING:
      return addStorageStep2Schema.safeParse(data);
    case AddStorageStep.LABOR_SELECTION:
      return addStorageStep3Schema.safeParse(data);
    case AddStorageStep.CONFIRMATION:
      return addStorageStep4Schema.safeParse(data);
    default:
      throw new Error(`Invalid form step: ${step}`);
  }
}

/**
 * Validate complete form data
 */
export function validateCompleteForm(data: unknown) {
  return addStorageFormSchema.safeParse(data);
}

/**
 * Validate API submission payload
 */
export function validateSubmissionPayload(data: unknown) {
  return addStorageSubmissionPayloadSchema.safeParse(data);
}

/**
 * Validate form persistence data
 */
export function validatePersistenceData(data: unknown) {
  return addStorageFormPersistenceSchema.safeParse(data);
}

/**
 * Type inference helpers
 */
export type AddStorageStep1Data = z.infer<typeof addStorageStep1Schema>;
export type AddStorageStep2Data = z.infer<typeof addStorageStep2Schema>;
export type AddStorageStep3Data = z.infer<typeof addStorageStep3Schema>;
export type AddStorageStep4Data = z.infer<typeof addStorageStep4Schema>;
export type AddStorageFormData = z.infer<typeof addStorageFormSchema>;
export type AddStorageSubmissionPayload = z.infer<typeof addStorageSubmissionPayloadSchema>;
export type AddStorageFormPersistenceData = z.infer<typeof addStorageFormPersistenceSchema>;
