/**
 * @fileoverview GetQuote form type definitions
 * @source Consolidated from 50+ useState hooks in boombox-10.0/src/app/components/getquote/getquoteform.tsx
 * 
 * This file contains all TypeScript interfaces for the GetQuote flow, including:
 * - Form state management
 * - Provider context types
 * - Insurance and labor options
 * - Submission data structures
 */

import type { InsuranceOption } from './insurance';

// Re-export InsuranceOption for convenience
export type { InsuranceOption };

// ==================== CORE STATE INTERFACES ====================

/**
 * Complete state for GetQuote form flow
 * Consolidates 50+ useState hooks from boombox-10.0
 */
export interface GetQuoteFormState {
  // ==================== STEP 1: BUILD QUOTE ====================
  
  // Address & Location
  address: string;
  cityName: string;
  zipCode: string;
  coordinates: google.maps.LatLngLiteral | null;
  addressError: string | null;
  
  // Storage Units
  storageUnitCount: number;
  storageUnitText: string;
  
  // Plan Selection
  selectedPlan: string; // 'option1' | 'option2'
  selectedPlanName: string; // 'Do It Yourself Plan' | 'Full Service Plan'
  planType: string;
  isPlanDetailsVisible: boolean;
  planError: string | null;
  
  // Insurance
  selectedInsurance: InsuranceOption | null;
  insuranceError: string | null;
  
  // ==================== STEP 2: SCHEDULING ====================
  
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
  scheduleError: string | null;
  
  // ==================== STEP 3: LABOR SELECTION ====================
  
  selectedLabor: LaborOption | null;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  parsedLoadingHelpPrice: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  laborError: string | null;
  unavailableLaborError: string | null;
  
  // ==================== STEP 4: CONFIRM APPOINTMENT ====================
  
  // Contact Information
  firstName: string;
  firstNameError: string | null;
  lastName: string;
  lastNameError: string | null;
  email: string;
  emailError: string | null;
  phoneNumber: string;
  phoneError: string | null;
  
  // Payment
  stripeCustomerId: string | null;
  stripeErrors: StripeErrors;
  
  // ==================== STEP 5: PHONE VERIFICATION ====================
  
  userId: number | null;
  verificationCodeSent: boolean;
  
  // ==================== PRICING ====================
  
  calculatedTotal: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  
  // ==================== UI STATE ====================
  
  currentStep: number;
  isSubmitting: boolean;
  submitError: string | null;
  
  // ==================== METADATA ====================
  
  appointmentType: string; // 'Initial Pickup'
}

/**
 * Labor/Moving Partner selection
 */
export interface LaborOption {
  id: string;
  price: string;
  title: string;
  onfleetTeamId?: string;
}

/**
 * Stripe card validation errors
 */
export interface StripeErrors {
  cardNumber?: string | null;
  cardExpiry?: string | null;
  cardCvc?: string | null;
}

// ==================== PROVIDER CONTEXT INTERFACES ====================

/**
 * Actions available from GetQuote context
 */
export interface GetQuoteFormActions {
  // Address & Location
  setAddress: (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => void;
  clearAddressError: () => void;
  
  // Storage Units
  setStorageUnitCount: (count: number, text: string) => void;
  
  // Plan Selection
  setPlan: (id: string, planName: string, description: string) => void;
  setPlanType: (planType: string) => void;
  togglePlanDetails: () => void;
  clearPlanError: () => void;
  
  // Insurance
  setInsurance: (insurance: InsuranceOption | null) => void;
  clearInsuranceError: () => void;
  
  // Scheduling
  setSchedule: (date: Date, timeSlot: string) => void;
  clearScheduleError: () => void;
  
  // Labor
  setLabor: (
    id: string,
    price: string,
    title: string,
    onfleetTeamId?: string
  ) => void;
  clearLaborError: () => void;
  setUnavailableLaborError: (hasError: boolean, message?: string) => void;
  
  // Contact Info
  setFirstName: (name: string) => void;
  setLastName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhoneNumber: (phone: string) => void;
  setFirstNameError: (error: string | null) => void;
  setLastNameError: (error: string | null) => void;
  setEmailError: (error: string | null) => void;
  setPhoneError: (error: string | null) => void;
  clearContactErrors: () => void;
  
  // Payment
  setStripeCustomerId: (id: string) => void;
  setStripeErrors: (errors: StripeErrors) => void;
  
  // Submission
  setUserId: (id: number) => void;
  setSubmitError: (error: string | null) => void;
  
  // Pricing
  setCalculatedTotal: (total: number) => void;
  setMonthlyStorageRate: (rate: number) => void;
  setMonthlyInsuranceRate: (rate: number) => void;
  
  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  
  // Submission
  submitQuote: () => Promise<void>;
  
  // Utilities
  clearAllErrors: () => void;
  resetForm: () => void;
}

/**
 * Complete GetQuote context value
 */
export interface GetQuoteContextValue {
  state: GetQuoteFormState;
  actions: GetQuoteFormActions;
}

// ==================== SUBMISSION DATA INTERFACES ====================

/**
 * Customer data for Stripe customer creation
 */
export interface CustomerCreationData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  paymentMethodId: string;
}

/**
 * Complete quote submission data for appointment creation
 */
export interface QuoteSubmissionData {
  // Customer Information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  stripeCustomerId: string;
  
  // Appointment Details
  address: string;
  zipCode: string;
  appointmentDateTime: string; // ISO 8601 format
  appointmentType: string;
  
  // Storage & Plan Details
  storageUnitCount: number;
  planType: string;
  selectedPlanName: string;
  
  // Insurance
  selectedInsurance: InsuranceOption | null;
  
  // Labor/Moving Partner
  selectedLabor: LaborOption | null;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  
  // Pricing
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
}

/**
 * Response from appointment creation API
 */
export interface AppointmentResponse {
  message: string;
  userId: number;
  appointment: {
    id: number;
    userId: number;
    appointmentType: string;
    date: Date;
    time: Date;
    address: string;
    zipcode: string;
    numberOfUnits: number;
    planType: string;
    insuranceCoverage: string | null;
    loadingHelpPrice: number;
    monthlyStorageRate: number;
    monthlyInsuranceRate: number;
    quotedPrice: number;
  };
}

// ==================== VERIFICATION INTERFACES ====================

/**
 * Phone verification result from API
 */
export interface VerificationResult {
  userId: string | number;
  userType: 'customer' | 'driver' | 'mover';
  message: string;
}

// ==================== COMPONENT PROP INTERFACES ====================

/**
 * Props for QuoteBuilder component
 */
export interface QuoteBuilderProps {
  address: string;
  addressError: string | null;
  onAddressChange: (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => void;
  clearAddressError: () => void;
  
  storageUnitCount: number;
  onStorageUnitChange: (count: number, text: string) => void;
  
  selectedPlan: string;
  planError: string | null;
  onPlanChange: (id: string, planName: string, description: string) => void;
  clearPlanError: () => void;
  
  isPlanDetailsVisible: boolean;
  togglePlanDetails: () => void;
  
  selectedInsurance: InsuranceOption | null;
  insuranceError: string | null;
  onInsuranceChange: (insurance: InsuranceOption | null) => void;
  clearInsuranceError: () => void;
  
  onPlanTypeChange: (planType: string) => void;
}

/**
 * Props for VerifyPhoneNumber component
 */
export interface VerifyPhoneNumberProps {
  initialPhoneNumber?: string;
  userId: number | null;
}

/**
 * Phone verification state (for usePhoneVerification hook)
 */
export interface PhoneVerificationState {
  phoneNumber: string;
  displayPhoneNumber: string;
  code: string;
  isCodeSent: boolean;
  isVerified: boolean;
  isLoading: boolean;
  canResend: boolean;
  resendTimer: number;
  errors: {
    phoneError: string | null;
    codeError: string | null;
  };
}

