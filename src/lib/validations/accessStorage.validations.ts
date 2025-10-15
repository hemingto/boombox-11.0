/**
 * @fileoverview Comprehensive Zod validation schemas for Access Storage form
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx (validation logic)
 * @source boombox-10.0/src/app/components/access-storage/accessstoragestep1.tsx (form validation)
 * @refactor Consolidated all access storage validation logic into centralized Zod schemas
 */

import { z } from 'zod';
import { 
  DeliveryReason, 
  PlanType, 
  AppointmentType, 
  AccessStorageStep 
} from '@/types/accessStorage.types';

// ===== COMMON VALIDATION PATTERNS =====

const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
const zipCodeSchema = z
  .string()
  .min(5, 'ZIP code must be at least 5 characters')
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');
const positiveNumberSchema = z.number().positive('Must be a positive number');
const nonNegativeNumberSchema = z.number().min(0, 'Must be non-negative');

// ===== COORDINATE VALIDATION =====

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lng: z.number().min(-180).max(180, 'Invalid longitude')
});

// ===== STORAGE UNIT VALIDATION =====

export const storageUnitSchema = z.object({
  id: z.string().min(1, 'Storage unit ID is required'),
  imageSrc: z.string().url().optional().or(z.literal('')),
  title: z.string().min(1, 'Storage unit title is required'),
  pickUpDate: z.string().min(1, 'Pick up date is required'),
  lastAccessedDate: z.string().min(1, 'Last accessed date is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().nullable().optional()
});

export const storageUnitUsageSchema = z.object({
  id: z.number().positive(),
  usageStartDate: z.string().min(1, 'Usage start date is required'),
  usageEndDate: z.string().nullable().optional(),
  returnDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  mainImage: z.string().nullable().optional(),
  storageUnit: z.object({
    id: z.number().positive(),
    storageUnitNumber: z.string().min(1, 'Storage unit number is required'),
    mainImage: z.string().nullable().optional()
  }),
  appointment: z.any().optional(),
  uploadedImages: z.array(z.string()).default([]),
  location: z.string().nullable().optional(),
  onfleetPhoto: z.string().nullable().optional()
});

// ===== LABOR SELECTION VALIDATION =====

export const selectedLaborSchema = z.object({
  id: z.string().min(1, 'Labor ID is required'),
  price: z.string().min(1, 'Labor price is required'),
  title: z.string().min(1, 'Labor title is required'),
  onfleetTeamId: z.string().optional()
});

// ===== ADDRESS VALIDATION =====

export const addressDataSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  coordinates: coordinatesSchema,
  cityName: z.string().min(1, 'City name is required')
});

// ===== STEP 1: DELIVERY PURPOSE & ADDRESS VALIDATION =====

export const deliveryPurposeStepSchema = z.object({
  deliveryReason: z.nativeEnum(DeliveryReason, {
    errorMap: () => ({ message: 'Please select a reason for delivery' })
  }),
  address: z.string().min(1, 'Please enter your address by selecting from the verified dropdown options'),
  zipCode: zipCodeSchema,
  coordinates: coordinatesSchema.nullable(),
  cityName: z.string().min(1, 'City name is required'),
  selectedStorageUnits: z
    .array(z.string())
    .min(1, 'Please select at least one unit'),
  selectedPlan: z.string().min(1, 'Please choose an unloading help option'),
  selectedPlanName: z.string().min(1, 'Plan name is required'),
  planType: z.string().min(1, 'Plan type is required')
});

// ===== STEP 2: SCHEDULING VALIDATION =====

export const schedulingStepSchema = z.object({
  scheduledDate: z.union([
    z.date(),
    z.null()
  ]).refine((date) => date !== null, {
    message: 'Please select a date'
  }),
  scheduledTimeSlot: z.union([
    z.string().min(1, 'Please select a time slot'),
    z.null()
  ]).refine((slot) => slot !== null && slot !== '', {
    message: 'Please select a time slot'
  })
});

// ===== STEP 3: LABOR SELECTION VALIDATION =====

export const laborSelectionStepSchema = z.object({
  selectedLabor: selectedLaborSchema.nullable(),
  movingPartnerId: z.number().positive().nullable(),
  thirdPartyMovingPartnerId: z.number().positive().nullable(),
  loadingHelpPrice: z.string(),
  loadingHelpDescription: z.string(),
  parsedLoadingHelpPrice: nonNegativeNumberSchema,
  planType: z.string().optional()
}).refine((data) => {
  // For DIY plans, labor selection is optional
  if (data.planType === PlanType.DO_IT_YOURSELF || 
      data.planType === 'Do It Yourself Plan' ||
      !data.planType || 
      data.planType === '') {
    return true;
  }
  // For Full Service plans, must have selected labor
  if (!data.selectedLabor) {
    return false;
  }
  return true;
}, {
  message: 'Please choose a moving help option',
  path: ['laborError']
});

// ===== STEP 4: CONFIRMATION VALIDATION =====

export const confirmationStepSchema = z.object({
  description: z.string().optional().default(''),
  appointmentType: z.nativeEnum(AppointmentType),
  calculatedTotal: nonNegativeNumberSchema
});

// ===== COMPLETE FORM STATE VALIDATION =====

export const accessStorageFormStateSchema = z.object({
  // Step 1: Delivery Purpose & Address
  deliveryReason: z.nativeEnum(DeliveryReason).nullable(),
  address: z.string(),
  zipCode: z.string(),
  coordinates: coordinatesSchema.nullable(),
  cityName: z.string(),
  selectedStorageUnits: z.array(z.string()),
  selectedPlan: z.string(),
  selectedPlanName: z.string(),
  planType: z.string(),
  
  // Step 2: Scheduling
  scheduledDate: z.date().nullable(),
  scheduledTimeSlot: z.string().nullable(),
  
  // Step 3: Labor Selection
  selectedLabor: selectedLaborSchema.nullable(),
  movingPartnerId: z.number().nullable(),
  thirdPartyMovingPartnerId: z.number().nullable(),
  loadingHelpPrice: z.string(),
  loadingHelpDescription: z.string(),
  parsedLoadingHelpPrice: z.number(),
  
  // Step 4: Confirmation
  description: z.string(),
  appointmentType: z.nativeEnum(AppointmentType),
  
  // Calculated values
  calculatedTotal: z.number(),
  monthlyStorageRate: z.number(),
  monthlyInsuranceRate: z.number(),
  
  // Navigation state
  currentStep: z.nativeEnum(AccessStorageStep),
  isPlanDetailsVisible: z.boolean(),
  contentHeight: z.number().nullable()
});

// ===== API SUBMISSION VALIDATION =====

export const accessStorageSubmissionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  address: z.string().min(1, 'Address is required'),
  zipCode: zipCodeSchema,
  selectedPlanName: z.string().min(1, 'Plan name is required'),
  appointmentDateTime: z.string().datetime('Invalid appointment date/time format'),
  deliveryReason: z.nativeEnum(DeliveryReason),
  planType: z.string().min(1, 'Plan type is required'),
  selectedStorageUnits: z
    .array(z.string())
    .min(1, 'At least one storage unit must be selected'),
  description: z.string().default('No added info'),
  appointmentType: z.nativeEnum(AppointmentType),
  parsedLoadingHelpPrice: nonNegativeNumberSchema,
  calculatedTotal: nonNegativeNumberSchema,
  movingPartnerId: z.number().positive().nullable(),
  thirdPartyMovingPartnerId: z.number().positive().nullable(),
  includeUserData: z.boolean().default(true)
});

// ===== EDIT MODE VALIDATION SCHEMAS =====

export const appointmentDetailsResponseSchema = z.object({
  id: z.number().positive(),
  userId: z.number().positive(),
  address: z.string().min(1),
  zipcode: z.string().min(1),
  date: z.string(),
  time: z.string(),
  planType: z.string(),
  deliveryReason: z.string(),
  numberOfUnits: z.number().min(0),
  description: z.string().nullable(),
  appointmentType: z.string(),
  loadingHelpPrice: z.number().min(0),
  monthlyStorageRate: z.number().min(0),
  monthlyInsuranceRate: z.number().min(0),
  quotedPrice: z.number().min(0),
  status: z.string(),
  user: z.object({
    stripeCustomerId: z.string()
  }).optional(),
  movingPartner: z.object({
    id: z.number().positive(),
    name: z.string(),
    hourlyRate: z.number().min(0),
    onfleetTeamId: z.string().optional()
  }).optional(),
  thirdPartyMovingPartner: z.object({
    id: z.number().positive(),
    name: z.string()
  }).optional(),
  requestedStorageUnits: z.array(z.object({
    storageUnitId: z.number().positive()
  })).optional(),
  additionalInfo: z.object({
    stripeCustomerId: z.string()
  }).optional()
});

export const editAppointmentSubmissionSchema = accessStorageSubmissionSchema.extend({
  appointmentId: z.number().positive('Appointment ID is required'),
  status: z.string().optional(),
  monthlyStorageRate: z.number().min(0),
  monthlyInsuranceRate: z.number().min(0),
  selectedLabor: selectedLaborSchema.optional(),
  stripeCustomerId: z.string().optional(),
  storageUnitCount: z.number().positive()
});

export const appointmentOwnershipValidationSchema = z.object({
  appointmentUserId: z.number().positive(),
  currentUserId: z.string().min(1),
}).refine((data) => {
  return data.appointmentUserId.toString() === data.currentUserId;
}, {
  message: 'You do not have permission to edit this appointment'
});

// ===== FORM ERROR VALIDATION =====

export const accessStorageFormErrorsSchema = z.object({
  deliveryReasonError: z.string().nullable(),
  addressError: z.string().nullable(),
  planError: z.string().nullable(),
  storageUnitError: z.string().nullable(),
  laborError: z.string().nullable(),
  scheduleError: z.string().nullable(),
  unavailableLaborError: z.string().nullable(),
  submitError: z.string().nullable()
});

// ===== API RESPONSE VALIDATION =====

export const storageUnitsApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(storageUnitUsageSchema).optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

export const accessStorageApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    appointmentId: z.number().positive(),
    trackingUrl: z.string().optional()
  }).optional(),
  message: z.string().optional(),
  error: z.string().optional()
});

// ===== STEP VALIDATION FUNCTIONS =====

/**
 * Validates Step 1: Delivery Purpose & Address
 */
export const validateDeliveryPurposeStep = (data: any) => {
  try {
    deliveryPurposeStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        // Map field names to expected error field names
        if (field === 'deliveryReason') {
          errors['deliveryReasonError'] = err.message;
        } else if (field === 'address') {
          errors['addressError'] = err.message;
        } else if (field === 'selectedStorageUnits') {
          errors['storageUnitError'] = err.message;
        } else if (field === 'selectedPlan') {
          errors['planError'] = err.message;
        } else {
          errors[`${field}Error`] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { submitError: 'Validation failed' } };
  }
};

/**
 * Validates Step 2: Scheduling
 */
export const validateSchedulingStep = (data: any) => {
  try {
    schedulingStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        // Map field names to expected error field names
        if (field === 'scheduledDate') {
          errors['scheduledDateError'] = err.message;
        } else if (field === 'scheduledTimeSlot') {
          errors['scheduleError'] = err.message;
        } else {
          errors[`${field}Error`] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { scheduleError: 'Please select a date and time slot' } };
  }
};

/**
 * Validates Step 3: Labor Selection
 */
export const validateLaborSelectionStep = (data: any) => {
  try {
    laborSelectionStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        // Map field names to expected error field names
        if (field === 'laborError' || field === 'selectedLabor') {
          errors['laborError'] = err.message;
        } else {
          errors[`${field}Error`] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { laborError: 'Please choose a moving help option' } };
  }
};

/**
 * Validates Step 4: Confirmation
 */
export const validateConfirmationStep = (data: any) => {
  try {
    confirmationStepSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[`${field}Error`] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { submitError: 'Validation failed' } };
  }
};

/**
 * Validates complete form submission
 */
export const validateAccessStorageSubmission = (data: any) => {
  try {
    const validatedData = accessStorageSubmissionSchema.parse(data);
    return { isValid: true, data: validatedData, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[`${field}Error`] = err.message;
      });
      return { isValid: false, data: null, errors };
    }
    return { isValid: false, data: null, errors: { submitError: 'Form validation failed' } };
  }
};

// ===== STEP VALIDATION MAP =====

export const stepValidationMap = {
  [AccessStorageStep.DELIVERY_PURPOSE]: validateDeliveryPurposeStep,
  [AccessStorageStep.SCHEDULING]: validateSchedulingStep,
  [AccessStorageStep.LABOR_SELECTION]: validateLaborSelectionStep,
  [AccessStorageStep.CONFIRMATION]: validateConfirmationStep
};

// ===== UTILITY VALIDATION FUNCTIONS =====

/**
 * Validates storage unit selection based on delivery reason
 */
export const validateStorageUnitSelection = (
  selectedUnits: string[],
  deliveryReason: DeliveryReason | null,
  allUnits: string[]
) => {
  if (selectedUnits.length === 0) {
    return { isValid: false, error: 'Please select at least one unit' };
  }

  if (deliveryReason === DeliveryReason.END_STORAGE_TERM) {
    if (selectedUnits.length !== allUnits.length) {
      return { 
        isValid: false, 
        error: 'All storage units must be selected when ending storage term' 
      };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Validates appointment date/time combination
 */
export const validateAppointmentDateTime = (
  date: Date | null,
  timeSlot: string | null
) => {
  if (!date || !timeSlot) {
    return { isValid: false, error: 'Please select a date and time slot' };
  }

  const appointmentDateTime = new Date(date);
  const timeRegex = /(\d{1,2})(?:\:(\d{2}))?(am|pm)/i;
  const timeMatch = timeSlot.split('-')[0].match(timeRegex);
  
  if (!timeMatch) {
    return { isValid: false, error: 'Invalid time slot format' };
  }

  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const period = timeMatch[3].toLowerCase();
  
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  
  appointmentDateTime.setHours(hours, minutes, 0, 0);
  
  // Check if appointment is in the past
  if (appointmentDateTime < new Date()) {
    return { isValid: false, error: 'Appointment cannot be scheduled in the past' };
  }

  return { isValid: true, error: null, appointmentDateTime };
};

/**
 * Validates labor selection based on plan type
 */
export const validateLaborSelection = (
  planType: string,
  selectedLabor: any,
  movingPartnerId: number | null,
  thirdPartyMovingPartnerId: number | null
) => {
  if (planType === PlanType.DO_IT_YOURSELF) {
    return { isValid: true, error: null };
  }

  if (!selectedLabor) {
    return { isValid: false, error: 'Please choose a moving help option' };
  }

  if (planType === PlanType.FULL_SERVICE && !movingPartnerId) {
    return { isValid: false, error: 'Moving partner selection is required' };
  }

  if (planType === PlanType.THIRD_PARTY && !thirdPartyMovingPartnerId) {
    return { isValid: false, error: 'Third party moving partner selection is required' };
  }

  return { isValid: true, error: null };
};

// ===== EDIT MODE VALIDATION FUNCTIONS =====

/**
 * Validates appointment details response from API
 */
export const validateAppointmentDetailsResponse = (data: any) => {
  try {
    const validatedData = appointmentDetailsResponseSchema.parse(data);
    return { isValid: true, data: validatedData, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        errors[field] = err.message;
      });
      return { isValid: false, data: null, errors };
    }
    return { isValid: false, data: null, errors: { general: 'Invalid appointment data' } };
  }
};

/**
 * Validates edit appointment submission data
 */
export const validateEditAppointmentSubmission = (data: any) => {
  try {
    const validatedData = editAppointmentSubmissionSchema.parse(data);
    return { isValid: true, data: validatedData, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[`${field}Error`] = err.message;
      });
      return { isValid: false, data: null, errors };
    }
    return { isValid: false, data: null, errors: { submitError: 'Edit form validation failed' } };
  }
};

/**
 * Validates appointment ownership
 */
export const validateAppointmentOwnership = (appointmentUserId: number, currentUserId: string) => {
  try {
    appointmentOwnershipValidationSchema.parse({
      appointmentUserId,
      currentUserId
    });
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Permission denied' };
    }
    return { isValid: false, error: 'Permission validation failed' };
  }
};

// ===== EXPORT TYPES FOR INFERENCE =====

export type DeliveryPurposeStepData = z.infer<typeof deliveryPurposeStepSchema>;
export type SchedulingStepData = z.infer<typeof schedulingStepSchema>;
export type LaborSelectionStepData = z.infer<typeof laborSelectionStepSchema>;
export type ConfirmationStepData = z.infer<typeof confirmationStepSchema>;
export type AccessStorageFormState = z.infer<typeof accessStorageFormStateSchema>;
export type AccessStorageSubmissionData = z.infer<typeof accessStorageSubmissionSchema>;
export type StorageUnitsApiResponse = z.infer<typeof storageUnitsApiResponseSchema>;
export type AccessStorageApiResponse = z.infer<typeof accessStorageApiResponseSchema>;

// Edit mode type exports
export type AppointmentDetailsResponse = z.infer<typeof appointmentDetailsResponseSchema>;
export type EditAppointmentSubmissionData = z.infer<typeof editAppointmentSubmissionSchema>;
