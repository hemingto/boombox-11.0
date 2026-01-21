/**
 * @fileoverview Comprehensive type definitions for Access Storage form components
 * @source boombox-10.0/src/app/components/access-storage/accessstorageform.tsx
 * @source boombox-10.0/src/app/components/access-storage/accessstoragestep1.tsx
 * @source boombox-10.0/src/app/components/access-storage/accessstorageconfirmappointment.tsx
 * @refactor Consolidated all access storage form types into centralized definitions
 */

import React from 'react';

// ===== ENUMS AND CONSTANTS =====

export enum DeliveryReason {
  ACCESS_ITEMS = 'Access items',
  END_STORAGE_TERM = 'End storage term'
}

export enum PlanType {
  DO_IT_YOURSELF = 'Do It Yourself Plan',
  FULL_SERVICE = 'Full Service Plan',
  THIRD_PARTY = 'Third Party Loading Help'
}

export enum AppointmentType {
  STORAGE_UNIT_ACCESS = 'Storage Unit Access',
  END_STORAGE_TERM = 'End Storage Term'
}

export enum AccessStorageStep {
  DELIVERY_PURPOSE = 1,
  SCHEDULING = 2,
  LABOR_SELECTION = 3,
  CONFIRMATION = 4
}

// ===== CORE INTERFACES =====

export interface StorageUnitUsage {
  id: number;
  usageStartDate: string;
  usageEndDate?: string | null;
  returnDate?: string | null;
  description?: string | null;
  mainImage?: string | null;
  storageUnit: {
    id: number;
    storageUnitNumber: string;
    mainImage: string | null;
    /** Access requests for this storage unit (from API) */
    accessRequests?: Array<{
      appointment?: {
        id: number;
        date: string;
        status: string;
      } | null;
    }>;
  };
  appointment?: any;
  uploadedImages: string[];
  location: string | null;
  onfleetPhoto?: string | null;
}

export interface FormattedStorageUnit {
  id: string;
  imageSrc: string;
  title: string;
  pickUpDate: string;
  lastAccessedDate: string;
  description: string;
  location?: string | null;
  /** Pending access storage appointment for this unit, if any */
  pendingAppointment?: {
    id: number;
    date: string;
    status: string;
  } | null;
}

export interface SelectedLabor {
  id: string;
  price: string;
  title: string;
  onfleetTeamId?: string;
}

export interface AddressData {
  address: string;
  zipCode: string;
  coordinates: google.maps.LatLngLiteral;
  cityName: string;
}

// ===== FORM STATE INTERFACES =====

export interface AccessStorageFormState {
  // Step 1: Delivery Purpose & Address
  deliveryReason: DeliveryReason | null;
  address: string;
  zipCode: string;
  coordinates: google.maps.LatLngLiteral | null;
  cityName: string;
  selectedStorageUnits: string[];
  selectedPlan: string;
  selectedPlanName: string;
  planType: PlanType | string;
  
  // Step 2: Scheduling
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
  
  // Step 3: Labor Selection (conditional)
  selectedLabor: SelectedLabor | null;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  parsedLoadingHelpPrice: number;
  
  // Step 4: Confirmation
  description: string;
  appointmentType: AppointmentType;
  
  // Calculated values
  calculatedTotal: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  
  // Edit mode specific fields
  stripeCustomerId?: string | null;
  
  // Navigation state
  currentStep: AccessStorageStep;
  isPlanDetailsVisible: boolean;
  contentHeight: number | null;
}

export interface AccessStorageFormErrors {
  deliveryReasonError: string | null;
  addressError: string | null;
  planError: string | null;
  storageUnitError: string | null;
  laborError: string | null;
  scheduleError: string | null;
  unavailableLaborError: string | null;
  submitError: string | null;
}

export interface AccessStorageFormFlags {
  isSubmitting: boolean;
  isLoading: boolean;
}

// ===== STEP-SPECIFIC INTERFACES =====

export interface DeliveryPurposeStepData {
  deliveryReason: DeliveryReason | null;
  address: string;
  zipCode: string;
  coordinates: google.maps.LatLngLiteral | null;
  cityName: string;
  selectedStorageUnits: string[];
  selectedPlan: string;
  selectedPlanName: string;
  planType: PlanType | string;
}

export interface SchedulingStepData {
  scheduledDate: Date | null;
  scheduledTimeSlot: string | null;
}

export interface LaborSelectionStepData {
  selectedLabor: SelectedLabor | null;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  loadingHelpPrice: string;
  loadingHelpDescription: string;
  parsedLoadingHelpPrice: number;
}

export interface ConfirmationStepData {
  description: string;
  appointmentType: AppointmentType;
  calculatedTotal: number;
}

// ===== COMPONENT PROP INTERFACES =====

export interface AccessStorageFormProps {
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialZipCode?: string;
  onSubmissionSuccess?: (appointmentId: number) => void;
}

export interface AccessStorageStep1Props {
  deliveryReason: DeliveryReason | null;
  deliveryReasonError: string | null;
  setDeliveryReason: (value: DeliveryReason | null) => void;
  setDeliveryReasonError: (value: string | null) => void;
  address: string;
  addressError: string | null;
  onAddressChange: (
    address: string,
    zipCode: string,
    coordinates: google.maps.LatLngLiteral,
    cityName: string
  ) => void;
  clearAddressError: () => void;
  selectedStorageUnits: string[];
  setSelectedStorageUnits: (value: string[]) => void;
  storageUnitError: string | null;
  setStorageUnitError: (value: string | null) => void;
  selectedPlan: string;
  planError: string | null;
  onPlanChange: (id: string, plan: string, description: string) => void;
  clearPlanError: () => void;
  isPlanDetailsVisible: boolean;
  togglePlanDetails: () => void;
  contentHeight: number | null;
  contentRef: React.RefObject<HTMLDivElement>;
  onPlanTypeChange?: (planType: string) => void;
}

export interface AccessStorageConfirmAppointmentProps {
  goBackToStep1: () => void;
  goBackToStep2: () => void;
  selectedPlanName: string;
  description: string;
  setDescription: (description: string) => void;
}

export interface StorageUnitCheckboxListProps {
  storageUnits: FormattedStorageUnit[];
  onSelectionChange: (selectedIds: string[]) => void;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  selectedIds: string[];
  onClearError?: () => void;
}

// ===== API REQUEST/RESPONSE INTERFACES =====

export interface AccessStorageSubmissionData {
  userId: string;
  address: string;
  zipCode: string;
  selectedPlanName: string;
  appointmentDateTime: string;
  deliveryReason: DeliveryReason;
  planType: PlanType | string;
  selectedStorageUnits: string[];
  description: string;
  appointmentType: AppointmentType;
  parsedLoadingHelpPrice: number;
  calculatedTotal: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  includeUserData: boolean;
}

// ===== EDIT MODE INTERFACES =====

export interface AppointmentDetailsResponse {
  id: number;
  userId: number;
  address: string;
  zipcode: string;
  date: string;
  time: string;
  planType: string;
  deliveryReason: string;
  numberOfUnits: number;
  description: string;
  appointmentType: string;
  loadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  insuranceCoverage?: string | null;
  quotedPrice: number;
  status: string;
  user?: {
    stripeCustomerId: string;
  };
  movingPartner?: {
    id: number;
    name: string;
    hourlyRate: number;
    onfleetTeamId?: string;
  };
  thirdPartyMovingPartner?: {
    id: number;
    name: string;
  };
  requestedStorageUnits?: Array<{
    storageUnitId: number;
  }>;
  additionalInfo?: {
    stripeCustomerId: string;
  };
}

export interface EditAppointmentSubmissionData extends AccessStorageSubmissionData {
  appointmentId: number;
  status?: string;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  selectedLabor?: SelectedLabor;
  stripeCustomerId?: string;
  storageUnitCount: number;
}

export interface UseAppointmentDataReturn {
  // Data
  appointmentData: AppointmentDetailsResponse | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  errorType?: import('@/components/ui/error').AppointmentErrorType | null;
  retryCount?: number;
  isReady: boolean;
  hasError: boolean;
  canRetry?: boolean;
  
  // Actions
  fetchAppointmentData: (appointmentId: string) => Promise<void>;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
  
  // Utility functions
  populateFormFromAppointment: () => Partial<AccessStorageFormState>;
  validateAppointmentOwnership: (userId: string) => boolean;
}

export interface StorageUnitsApiResponse {
  success: boolean;
  data: StorageUnitUsage[];
  message?: string;
}

export interface AccessStorageApiResponse {
  success: boolean;
  data?: {
    appointmentId: number;
    trackingUrl?: string;
  };
  message?: string;
  error?: string;
}

// ===== HOOK INTERFACES =====

export interface UseAccessStorageFormReturn {
  // Form state
  formState: AccessStorageFormState;
  errors: AccessStorageFormErrors;
  flags: AccessStorageFormFlags;
  
  // Form actions
  updateFormState: (updates: Partial<AccessStorageFormState>) => void;
  setError: (field: keyof AccessStorageFormErrors, error: string | null) => void;
  clearError: (field: keyof AccessStorageFormErrors) => void;
  clearAllErrors: () => void;
  
  // Specialized handlers
  handleAddressChange: (address: string, zipCode: string, coordinates: google.maps.LatLngLiteral, cityName: string) => void;
  handleDeliveryReasonChange: (reason: DeliveryReason | null) => void;
  handleStorageUnitSelection: (selectedIds: string[]) => void;
  handleInitialPlanChoice: (id: string, planName: string, description: string) => void;
  handleLaborChange: (id: string, price: string, title: string, onfleetTeamId?: string) => void;
  handleDateTimeSelected: (date: Date, timeSlot: string) => void;
  handleUnavailableLabor: (hasError: boolean, message?: string) => void;
  togglePlanDetails: () => void;
  
  // Step validation
  validateStep: (step: AccessStorageStep) => boolean;
  canProceedToNextStep: () => boolean;
  
  // Form submission
  submitForm: () => Promise<void>;
  resetForm: () => void;
  
  // Edit mode methods
  populateFromAppointment?: (appointmentData: AppointmentDetailsResponse) => void;
  
  // Computed values
  getAppointmentDateTime: () => Date | null;
  combinedDateTimeForLabor: Date | null;
  
  // Refs
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseAccessStorageNavigationReturn {
  // Current state
  currentStep: AccessStorageStep;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // Navigation actions
  goToStep: (step: AccessStorageStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // Specialized navigation
  goBackFromConfirmation: () => void;
  goBackToStep1: () => void;
  goBackToStep2: () => void;
  
  // Step information
  getStepTitle: (step: AccessStorageStep) => string;
  getProgressPercentage: () => number;
  
  // Step flow helpers
  getNextStepFromCurrent: () => AccessStorageStep | null;
  getPreviousStepFromCurrent: () => AccessStorageStep | null;
  isStepAccessible: (step: AccessStorageStep) => boolean;
  getVisibleSteps: () => AccessStorageStep[];
}

export interface UseStorageUnitsReturn {
  // Data
  storageUnits: FormattedStorageUnit[];
  rawStorageUnits: StorageUnitUsage[];
  
  // State
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  hasError: boolean;
  isReady: boolean;
  hasStorageUnits: boolean;
  storageUnitCount: number;
  
  // Actions
  fetchStorageUnits: () => Promise<void>;
  refetch: () => Promise<void>;
  refreshStorageUnits: () => Promise<void>; // Alias for backward compatibility
  retry: () => Promise<void>;
  
  // Utility functions
  getStorageUnitById: (id: string) => FormattedStorageUnit | null;
  findStorageUnitById: (id: string) => FormattedStorageUnit | null; // Alias for backward compatibility
  getStorageUnitsByIds: (ids: string[]) => FormattedStorageUnit[];
  getAllStorageUnitIds: () => string[];
  
  // Selection helpers
  selectAllUnits: () => string[];
  clearSelection: () => string[];
  toggleUnitSelection: (unitId: string, currentSelection: string[]) => string[];
  
  // Validation
  validateStorageUnitSelection: (selectedIds: string[], isEndStorageTerm?: boolean) => { isValid: boolean; error: string | null };
}

export interface UseFormPersistenceReturn {
  saveFormState: (state: Partial<AccessStorageFormState>) => void;
  loadFormState: () => Partial<AccessStorageFormState> | null;
  clearPersistedState: () => void;
  syncWithUrl: (state?: Partial<AccessStorageFormState>) => void;
  loadStateFromUrl: () => Partial<AccessStorageFormState> | null;
  getPersistedValue: <K extends keyof AccessStorageFormState>(key: K) => AccessStorageFormState[K] | null;
  hasPersistedData: () => boolean;
  getFormStateAge: () => number | null;
  clearAllPersistedData: () => void;
}

// ===== UTILITY TYPE HELPERS =====

export type AccessStorageFormField = keyof AccessStorageFormState;
export type AccessStorageErrorField = keyof AccessStorageFormErrors;

export type StepValidationResult = {
  isValid: boolean;
  errors: Partial<AccessStorageFormErrors>;
};

export type FormUpdateAction = {
  type: 'UPDATE_FIELD' | 'UPDATE_MULTIPLE' | 'SET_ERROR' | 'CLEAR_ERROR' | 'RESET';
  field?: AccessStorageFormField;
  value?: any;
  updates?: Partial<AccessStorageFormState>;
  errorField?: AccessStorageErrorField;
  errorValue?: string | null;
};

// ===== CONSTANTS =====

export const ACCESS_STORAGE_STEPS = [
  AccessStorageStep.DELIVERY_PURPOSE,
  AccessStorageStep.SCHEDULING,
  AccessStorageStep.LABOR_SELECTION,
  AccessStorageStep.CONFIRMATION
] as const;

export const STEP_TITLES: Record<AccessStorageStep, string> = {
  [AccessStorageStep.DELIVERY_PURPOSE]: 'Access your storage',
  [AccessStorageStep.SCHEDULING]: 'Schedule appointment',
  [AccessStorageStep.LABOR_SELECTION]: 'Choose labor help',
  [AccessStorageStep.CONFIRMATION]: 'Confirm appointment'
};

export const MY_QUOTE_BUTTON_TEXTS: Record<AccessStorageStep, string> = {
  [AccessStorageStep.DELIVERY_PURPOSE]: 'Schedule Appointment',
  [AccessStorageStep.SCHEDULING]: 'Reserve Appointment',
  [AccessStorageStep.LABOR_SELECTION]: 'Select Movers',
  [AccessStorageStep.CONFIRMATION]: 'Confirm Appointment'
};

export const MOBILE_MY_QUOTE_BUTTON_TEXTS: Record<AccessStorageStep, string> = {
  [AccessStorageStep.DELIVERY_PURPOSE]: 'Schedule',
  [AccessStorageStep.SCHEDULING]: 'Reserve',
  [AccessStorageStep.LABOR_SELECTION]: 'Add Movers',
  [AccessStorageStep.CONFIRMATION]: 'Confirm'
};

// ===== DEFAULT VALUES =====

export const DEFAULT_FORM_STATE: AccessStorageFormState = {
  // Step 1
  deliveryReason: null,
  address: '',
  zipCode: '',
  coordinates: null,
  cityName: '',
  selectedStorageUnits: [],
  selectedPlan: '',
  selectedPlanName: '',
  planType: '',
  
  // Step 2
  scheduledDate: null,
  scheduledTimeSlot: null,
  
  // Step 3
  selectedLabor: null,
  movingPartnerId: null,
  thirdPartyMovingPartnerId: null,
  loadingHelpPrice: '---',
  loadingHelpDescription: '',
  parsedLoadingHelpPrice: 0,
  
  // Step 4
  description: '',
  appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
  
  // Calculated values
  calculatedTotal: 0,
  monthlyStorageRate: 0,
  monthlyInsuranceRate: 0,
  
  // Navigation state
  currentStep: AccessStorageStep.DELIVERY_PURPOSE,
  isPlanDetailsVisible: false,
  contentHeight: null
};

export const DEFAULT_FORM_ERRORS: AccessStorageFormErrors = {
  deliveryReasonError: null,
  addressError: null,
  planError: null,
  storageUnitError: null,
  laborError: null,
  scheduleError: null,
  unavailableLaborError: null,
  submitError: null
};

export const DEFAULT_FORM_FLAGS: AccessStorageFormFlags = {
  isSubmitting: false,
  isLoading: false
};
