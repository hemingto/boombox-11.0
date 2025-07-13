/**
 * @fileoverview Appointment and booking domain types
 * @source boombox-10.0/src/app/types/types.ts
 * @source boombox-11.0/prisma/schema.prisma (Appointment, AdditionalAppointmentInfo models)
 * @refactor Enhanced with comprehensive appointment management types
 */

// ===== CORE APPOINTMENT TYPES =====

export interface Appointment {
  id: number;
  jobCode?: string | null;
  userId: number;
  movingPartnerId?: number | null;
  thirdPartyMovingPartnerId?: number | null;
  appointmentType: AppointmentType;
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
  status: AppointmentStatus;
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
  requestedStorageUnits: RequestedStorageUnit[];
}

export type AppointmentType =
  | 'Initial Pickup'
  | 'Storage Unit Access'
  | 'Additional Storage'
  | 'End Storage Term'
  | 'Return Delivery'
  | 'Damage Inspection';

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'Failed'
  | 'No Show';

export interface AdditionalAppointmentInfo {
  id: number;
  appointmentId: number;
  itemsOver100lbs: boolean;
  storageTerm?: string | null;
  storageAccessFrequency?: string | null;
  moveDescription?: string | null;
  conditionsDescription?: string | null;
}

export interface RequestedStorageUnit {
  id: number;
  storageUnitNumber: string;
}

// ===== APPOINTMENT SCHEDULING TYPES =====

export interface TimeSlot {
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

export interface AvailabilityRequest {
  planType: string;
  year: number;
  month: number;
  date?: number;
  type: 'month' | 'date';
  numberOfUnits?: number;
  zipcode?: string;
}

export interface AvailabilityResponse {
  availableSlots: TimeSlot[];
  unavailableDates: string[];
  partnerAvailability: PartnerAvailability[];
  driverAvailability: DriverAvailability[];
}

export interface PartnerAvailability {
  partnerId: number;
  partnerName: string;
  availableSlots: TimeSlot[];
  hourlyRate?: number;
  rating?: number;
}

export interface DriverAvailability {
  driverId: number;
  driverName: string;
  availableSlots: TimeSlot[];
  vehicleType?: string;
  rating?: number;
}

// ===== APPOINTMENT BOOKING TYPES =====

export interface CreateAppointmentRequest {
  userId: number;
  appointmentType: AppointmentType;
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

export interface UpdateAppointmentRequest {
  appointmentType?: AppointmentType;
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
  status?: AppointmentStatus;
  description?: string;
  deliveryReason?: string;
  movingPartnerId?: number;
  thirdPartyMovingPartnerId?: number;
}

// ===== APPOINTMENT CANCELLATION TYPES =====

export interface AppointmentCancellation {
  id: number;
  appointmentId: number;
  cancellationFee: number;
  cancellationReason: string;
  cancellationDate: Date;
  initiatedBy: 'customer' | 'admin' | 'system';
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
}

export interface CancelAppointmentRequest {
  appointmentId: number;
  cancellationReason: string;
  cancellationFee?: number;
  initiatedBy: 'customer' | 'admin' | 'system';
  notifyCustomer?: boolean;
  refundRequested?: boolean;
}

// ===== APPOINTMENT ASSIGNMENT TYPES =====

export interface AppointmentAssignment {
  appointmentId: number;
  assignedType: 'moving_partner' | 'driver' | 'third_party';
  assignedId: number;
  assignedDate: Date;
  assignedBy: number; // admin user ID
  estimatedDuration?: number; // minutes
  specialInstructions?: string;
  internalNotes?: string;
}

export interface AssignmentRequest {
  appointmentId: number;
  assignedType: 'moving_partner' | 'driver' | 'third_party';
  assignedId: number;
  estimatedDuration?: number;
  specialInstructions?: string;
  internalNotes?: string;
}

// ===== APPOINTMENT TRACKING TYPES =====

export interface AppointmentTracking {
  appointmentId: number;
  trackingToken: string;
  trackingUrl: string;
  currentStatus: AppointmentStatus;
  estimatedArrival?: Date;
  actualArrival?: Date;
  serviceStartTime?: Date;
  serviceEndTime?: Date;
  completionPhotos?: string[];
  customerSignature?: string;
  notes?: string;
}

export interface AppointmentStatusUpdate {
  appointmentId: number;
  newStatus: AppointmentStatus;
  updatedBy: number; // user ID
  updateReason?: string;
  estimatedTime?: Date;
  actualTime?: Date;
  notes?: string;
  photos?: string[];
}

// ===== APPOINTMENT COST TYPES =====

export interface AppointmentCostBreakdown {
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

export interface CostEstimate {
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
    appointmentType: AppointmentType;
  };
}

// ===== APPOINTMENT FEEDBACK TYPES =====

export interface AppointmentFeedback {
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

export interface FeedbackRequest {
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

// ===== ENHANCED APPOINTMENT TYPES =====

export interface AppointmentWithDetails extends Appointment {
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
  additionalInfo?: AdditionalAppointmentInfo;
  cancellations: AppointmentCancellation[];
  feedback?: AppointmentFeedback;
  assignment?: AppointmentAssignment;
  tracking?: AppointmentTracking;
  costBreakdown?: AppointmentCostBreakdown;
}

export interface AppointmentSummary {
  id: number;
  jobCode?: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  date: string;
  time: string;
  address: string;
  customerName: string;
  quotedPrice: number;
  assignedPartner?: string;
  trackingUrl?: string;
}

// ===== API RESPONSE TYPES =====

export interface AppointmentSearchFilters {
  status?: AppointmentStatus[];
  appointmentType?: AppointmentType[];
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

export interface AppointmentSearchResult {
  appointments: AppointmentSummary[];
  totalCount: number;
  filters: AppointmentSearchFilters;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ===== TYPE GUARDS =====

export function isValidAppointmentType(type: string): type is AppointmentType {
  const validTypes: AppointmentType[] = [
    'Initial Pickup',
    'Storage Unit Access',
    'Additional Storage',
    'End Storage Term',
    'Return Delivery',
    'Damage Inspection',
  ];
  return validTypes.includes(type as AppointmentType);
}

export function isValidAppointmentStatus(
  status: string
): status is AppointmentStatus {
  const validStatuses: AppointmentStatus[] = [
    'Scheduled',
    'Confirmed',
    'In Progress',
    'Completed',
    'Cancelled',
    'Rescheduled',
    'Failed',
    'No Show',
  ];
  return validStatuses.includes(status as AppointmentStatus);
}

export function isAssignmentType(
  type: string
): type is 'moving_partner' | 'driver' | 'third_party' {
  return ['moving_partner', 'driver', 'third_party'].includes(type);
}
