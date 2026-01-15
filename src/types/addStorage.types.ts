/**
 * @fileoverview Type definitions for Add Storage form components
 * @source boombox-10.0/src/app/components/add-storage/userpageaddstorageform.tsx
 * @refactor Extracted and organized types from Add Storage form component
 */

import { InsuranceOption } from '@/types/insurance';

/**
 * Form step enumeration for Add Storage workflow
 */
export enum AddStorageStep {
  ADDRESS_AND_PLAN = 1,
  SCHEDULING = 2,
  LABOR_SELECTION = 3,
  CONFIRMATION = 4,
}

/**
 * Plan type options for storage service
 */
export enum PlanType {
  DIY = 'Do It Yourself Plan',
  FULL_SERVICE = 'Full Service Plan',
  THIRD_PARTY = 'Third Party Loading Help',
}

/**
 * Selected labor option interface
 */
export interface SelectedLabor {
  id: string;
  price: string;
  title: string;
  onfleetTeamId?: string;
}

/**
 * Address information interface
 */
export interface AddressInfo {
  address: string;
  zipCode: string;
  coordinates: google.maps.LatLngLiteral | null;
  cityName: string;
}

/**
 * Storage unit configuration interface
 */
export interface StorageUnitConfig {
  count: number;
  text: string;
}

/**
 * Scheduling information interface
 */
export interface SchedulingInfo {
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
}

/**
 * Pricing information interface
 */
export interface PricingInfo {
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  parsedLoadingHelpPrice: number;
  calculatedTotal: number;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
}

/**
 * Complete Add Storage form state interface
 */
export interface AddStorageFormState {
  // Address & Location
  addressInfo: AddressInfo;
  
  // Storage Configuration
  storageUnit: StorageUnitConfig;
  
  // Plan Selection
  selectedPlan: string;
  selectedPlanName: string;
  planType: PlanType;
  
  // Labor Selection
  selectedLabor: SelectedLabor | null;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  
  // Insurance
  selectedInsurance: InsuranceOption | null;
  
  // Scheduling
  scheduling: SchedulingInfo;
  
  // Pricing
  pricing: PricingInfo;
  
  // Additional Info
  description: string;
  appointmentType: string;
  
  // UI State
  currentStep: AddStorageStep;
  isPlanDetailsVisible: boolean;
  contentHeight: number | null;
}

/**
 * Form validation errors interface
 */
export interface AddStorageFormErrors {
  addressError: string | null;
  planError: string | null;
  laborError: string | null;
  insuranceError: string | null;
  scheduleError: string | null;
  unavailableLaborError: string | null;
  submitError: string | null;
}

/**
 * Form submission state interface
 */
export interface AddStorageSubmissionState {
  isSubmitting: boolean;
  submitError: string | null;
}

/**
 * Navigation state interface
 */
export interface AddStorageNavigationState {
  currentStep: AddStorageStep;
  canProceedToNext: boolean;
  canGoBack: boolean;
}

/**
 * API submission payload interface
 */
export interface AddStorageSubmissionPayload {
  userId: string;
  address: string;
  zipCode: string;
  storageUnitCount: number;
  selectedInsurance: InsuranceOption | null;
  appointmentDateTime: string; // ISO string
  planType: string;
  description: string;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  appointmentType: string;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
}

/**
 * Form step validation result interface
 */
export interface StepValidationResult {
  isValid: boolean;
  errors: Partial<AddStorageFormErrors>;
}

/**
 * Form persistence data interface for URL state sync
 */
export interface AddStorageFormPersistenceData {
  step?: number;
  storageUnitCount?: number;
  zipCode?: string;
  selectedPlan?: string;
  planType?: string;
}

/**
 * Hook return interfaces for type safety
 */
export interface UseAddStorageFormReturn {
  formState: AddStorageFormState;
  errors: AddStorageFormErrors;
  updateFormState: (updates: Partial<AddStorageFormState>) => void;
  updateAddressInfo: (addressInfo: AddressInfo) => void;
  updateStorageUnit: (count: number, text: string) => void;
  updatePlanSelection: (planId: string, planName: string, planType: string) => void;
  updateLaborSelection: (labor: SelectedLabor | null) => void;
  updateInsurance: (insurance: InsuranceOption | null) => void;
  updateScheduling: (date: Date | null, timeSlot: string | null) => void;
  updatePricing: (pricing: Partial<PricingInfo>) => void;
  validateStep: (step: AddStorageStep) => StepValidationResult;
  setError: (errorKey: keyof AddStorageFormErrors, error: string | null) => void;
  clearError: (errorKey: keyof AddStorageFormErrors) => void;
  resetForm: () => void;
  togglePlanDetails: () => void;
  updateContentHeight: () => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export interface UseAddStorageNavigationReturn {
  currentStep: AddStorageStep;
  navigationState: AddStorageNavigationState;
  goToStep: (step: AddStorageStep) => boolean;
  goToNextStep: () => boolean;
  goToPreviousStep: () => boolean;
  canProceed: (step: AddStorageStep) => boolean;
  canGoBack: () => boolean;
  canProceedToNext: () => boolean;
  getStepTitle: (step: AddStorageStep) => string;
  getStepProgress: (step: AddStorageStep) => number;
}

export interface UseAddStorageSubmissionReturn {
  submissionState: AddStorageSubmissionState;
  submitForm: (formState: AddStorageFormState, userId: string) => Promise<void>;
  clearSubmissionError: () => void;
  validateBeforeSubmission: (formState: AddStorageFormState) => string | null;
  canSubmit: (formState: AddStorageFormState) => boolean;
}

export interface UseFormPersistenceReturn {
  persistFormState: (data: AddStorageFormPersistenceData) => void;
  restoreFormState: () => AddStorageFormPersistenceData;
  clearPersistedState: () => void;
}

/**
 * Component prop interfaces
 */
export interface AddStorageFormProps {
  initialStorageUnitCount?: number;
  initialZipCode?: string;
}

export interface AddStorageStep1Props {
  formState: AddStorageFormState;
  errors: AddStorageFormErrors;
  onAddressChange: (addressInfo: AddressInfo) => void;
  onStorageUnitChange: (count: number, text: string) => void;
  onPlanChange: (planId: string, planName: string, planType: string) => void;
  onInsuranceChange: (insurance: InsuranceOption | null) => void;
  onTogglePlanDetails: () => void;
  onClearError: (errorKey: keyof AddStorageFormErrors) => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export interface AddStorageConfirmAppointmentProps {
  formState: AddStorageFormState;
  onDescriptionChange: (description: string) => void;
  onGoBack: () => void;
}

/**
 * Default form state for initialization
 */
export const DEFAULT_ADD_STORAGE_FORM_STATE: AddStorageFormState = {
  addressInfo: {
    address: '',
    zipCode: '',
    coordinates: null,
    cityName: '',
  },
  storageUnit: {
    count: 1,
    text: 'studio apartment',
  },
  selectedPlan: '',
  selectedPlanName: '',
  planType: PlanType.DIY,
  selectedLabor: null,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  selectedInsurance: null,
  scheduling: {
    scheduledDate: null,
    scheduledTimeSlot: null,
  },
  pricing: {
    monthlyStorageRate: 0,
    monthlyInsuranceRate: 0,
    parsedLoadingHelpPrice: 0,
    calculatedTotal: 0,
    loadingHelpPrice: '---',
    loadingHelpDescription: '',
  },
  description: '',
  appointmentType: 'Additional Storage',
  currentStep: AddStorageStep.ADDRESS_AND_PLAN,
  isPlanDetailsVisible: false,
  contentHeight: null,
};

/**
 * Default form errors state
 */
export const DEFAULT_ADD_STORAGE_FORM_ERRORS: AddStorageFormErrors = {
  addressError: null,
  planError: null,
  laborError: null,
  insuranceError: null,
  scheduleError: null,
  unavailableLaborError: null,
  submitError: null,
};
