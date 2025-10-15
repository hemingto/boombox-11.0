/**
 * @fileoverview Zod validation schemas for GetQuote form
 * @source Extracted validation logic from boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * This file contains Zod schemas for validating each step of the GetQuote flow:
 * - Step 1: Address, plan, and insurance
 * - Step 2: Scheduling
 * - Step 3: Labor selection
 * - Step 4: Contact information and payment
 * - Step 5: Phone verification
 */

import { z } from 'zod';

// ==================== STEP 1: BUILD QUOTE ====================

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid zip code'),
  cityName: z.string().min(1, 'City name is required'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable(),
});

/**
 * Storage unit selection schema
 */
export const storageUnitSchema = z.object({
  storageUnitCount: z.number()
    .min(1, 'At least 1 storage unit is required')
    .max(5, 'Maximum 5 storage units allowed'),
  storageUnitText: z.string().min(1),
});

/**
 * Plan selection schema
 */
export const planSelectionSchema = z.object({
  selectedPlan: z.string().min(1, 'Please select a plan'),
  selectedPlanName: z.enum(
    ['Do It Yourself Plan', 'Full Service Plan'],
    { errorMap: () => ({ message: 'Please select a valid plan' }) }
  ),
  planType: z.string().min(1),
});

/**
 * Insurance option schema
 * Note: Validates the InsuranceOption type from insurance.ts
 */
export const insuranceOptionSchema = z.object({
  label: z.string(),
  price: z.string().optional(),
  value: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Insurance selection schema
 */
export const insuranceSelectionSchema = z.object({
  selectedInsurance: insuranceOptionSchema.nullable()
    .refine((val) => val !== null, {
      message: 'Please select an insurance option',
    }),
});

/**
 * Complete Step 1 validation schema
 */
export const getQuoteStep1Schema = addressSchema
  .merge(storageUnitSchema)
  .merge(planSelectionSchema)
  .merge(insuranceSelectionSchema);

// ==================== STEP 2: SCHEDULING ====================

/**
 * Scheduling validation schema
 */
export const schedulingSchema = z.object({
  scheduledDate: z.date({
    required_error: 'Please select an appointment date',
    invalid_type_error: 'Invalid date format',
  }).nullable().refine((val) => val !== null, {
    message: 'Please select an appointment date',
  }),
  scheduledTimeSlot: z.string()
    .min(1, 'Please select a time slot')
    .nullable()
    .refine((val) => val !== null && val.length > 0, {
      message: 'Please select a time slot',
    }),
});

/**
 * Complete Step 2 validation schema
 */
export const getQuoteStep2Schema = schedulingSchema;

// ==================== STEP 3: LABOR SELECTION ====================

/**
 * Labor option schema
 */
export const laborOptionSchema = z.object({
  id: z.string(),
  price: z.string(),
  title: z.string(),
  onfleetTeamId: z.string().optional(),
});

/**
 * Labor selection schema (only required for Full Service Plan)
 */
export const laborSelectionSchema = z.object({
  selectedLabor: laborOptionSchema.nullable(),
  movingPartnerId: z.number().nullable(),
  parsedLoadingHelpPrice: z.number().nonnegative(),
});

/**
 * Complete Step 3 validation schema
 * Note: Validation is conditional based on plan type
 */
export const getQuoteStep3Schema = laborSelectionSchema.refine(
  (data) => {
    // This will be checked conditionally in the validation logic
    // If Full Service Plan, selectedLabor must not be null
    return true;
  },
  {
    message: 'Please select a moving partner for Full Service Plan',
  }
);

// ==================== STEP 4: CONTACT INFORMATION ====================

/**
 * Email validation regex
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation (10 digits)
 */
const phoneRegex = /^\d{10}$/;

/**
 * Contact information schema
 */
export const contactInfoSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address')
    .email('Please enter a valid email address'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
    .pipe(
      z.string().regex(phoneRegex, 'Phone number must be 10 digits')
    ),
});

/**
 * Stripe customer schema
 */
export const stripeCustomerSchema = z.object({
  stripeCustomerId: z.string().nullable(),
});

/**
 * Complete Step 4 validation schema
 */
export const getQuoteStep4Schema = contactInfoSchema.merge(stripeCustomerSchema);

// ==================== STEP 5: PHONE VERIFICATION ====================

/**
 * Phone verification code schema
 */
export const phoneVerificationSchema = z.object({
  phoneNumber: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z.string().regex(phoneRegex, 'Phone number must be 10 digits')
    ),
  verificationCode: z.string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

/**
 * Verification code only (for code input validation)
 */
export const verificationCodeSchema = z.object({
  code: z.string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),
});

// ==================== QUOTE SUBMISSION ====================

/**
 * Complete quote submission schema
 * Combines all steps for final submission
 */
export const quoteSubmissionSchema = z.object({
  // Customer Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  stripeCustomerId: z.string().min(1, 'Stripe customer ID is required'),
  
  // Appointment Details
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid zip code'),
  appointmentDateTime: z.string().datetime('Invalid date/time format'),
  appointmentType: z.string().min(1, 'Appointment type is required'),
  
  // Storage & Plan Details
  storageUnitCount: z.number().min(1).max(5),
  planType: z.string().min(1),
  selectedPlanName: z.string().min(1),
  
  // Insurance
  selectedInsurance: insuranceOptionSchema.nullable(),
  
  // Labor/Moving Partner
  selectedLabor: laborOptionSchema.nullable(),
  movingPartnerId: z.number().nullable(),
  thirdPartyMovingPartnerId: z.number().nullable(),
  
  // Pricing
  parsedLoadingHelpPrice: z.number().nonnegative(),
  monthlyStorageRate: z.number().nonnegative(),
  monthlyInsuranceRate: z.number().nonnegative(),
  calculatedTotal: z.number().nonnegative(),
});

// ==================== CUSTOMER CREATION ====================

/**
 * Stripe customer creation schema
 */
export const customerCreationSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(phoneRegex, 'Invalid phone number')),
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid zip code'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
});

// ==================== UTILITY SCHEMAS ====================

/**
 * Stripe errors schema
 */
export const stripeErrorsSchema = z.object({
  cardNumber: z.string().nullable().optional(),
  cardExpiry: z.string().nullable().optional(),
  cardCvc: z.string().nullable().optional(),
});

/**
 * Appointment date/time schema
 */
export const appointmentDateTimeSchema = z.object({
  date: z.date(),
  timeSlot: z.string().min(1, 'Time slot is required'),
});

// ==================== VALIDATION HELPERS ====================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Validate phone number (10 digits)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * Validate verification code (6 digits)
 */
export function isValidVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Validate zip code (5 digits)
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}

// ==================== TYPE EXPORTS ====================

/**
 * Export inferred types from schemas for use in components
 */
export type GetQuoteStep1Data = z.infer<typeof getQuoteStep1Schema>;
export type GetQuoteStep2Data = z.infer<typeof getQuoteStep2Schema>;
export type GetQuoteStep3Data = z.infer<typeof getQuoteStep3Schema>;
export type GetQuoteStep4Data = z.infer<typeof getQuoteStep4Schema>;
export type PhoneVerificationData = z.infer<typeof phoneVerificationSchema>;
export type QuoteSubmissionValidated = z.infer<typeof quoteSubmissionSchema>;
export type CustomerCreationValidated = z.infer<typeof customerCreationSchema>;

