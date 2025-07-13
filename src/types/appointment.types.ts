/**
 * @fileoverview Appointment and booking domain types
 * @source boombox-10.0/src/app/types/types.ts
 * @source boombox-11.0/prisma/schema.prisma (Appointment, AdditionalAppointmentInfo models)
 * @refactor Enhanced with comprehensive appointment management types and domain prefixing
 */

// ===== CORE APPOINTMENT TYPES =====

export interface AppointmentDomainRecord {
  id: number;
  jobCode?: string | null;
  userId: number;
  movingPartnerId?: number | null;
  thirdPartyMovingPartnerId?: number | null;
  appointmentType: AppointmentDomainType;
  address: string;
  zipcode: string;
  date: string;
  time: string;
  numberOfUnits?: number | null;
  planType?: string | null;
  insuranceCoverage?: string | null;
  loadingHelpPrice?: number | null;
  monthlyStorageRate?: number | null;
  monthlyInsuranceRate?: number | null;
  quotedPrice: number;
  invoiceTotal?: number | null;
  status: AppointmentDomainStatus;
  description?: string | null;
  deliveryReason?: string | null;
  totalEstimatedCost?: number | null;
  totalActualCost?: number | null;
  costLastUpdatedAt?: Date | null;
  trackingToken?: string | null;
  trackingUrl?: string | null;
  invoiceUrl?: string | null;
  serviceStartTime?: string | null;
  serviceEndTime?: string | null;
  calledMovingPartner: boolean;
  gotHoldOfMovingPartner?: boolean | null;
  hasAdditionalInfo: boolean;
  thirdPartyTitle?: string | null;
  requestedStorageUnits: AppointmentDomainRequestedStorageUnit[];
}

// Legacy export for backward compatibility
export type Appointment = AppointmentDomainRecord;

export type AppointmentDomainType =
  | 'Initial Pickup'
  | 'Storage Unit Access'
  | 'Additional Storage'
  | 'End Storage Term'
  | 'Return Delivery'
  | 'Damage Inspection';

// Legacy export for backward compatibility
export type AppointmentType = AppointmentDomainType;

export type AppointmentDomainStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'Failed'
  | 'No Show';

// Legacy export for backward compatibility
export type AppointmentStatus = AppointmentDomainStatus;

export interface AppointmentDomainAdditionalInfo {
  id: number;
  appointmentId: number;
  itemsOver100lbs: boolean;
  storageTerm?: string | null;
  storageAccessFrequency?: string | null;
  moveDescription?: string | null;
  conditionsDescription?: string | null;
}

// Legacy export for backward compatibility
export type AdditionalAppointmentInfo = AppointmentDomainAdditionalInfo;

export interface AppointmentDomainRequestedStorageUnit {
  id: number;
  storageUnitNumber: string;
}

// Legacy export for backward compatibility
export type AppointmentRequestedStorageUnit =
  AppointmentDomainRequestedStorageUnit;

export interface AppointmentDomainTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  capacity: number;
  booked: number;
  movingPartnerId?: number;
  driverId?: number;
}

// Legacy export for backward compatibility
export type AppointmentTimeSlot = AppointmentDomainTimeSlot;

export interface AppointmentDomainAvailabilityRequest {
  planType: string;
  year: number;
  month: number;
  date?: number;
  type: 'month' | 'date';
  numberOfUnits?: number;
  zipcode?: string;
}

// Legacy export for backward compatibility
export type AppointmentAvailabilityRequest =
  AppointmentDomainAvailabilityRequest;

export interface AppointmentDomainAvailabilityResponse {
  availableSlots: AppointmentDomainTimeSlot[];
  unavailableDates: string[];
  partnerAvailability: AppointmentDomainPartnerAvailability[];
  driverAvailability: AppointmentDomainDriverAvailability[];
}

// Legacy export for backward compatibility
export type AppointmentAvailabilityResponse =
  AppointmentDomainAvailabilityResponse;

export interface AppointmentDomainPartnerAvailability {
  partnerId: number;
  partnerName: string;
  availableSlots: AppointmentDomainTimeSlot[];
  hourlyRate?: number;
  rating?: number;
}

// Legacy export for backward compatibility
export type AppointmentPartnerAvailability =
  AppointmentDomainPartnerAvailability;

export interface AppointmentDomainDriverAvailability {
  driverId: number;
  driverName: string;
  availableSlots: AppointmentDomainTimeSlot[];
  vehicleType?: string;
  rating?: number;
}

// Legacy export for backward compatibility
export type AppointmentDriverAvailability = AppointmentDomainDriverAvailability;

// ===== APPOINTMENT CRUD OPERATIONS =====

export interface AppointmentDomainCreateRequest {
  userId: number;
  appointmentType: AppointmentDomainType;
  address: string;
  zipcode: string;
  date: string;
  time: string;
  numberOfUnits?: number;
  planType?: string;
  insuranceCoverage?: string;
  loadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  quotedPrice: number;
  description?: string;
  deliveryReason?: string;
  movingPartnerId?: number;
  thirdPartyMovingPartnerId?: number;
  additionalInfo?: {
    itemsOver100lbs: boolean;
    storageTerm?: string;
    storageAccessFrequency?: string;
    moveDescription?: string;
    conditionsDescription?: string;
  };
  requestedStorageUnits?: number[];
}

// Legacy export for backward compatibility
export type AppointmentCreateRequest = AppointmentDomainCreateRequest;

export interface AppointmentDomainUpdateRequest {
  appointmentType?: AppointmentDomainType;
  address?: string;
  zipcode?: string;
  date?: string;
  time?: string;
  numberOfUnits?: number;
  planType?: string;
  insuranceCoverage?: string;
  loadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  quotedPrice?: number;
  status?: AppointmentDomainStatus;
  description?: string;
  deliveryReason?: string;
  movingPartnerId?: number;
  thirdPartyMovingPartnerId?: number;
}

// Legacy export for backward compatibility
export type AppointmentUpdateRequest = AppointmentDomainUpdateRequest;

// ===== APPOINTMENT CANCELLATION =====

export interface AppointmentDomainCancellation {
  id: number;
  appointmentId: number;
  cancellationFee: number;
  cancellationReason: string;
  cancellationDate: Date;
  initiatedBy: 'customer' | 'admin' | 'system';
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
}

// Legacy export for backward compatibility
export type AppointmentCancellation = AppointmentDomainCancellation;

export interface AppointmentDomainCancelRequest {
  appointmentId: number;
  cancellationReason: string;
  cancellationFee?: number;
  initiatedBy: 'customer' | 'admin' | 'system';
  notifyCustomer?: boolean;
  refundRequested?: boolean;
}

// Legacy export for backward compatibility
export type CancelAppointmentRequest = AppointmentDomainCancelRequest;

// ===== APPOINTMENT ASSIGNMENT =====

export interface AppointmentDomainAssignment {
  appointmentId: number;
  assignedType: 'moving_partner' | 'driver' | 'third_party';
  assignedId: number;
  assignedDate: Date;
  assignedBy: number; // admin user ID
  estimatedDuration?: number; // minutes
  specialInstructions?: string;
  internalNotes?: string;
}

// Legacy export for backward compatibility
export type AppointmentAssignment = AppointmentDomainAssignment;

export interface AppointmentDomainAssignmentRequest {
  appointmentId: number;
  assignedType: 'moving_partner' | 'driver' | 'third_party';
  assignedId: number;
  estimatedDuration?: number;
  specialInstructions?: string;
  internalNotes?: string;
}

// Legacy export for backward compatibility
export type AssignmentRequest = AppointmentDomainAssignmentRequest;

// ===== APPOINTMENT TRACKING =====

export interface AppointmentDomainTracking {
  appointmentId: number;
  trackingToken: string;
  trackingUrl: string;
  currentStatus: AppointmentDomainStatus;
  estimatedArrival?: Date;
  actualArrival?: Date;
  serviceStartTime?: Date;
  serviceEndTime?: Date;
  completionPhotos?: string[];
  customerSignature?: string;
  notes?: string;
}

// Legacy export for backward compatibility
export type AppointmentTracking = AppointmentDomainTracking;

export interface AppointmentDomainStatusUpdate {
  appointmentId: number;
  newStatus: AppointmentDomainStatus;
  updatedBy: number; // user ID
  updateReason?: string;
  estimatedTime?: Date;
  actualTime?: Date;
  notes?: string;
  photos?: string[];
}

// Legacy export for backward compatibility
export type AppointmentStatusUpdate = AppointmentDomainStatusUpdate;

// ===== APPOINTMENT COST MANAGEMENT =====

export interface AppointmentDomainCostBreakdown {
  appointmentId: number;
  baseCost: number;
  loadingHelpCost: number;
  monthlyStorageCost: number;
  monthlyInsuranceCost: number;
  additionalServicesCost: number;
  taxAmount: number;
  totalCost: number;
  discountAmount?: number;
  discountReason?: string;
}

// Legacy export for backward compatibility
export type AppointmentCostBreakdown = AppointmentDomainCostBreakdown;

export interface AppointmentDomainCostEstimate {
  baseCost: number;
  loadingHelpCost: number;
  monthlyStorageCost: number;
  monthlyInsuranceCost: number;
  estimatedTotalCost: number;
  factors: {
    numberOfUnits: number;
    planType: string;
    insuranceCoverage: string;
    zipcode: string;
    appointmentType: AppointmentDomainType;
  };
}

// Legacy export for backward compatibility
export type CostEstimate = AppointmentDomainCostEstimate;

// ===== APPOINTMENT FEEDBACK =====

export interface AppointmentDomainFeedback {
  id: number;
  appointmentId: number;
  rating: number; // 1-5
  comment?: string;
  categories: {
    punctuality: number;
    professionalism: number;
    careOfItems: number;
    communication: number;
    overall: number;
  };
  wouldRecommend: boolean;
  submittedAt: Date;
  respondedAt?: Date;
  adminResponse?: string;
}

// Legacy export for backward compatibility
export type AppointmentFeedback = AppointmentDomainFeedback;

export interface AppointmentDomainFeedbackRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
  categories: {
    punctuality: number;
    professionalism: number;
    careOfItems: number;
    communication: number;
    overall: number;
  };
  wouldRecommend: boolean;
}

// Legacy export for backward compatibility
export type FeedbackRequest = AppointmentDomainFeedbackRequest;

// ===== APPOINTMENT EXTENDED VIEWS =====

export interface AppointmentDomainWithDetails extends AppointmentDomainRecord {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  movingPartner?: {
    id: number;
    name: string;
    phoneNumber?: string;
    email?: string;
    hourlyRate?: number;
  };
  thirdPartyMovingPartner?: {
    id: number;
    name: string;
    contactInfo: string;
  };
  additionalInfo?: AppointmentDomainAdditionalInfo;
  cancellations: AppointmentDomainCancellation[];
  feedback?: AppointmentDomainFeedback;
  assignment?: AppointmentDomainAssignment;
  tracking?: AppointmentDomainTracking;
  costBreakdown?: AppointmentDomainCostBreakdown;
}

// Legacy export for backward compatibility
export type AppointmentWithDetails = AppointmentDomainWithDetails;

export interface AppointmentDomainSummary {
  id: number;
  jobCode?: string;
  appointmentType: AppointmentDomainType;
  status: AppointmentDomainStatus;
  date: string;
  time: string;
  address: string;
  customerName: string;
  quotedPrice: number;
  assignedPartner?: string;
  trackingUrl?: string;
}

// Legacy export for backward compatibility
export type AppointmentSummary = AppointmentDomainSummary;

// ===== APPOINTMENT SEARCH & FILTERING =====

export interface AppointmentDomainSearchFilters {
  status?: AppointmentDomainStatus[];
  appointmentType?: AppointmentDomainType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerId?: number;
  movingPartnerId?: number;
  zipcode?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Legacy export for backward compatibility
export type AppointmentSearchFilters = AppointmentDomainSearchFilters;

export interface AppointmentDomainSearchResult {
  appointments: AppointmentDomainSummary[];
  totalCount: number;
  filters: AppointmentDomainSearchFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Legacy export for backward compatibility
export type AppointmentSearchResult = AppointmentDomainSearchResult;

// ===== TYPE GUARDS =====

export function isValidAppointmentDomainType(
  type: string
): type is AppointmentDomainType {
  return [
    'Initial Pickup',
    'Storage Unit Access',
    'Additional Storage',
    'End Storage Term',
    'Return Delivery',
    'Damage Inspection',
  ].includes(type);
}

// Legacy export for backward compatibility
export function isValidAppointmentType(
  type: string
): type is AppointmentDomainType {
  return isValidAppointmentDomainType(type);
}

export function isValidAppointmentDomainStatus(
  status: string
): status is AppointmentDomainStatus {
  return [
    'Scheduled',
    'Confirmed',
    'In Progress',
    'Completed',
    'Cancelled',
    'Rescheduled',
    'Failed',
    'No Show',
  ].includes(status);
}

// Legacy export for backward compatibility
export function isValidAppointmentStatus(
  status: string
): status is AppointmentDomainStatus {
  return isValidAppointmentDomainStatus(status);
}

export function isAppointmentDomainAssignmentType(
  type: string
): type is 'moving_partner' | 'driver' | 'third_party' {
  return ['moving_partner', 'driver', 'third_party'].includes(type);
}

// Legacy export for backward compatibility
export function isAssignmentType(
  type: string
): type is 'moving_partner' | 'driver' | 'third_party' {
  return isAppointmentDomainAssignmentType(type);
}
