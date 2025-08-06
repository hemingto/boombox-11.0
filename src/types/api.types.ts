/**
 * @fileoverview Comprehensive API types for standardized responses and domain-specific interfaces
 * @source boombox-10.0/src/app/api (analyzed all route patterns)
 * @refactor Created standardized API response system with consistent error handling and domain organization
 */

// ===== CORE API RESPONSE TYPES =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // For validation errors
  timestamp?: string;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  version?: string;
  pagination?: PaginationMeta;
  rateLimitRemaining?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== ERROR CODES =====

export const API_ERROR_CODES = {
  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',

  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Business Logic
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  DRIVER_UNAVAILABLE: 'DRIVER_UNAVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ONFLEET_ERROR: 'ONFLEET_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',

  // Resource Constraints
  NO_AVAILABLE_DRIVERS: 'NO_AVAILABLE_DRIVERS',
  STORAGE_UNIT_UNAVAILABLE: 'STORAGE_UNIT_UNAVAILABLE',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ===== AUTHENTICATION DOMAIN TYPES =====

export interface ApiLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ApiLoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
  };
  session: {
    token: string;
    expiresAt: string;
  };
  redirectUrl?: string;
}

export interface ApiSignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  zipCode?: string;
  acceptTerms: boolean;
  marketingOptIn?: boolean;
}

export interface ApiSignupResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  verificationEmailSent: boolean;
  message: string;
}

export interface ApiForgotPasswordRequest {
  email: string;
}

export interface ApiForgotPasswordResponse {
  message: string;
  emailSent: boolean;
}

export interface ApiResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResetPasswordResponse {
  message: string;
  success: boolean;
}

export interface ApiVerifyEmailRequest {
  token: string;
}

export interface ApiVerifyEmailResponse {
  message: string;
  success: boolean;
  redirectUrl?: string;
}

export interface ApiSendCodeRequest {
  phoneNumber: string;
  purpose: 'verification' | 'password_reset' | 'two_factor';
}

export interface ApiSendCodeResponse {
  message: string;
  codeSent: boolean;
  expiresAt: string;
}

export interface ApiVerifyCodeRequest {
  phoneNumber: string;
  code: string;
  purpose: 'verification' | 'password_reset' | 'two_factor';
}

export interface ApiVerifyCodeResponse {
  message: string;
  verified: boolean;
  token?: string; // For password reset flow
}

export interface ApiDriverPhoneVerifyRequest {
  driverId: number;
  phoneNumber: string;
  verificationCode: string;
}

export interface ApiDriverPhoneVerifyResponse {
  verified: boolean;
  message: string;
  driverUpdated: boolean;
}

export interface ApiSessionResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    phoneNumber?: string;
  } | null;
  authenticated: boolean;
}

export interface ApiLogoutResponse {
  message: string;
  success: boolean;
}

// ===== PAYMENT DOMAIN TYPES =====

export interface ApiCreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethodId?: string; // From Stripe Elements
}

export interface ApiCreateCustomerResponse {
  customerId: string; // Stripe customer ID
  clientSecret?: string; // For SetupIntent if payment method provided
  message: string;
}

export interface ApiCreatePaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  customerId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;
}

export interface ApiCreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  status: string;
  amount: number;
  currency: string;
}

export interface ApiStripeWebhookRequest {
  // Stripe webhook payload - varies by event type
  id: string;
  object: string;
  type: string;
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string;
    idempotency_key?: string;
  };
}

export interface ApiStripeWebhookResponse {
  received: boolean;
  processed: boolean;
  message: string;
  eventType: string;
}

export interface ApiConnectAccountRequest {
  driverId: number;
  businessType: 'individual' | 'company';
  email: string;
  country: string;
  accountToken?: string; // From Stripe Connect onboarding
}

export interface ApiConnectAccountResponse {
  accountId: string;
  onboardingUrl?: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export interface ApiAddPaymentMethodRequest {
  customerId: string;
  paymentMethodId: string; // From Stripe Elements
  setAsDefault?: boolean;
}

export interface ApiAddPaymentMethodResponse {
  paymentMethodId: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface ApiRemovePaymentMethodRequest {
  paymentMethodId: string;
  customerId: string;
}

export interface ApiRemovePaymentMethodResponse {
  removed: boolean;
  message: string;
}

export interface ApiPaymentHistoryRequest {
  customerId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

export interface ApiPaymentHistoryResponse {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    createdAt: string;
    paymentMethod: {
      type: string;
      last4?: string;
      brand?: string;
    };
  }>;
  pagination: PaginationMeta;
}

// ===== ORDERS DOMAIN TYPES =====

export interface ApiCreateAppointmentRequest {
  customerId: number;
  appointmentType:
    | 'Initial Pickup'
    | 'Storage Unit Access'
    | 'End Storage Term'
    | 'Additional Storage';
  date: string; // ISO date string
  time: string; // Time string
  address: string;
  zipCode: string;
  phoneNumber: string;
  specialInstructions?: string;
  storageUnitIds?: number[]; // For access appointments
  additionalUnitsOnly?: boolean;
}

export interface ApiCreateAppointmentResponse {
  appointmentId: number;
  jobCode: string;
  scheduledDateTime: string;
  estimatedCost: number;
  confirmationNumber: string;
  trackingUrl?: string;
}

export interface ApiEditAppointmentRequest {
  appointmentId: number;
  date?: string;
  time?: string;
  address?: string;
  zipCode?: string;
  phoneNumber?: string;
  specialInstructions?: string;
  storageUnitIds?: number[];
}

export interface ApiEditAppointmentResponse {
  appointmentId: number;
  updated: boolean;
  changes: string[];
  newEstimatedCost?: number;
  rescheduleRequired?: boolean;
}

export interface ApiCancelAppointmentRequest {
  appointmentId: number;
  cancellationReason: string;
  refundRequested?: boolean;
}

export interface ApiCancelAppointmentResponse {
  appointmentId: number;
  cancelled: boolean;
  cancellationFee: number;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'denied';
}

export interface ApiCreatePackingSupplyOrderRequest {
  customerId: number;
  deliveryAddress: string;
  deliveryZipCode: string;
  deliveryDate: string; // ISO date string
  deliveryTimeSlot: string; // e.g., "9:00 AM - 12:00 PM"
  phoneNumber: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  specialInstructions?: string;
  contactlessDelivery?: boolean;
}

export interface ApiCreatePackingSupplyOrderResponse {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  deliveryDate: string;
  deliveryTimeSlot: string;
  trackingUrl?: string;
  estimatedDeliveryTime?: string;
}

export interface ApiUpdatePackingSupplyOrderRequest {
  orderId: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  deliveryAddress?: string;
  phoneNumber?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  specialInstructions?: string;
}

export interface ApiUpdatePackingSupplyOrderResponse {
  orderId: string;
  updated: boolean;
  changes: string[];
  newTotalAmount?: number;
  rescheduleRequired?: boolean;
}

export interface ApiCancelPackingSupplyOrderRequest {
  orderId: string;
  cancellationReason: string;
  refundRequested?: boolean;
}

export interface ApiCancelPackingSupplyOrderResponse {
  orderId: string;
  cancelled: boolean;
  cancellationFee: number;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'denied';
}

// ===== ONFLEET DOMAIN TYPES =====

export interface ApiCreateOnfleetTaskRequest {
  destination: {
    address: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  recipients: Array<{
    name: string;
    phone: string;
    notes?: string;
  }>;
  completeBefore?: number; // Unix timestamp
  completeAfter?: number; // Unix timestamp
  pickupTask?: boolean;
  autoAssign?: {
    mode: 'distance' | 'load' | 'time';
    maxAssignedTasks?: number;
    team?: string;
    maxTasksPerRoute?: number;
  };
  metadata?: Array<{
    name: string;
    type: 'boolean' | 'number' | 'string' | 'object' | 'array';
    value: unknown;
    visibility?: 'api' | 'dashboard' | 'worker';
  }>;
  notes?: string;
  merchantId?: string;
  quantity?: number;
  serviceTime?: number; // minutes
}

export interface ApiCreateOnfleetTaskResponse {
  taskId: string;
  shortId: string;
  trackingURL: string;
  worker?: string;
  merchantId?: string;
  executor?: string;
  completeAfter: number;
  completeBefore: number;
  estimatedCompletionTime?: number;
  estimatedArrivalTime?: number;
}

export interface ApiUpdateOnfleetTaskRequest {
  taskId: string;
  destination?: {
    address: string;
    coordinates?: [number, number];
  };
  recipients?: Array<{
    name: string;
    phone: string;
    notes?: string;
  }>;
  completeBefore?: number;
  completeAfter?: number;
  notes?: string;
  metadata?: Array<{
    name: string;
    type: 'boolean' | 'number' | 'string' | 'object' | 'array';
    value: unknown;
    visibility?: 'api' | 'dashboard' | 'worker';
  }>;
}

export interface ApiUpdateOnfleetTaskResponse {
  taskId: string;
  updated: boolean;
  changes: string[];
  newEstimatedTime?: number;
}

export interface ApiOnfleetWebhookRequest {
  workerId?: string;
  adminId?: string;
  data: {
    task?: {
      id: string;
      shortId: string;
      trackingURL: string;
      worker?: string;
      merchant?: string;
      executor?: string;
      creator?: string;
      dependencies?: string[];
      state: number;
      completeAfter: number;
      completeBefore: number;
      pickupTask: boolean;
      notes?: string;
      trackingViewed: boolean;
      recipients: unknown[];
      destination: unknown;
      metadata?: unknown[];
    };
    worker?: {
      id: string;
      name: string;
      phone: string;
      activeTask?: string;
      tasks?: string[];
      onDuty: boolean;
      accountStatus: string;
      metadata?: unknown[];
    };
  };
  actionContext?: {
    type: string;
    id: string;
  };
  taskId?: string;
  triggerId: number;
  time: number;
}

export interface ApiOnfleetWebhookResponse {
  received: boolean;
  processed: boolean;
  triggerId: number;
  taskId?: string;
  workerId?: string;
  action: string;
}

export interface ApiOnfleetWorkersRequest {
  page?: number;
  limit?: number;
  filter?: {
    states?: number[];
    teams?: string[];
    phones?: string[];
  };
}

export interface ApiOnfleetWorkersResponse {
  workers: Array<{
    id: string;
    name: string;
    phone: string;
    activeTask?: string;
    tasks: string[];
    onDuty: boolean;
    accountStatus: string;
    location?: [number, number];
    metadata?: unknown[];
  }>;
  pagination: PaginationMeta;
}

export interface ApiCalculatePayoutRequest {
  workerId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  includeBonus?: boolean;
}

export interface ApiCalculatePayoutResponse {
  workerId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  completedTasks: number;
  totalEarnings: number;
  breakdown: {
    basePay: number;
    bonuses: number;
    deductions: number;
  };
  payoutDate?: string;
}

export interface ApiDispatchTeamRequest {
  teamId: string;
  tasks: string[]; // Array of task IDs
  optimizeRoute?: boolean;
  serviceTime?: number; // minutes per task
}

export interface ApiDispatchTeamResponse {
  teamId: string;
  dispatchedTasks: string[];
  optimizedRoute?: {
    totalDistance: number;
    totalTime: number;
    waypoints: Array<{
      taskId: string;
      estimatedArrival: number;
      estimatedCompletion: number;
    }>;
  };
}

// ===== DRIVERS DOMAIN TYPES =====

export interface ApiAssignDriverRequest {
  appointmentId: number;
  driverId?: number; // If not provided, auto-assign
  preferredDate?: string;
  preferredTime?: string;
  specialRequirements?: string[];
  estimatedDuration?: number; // minutes
  autoAssign?: boolean;
}

export interface ApiAssignDriverResponse {
  appointmentId: number;
  driverId: number;
  driverName: string;
  assignmentDate: string;
  estimatedArrival: string;
  trackingUrl?: string;
  driverPhone?: string;
}

export interface ApiCreateDriverRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string; // ISO date
  backgroundCheckStatus?: 'pending' | 'approved' | 'rejected';
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    insurance: {
      provider: string;
      policyNumber: string;
      expiryDate: string;
    };
  };
  coverageAreas: string[]; // Array of zip codes
  hourlyRate?: number;
  isActive?: boolean;
}

export interface ApiCreateDriverResponse {
  driverId: number;
  invitationSent: boolean;
  onboardingUrl?: string;
  backgroundCheckInitiated: boolean;
}

export interface ApiAcceptInvitationRequest {
  invitationToken: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  phoneVerificationCode?: string;
}

export interface ApiAcceptInvitationResponse {
  driverId: number;
  accountActivated: boolean;
  loginUrl: string;
  requiresPhoneVerification: boolean;
}

export interface ApiDriverProfileRequest {
  driverId: number;
}

export interface ApiDriverProfileResponse {
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    licenseNumber: string;
    licenseState: string;
    licenseExpiry: string;
    isActive: boolean;
    rating?: number;
    completedJobs: number;
    joinDate: string;
    backgroundCheckStatus: string;
    stripeAccountId?: string;
    payoutEnabled: boolean;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    insurance: {
      provider: string;
      policyNumber: string;
      expiryDate: string;
    };
  };
  coverageAreas: string[];
  earnings: {
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
}

export interface ApiUpdateDriverVehicleRequest {
  driverId: number;
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    insurance: {
      provider: string;
      policyNumber: string;
      expiryDate: string;
    };
  };
}

export interface ApiUpdateDriverVehicleResponse {
  driverId: number;
  vehicleUpdated: boolean;
  requiresVerification: boolean;
}

export interface ApiDriverAvailabilityRequest {
  driverId: number;
  date?: string; // ISO date, defaults to today
  timeZone?: string;
}

export interface ApiDriverAvailabilityResponse {
  driverId: number;
  date: string;
  available: boolean;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    bookedAppointment?: number;
  }>;
  totalHours: number;
  bookedHours: number;
}

export interface ApiUpdateDriverAvailabilityRequest {
  driverId: number;
  date: string; // ISO date
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

export interface ApiUpdateDriverAvailabilityResponse {
  driverId: number;
  date: string;
  updated: boolean;
  conflictingAppointments?: number[];
}

export interface ApiDriverAppointmentsRequest {
  driverId: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: string[];
  page?: number;
  limit?: number;
}

export interface ApiDriverAppointmentsResponse {
  appointments: Array<{
    id: number;
    jobCode: string;
    appointmentType: string;
    date: string;
    time: string;
    address: string;
    status: string;
    customerName: string;
    estimatedDuration: number;
    actualDuration?: number;
    earnings?: number;
  }>;
  pagination: PaginationMeta;
}

// ===== MOVING PARTNERS DOMAIN TYPES =====

export interface ApiCreateMovingPartnerRequest {
  businessName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phoneNumber: string;
  businessAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  licenseNumber?: string;
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    expiryDate: string; // ISO date
    coverageAmount: number;
  };
  serviceAreas: string[]; // Array of zip codes
  hourlyRate: number;
  minimumHours?: number;
  specialties?: string[]; // e.g., ["piano_moving", "antiques", "commercial"]
  equipmentAvailable?: string[];
  isActive?: boolean;
}

export interface ApiCreateMovingPartnerResponse {
  partnerId: number;
  invitationSent: boolean;
  onboardingUrl?: string;
  contractSent: boolean;
}

export interface ApiAssignMovingPartnerRequest {
  appointmentId: number;
  partnerId?: number; // If not provided, auto-assign
  preferredDate?: string;
  preferredTime?: string;
  specialRequirements?: string[];
  estimatedHours?: number;
  hourlyRate?: number;
  autoAssign?: boolean;
}

export interface ApiAssignMovingPartnerResponse {
  appointmentId: number;
  partnerId: number;
  partnerName: string;
  assignmentDate: string;
  estimatedStartTime: string;
  hourlyRate: number;
  estimatedCost: number;
  contactPhone: string;
}

export interface ApiMovingPartnerProfileRequest {
  partnerId: number;
}

export interface ApiMovingPartnerProfileResponse {
  partner: {
    id: number;
    businessName: string;
    contactFirstName: string;
    contactLastName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    rating?: number;
    completedJobs: number;
    joinDate: string;
    hourlyRate: number;
    minimumHours?: number;
  };
  businessAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  licenseNumber?: string;
  insuranceInfo: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
    coverageAmount: number;
  };
  serviceAreas: string[];
  specialties?: string[];
  equipmentAvailable?: string[];
  earnings: {
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
}

export interface ApiMovingPartnerAvailabilityRequest {
  partnerId: number;
  date?: string; // ISO date, defaults to today
  timeZone?: string;
}

export interface ApiMovingPartnerAvailabilityResponse {
  partnerId: number;
  date: string;
  available: boolean;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
    bookedAppointment?: number;
    minimumHours?: number;
  }>;
  totalHours: number;
  bookedHours: number;
}

export interface ApiMovingPartnerAppointmentsRequest {
  partnerId: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: string[];
  page?: number;
  limit?: number;
}

export interface ApiMovingPartnerAppointmentsResponse {
  appointments: Array<{
    id: number;
    jobCode: string;
    appointmentType: string;
    date: string;
    time: string;
    address: string;
    status: string;
    customerName: string;
    estimatedHours: number;
    actualHours?: number;
    hourlyRate: number;
    totalEarnings?: number;
  }>;
  pagination: PaginationMeta;
}

export interface ApiUpdateMovingPartnerBlockedDatesRequest {
  partnerId: number;
  blockedDates: Array<{
    date: string; // ISO date
    reason?: string;
    allDay: boolean;
    timeSlots?: Array<{
      startTime: string;
      endTime: string;
    }>;
  }>;
}

export interface ApiUpdateMovingPartnerBlockedDatesResponse {
  partnerId: number;
  blockedDatesUpdated: boolean;
  conflictingAppointments?: number[];
}

// ===== CUSTOMERS DOMAIN TYPES =====

export interface ApiCreateCustomerAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  marketingOptIn?: boolean;
  referralCode?: string;
}

export interface ApiCreateCustomerAccountResponse {
  customerId: number;
  accountCreated: boolean;
  verificationEmailSent: boolean;
  welcomePackageSent: boolean;
}

export interface ApiCustomerProfileRequest {
  customerId: number;
}

export interface ApiCustomerProfileResponse {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    joinDate: string;
    totalSpent: number;
    appointmentsCount: number;
    loyaltyPoints?: number;
  };
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  preferences: {
    marketingOptIn: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    preferredContactMethod: string;
  };
  paymentMethods: Array<{
    id: string;
    type: string;
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>;
}

export interface ApiUpdateCustomerProfileRequest {
  customerId: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  preferences?: {
    marketingOptIn?: boolean;
    smsNotifications?: boolean;
    emailNotifications?: boolean;
    preferredContactMethod?: string;
  };
}

export interface ApiUpdateCustomerProfileResponse {
  customerId: number;
  profileUpdated: boolean;
  changes: string[];
  requiresVerification?: string[]; // e.g., ["email", "phone"]
}

export interface ApiCustomerAppointmentsRequest {
  customerId: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  status?: string[];
  page?: number;
  limit?: number;
}

export interface ApiCustomerAppointmentsResponse {
  appointments: Array<{
    id: number;
    jobCode: string;
    appointmentType: string;
    date: string;
    time: string;
    address: string;
    status: string;
    quotedPrice: number;
    actualPrice?: number;
    trackingUrl?: string;
    canCancel: boolean;
    canReschedule: boolean;
  }>;
  pagination: PaginationMeta;
  summary: {
    upcoming: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  };
}

// ===== ADMIN DOMAIN TYPES =====

export interface ApiAdminDashboardStatsRequest {
  period: 'today' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string; // ISO date for custom period
  endDate?: string; // ISO date for custom period
}

export interface ApiAdminDashboardStatsResponse {
  period: string;
  appointments: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    churnRate: number;
  };
  drivers: {
    total: number;
    active: number;
    onDuty: number;
    averageRating: number;
  };
  movingPartners: {
    total: number;
    active: number;
    averageRating: number;
    totalEarnings: number;
  };
  operations: {
    storageUnitsOccupied: number;
    storageUnitsAvailable: number;
    packingSupplyOrders: number;
    onfleetTasksActive: number;
  };
}

export interface ApiAdminTasksRequest {
  category?: 'storage' | 'feedback' | 'cleaning' | 'access' | 'prep_delivery';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number; // admin user ID
  page?: number;
  limit?: number;
  sortBy?: 'created_date' | 'due_date' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiAdminTasksResponse {
  tasks: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo?: {
      id: number;
      name: string;
    };
    createdAt: string;
    dueDate?: string;
    completedAt?: string;
    relatedAppointment?: number;
    relatedCustomer?: number;
  }>;
  pagination: PaginationMeta;
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export interface ApiAdminTaskDetailsRequest {
  taskId: string;
}

export interface ApiAdminTaskDetailsResponse {
  task: {
    id: string;
    category: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo?: {
      id: number;
      name: string;
      email: string;
    };
    createdBy: {
      id: number;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
    estimatedDuration?: number; // minutes
    actualDuration?: number; // minutes
    tags?: string[];
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
      uploadedAt: string;
    }>;
  };
  relatedData?: {
    appointment?: {
      id: number;
      jobCode: string;
      customerName: string;
      date: string;
      status: string;
    };
    customer?: {
      id: number;
      name: string;
      email: string;
      phoneNumber: string;
    };
    storageUnits?: Array<{
      id: number;
      unitNumber: string;
      status: string;
    }>;
  };
  comments: Array<{
    id: number;
    content: string;
    author: {
      id: number;
      name: string;
    };
    createdAt: string;
    attachments?: Array<{
      id: string;
      filename: string;
      url: string;
    }>;
  }>;
}

export interface ApiUpdateAdminTaskRequest {
  taskId: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number; // admin user ID
  dueDate?: string; // ISO date
  description?: string;
  tags?: string[];
  comment?: string; // Add a comment with the update
}

export interface ApiUpdateAdminTaskResponse {
  taskId: string;
  updated: boolean;
  changes: string[];
  newStatus: string;
  commentAdded: boolean;
}

export interface ApiAdminReportsRequest {
  reportType:
    | 'revenue'
    | 'appointments'
    | 'customers'
    | 'drivers'
    | 'moving_partners'
    | 'operations';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string; // ISO date
  endDate: string; // ISO date
  filters?: {
    zipCodes?: string[];
    appointmentTypes?: string[];
    customerSegments?: string[];
  };
  format?: 'json' | 'csv' | 'pdf';
}

export interface ApiAdminReportsResponse {
  reportId: string;
  reportType: string;
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: unknown; // Report-specific data structure
  downloadUrl?: string; // For CSV/PDF formats
  generatedAt: string;
  expiresAt?: string; // For download links
}

// ===== API ENDPOINT CONSTANTS =====

export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/api/auth/login-email',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_SESSION: '/api/auth/session',
  AUTH_SEND_CODE: '/api/auth/send-code',
  AUTH_VERIFY_CODE: '/api/auth/verify-code',
  AUTH_DRIVER_PHONE_VERIFY: '/api/auth/driver-phone-number-verify',

  // Payments (Stripe)
  PAYMENTS_CREATE_CUSTOMER: '/api/payments/create-customer',
  PAYMENTS_CREATE_INTENT: '/api/payments/create-payment-intent',
  PAYMENTS_STRIPE_WEBHOOK: '/api/payments/stripe-webhook',
  PAYMENTS_CONNECT_ACCOUNT: '/api/payments/connect-account',
  PAYMENTS_ADD_METHOD: '/api/payments/add-payment-method',
  PAYMENTS_REMOVE_METHOD: '/api/payments/remove-payment-method',
  PAYMENTS_HISTORY: '/api/payments/get-payment-history',

  // Orders
  ORDERS_APPOINTMENTS_CREATE: '/api/orders/appointments/create',
  ORDERS_APPOINTMENTS_EDIT: '/api/orders/appointments/[appointmentId]/edit',
  ORDERS_APPOINTMENTS_CANCEL: '/api/orders/appointments/[appointmentId]/cancel',
  ORDERS_PACKING_SUPPLIES_CREATE: '/api/orders/packing-supplies/create-order',
  ORDERS_PACKING_SUPPLIES_UPDATE:
    '/api/orders/packing-supplies/[orderId]/update',
  ORDERS_PACKING_SUPPLIES_CANCEL:
    '/api/orders/packing-supplies/[orderId]/cancel',

  // Onfleet
  ONFLEET_CREATE_TASK: '/api/onfleet/tasks/create',
  ONFLEET_UPDATE_TASK: '/api/onfleet/tasks/[taskId]/update',
  ONFLEET_WEBHOOK: '/api/onfleet/webhook',
  ONFLEET_WORKERS: '/api/onfleet/workers',
  ONFLEET_CALCULATE_PAYOUT: '/api/onfleet/calculate-payout',
  ONFLEET_DISPATCH_TEAM: '/api/onfleet/dispatch-team',

  // Drivers
  DRIVERS_ASSIGN: '/api/drivers/assign',
  DRIVERS_CREATE: '/api/drivers/create-driver',
  DRIVERS_ACCEPT_INVITATION: '/api/drivers/accept-invitation',
  DRIVERS_PROFILE: '/api/drivers/[id]/profile',
  DRIVERS_VEHICLE: '/api/drivers/[id]/vehicle',
  DRIVERS_AVAILABILITY: '/api/drivers/[id]/availability',
  DRIVERS_APPOINTMENTS: '/api/drivers/[id]/appointments',

  // Moving Partners
  MOVING_PARTNERS_CREATE: '/api/moving-partners/create-partner',
  MOVING_PARTNERS_ASSIGN: '/api/moving-partners/assign-partner',
  MOVING_PARTNERS_PROFILE: '/api/moving-partners/[partnerId]',
  MOVING_PARTNERS_AVAILABILITY: '/api/moving-partners/[partnerId]/availability',
  MOVING_PARTNERS_APPOINTMENTS: '/api/moving-partners/[partnerId]/appointments',
  MOVING_PARTNERS_BLOCKED_DATES:
    '/api/moving-partners/[partnerId]/blocked-dates',

  // Customers
  CUSTOMERS_CREATE: '/api/customers/create-customer',
  CUSTOMERS_PROFILE: '/api/customers/[customerId]/profile',
  CUSTOMERS_APPOINTMENTS: '/api/customers/[customerId]/appointments',

  // Admin
  ADMIN_DASHBOARD_STATS: '/api/admin/dashboard-stats',
  ADMIN_TASKS: '/api/admin/tasks',
  ADMIN_TASK_DETAILS: '/api/admin/tasks/[taskId]',
  ADMIN_REPORTS: '/api/admin/reports',
} as const;

// ===== UTILITY TYPES =====

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

// Helper type for API responses with data
export type ApiSuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
};

// Helper type for API error responses
export type ApiErrorResponse = ApiResponse<never> & {
  success: false;
  error: ApiError;
};

// Union type for all possible API responses
export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Generic pagination request
export interface ApiPaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Generic search request
export interface ApiSearchRequest extends ApiPaginationRequest {
  query?: string;
  filters?: Record<string, unknown>;
}

// @REFACTOR-P9-LEGACY: Remove backward compatibility type aliases once migration is complete
// Priority: Low | Est: 15min | Dependencies: All phases complete
// Legacy type aliases temporarily removed due to missing domain record types
