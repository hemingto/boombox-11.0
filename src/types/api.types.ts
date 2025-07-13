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
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
  version?: string;
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

export interface LoginRequest {
  email: string;
  password?: string; // Optional for magic link login
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
  };
  session?: {
    token: string;
    expiresAt: string;
  };
  redirectUrl?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: 'customer' | 'driver' | 'mover';
}

export interface SignupResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  verificationRequired: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  type: 'email_verification' | 'phone_verification' | 'password_reset';
}

export interface VerifyCodeResponse {
  verified: boolean;
  token?: string;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ===== PAYMENT DOMAIN TYPES =====

export interface CreateStripeCustomerRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  paymentMethodId: string;
}

export interface CreateStripeCustomerResponse {
  customerId: string;
  setupIntentClientSecret: string;
  message: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  customerId: string;
  appointmentId?: number;
  orderId?: number;
  description?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface StripeWebhookRequest {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  id: string;
  created: number;
}

export interface PaymentMethodRequest {
  customerId: string;
  paymentMethodId: string;
}

export interface PaymentHistoryResponse {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    description?: string;
    appointmentId?: number;
  }>;
  total: number;
}

// ===== ORDERS DOMAIN TYPES =====

export interface CreateAppointmentRequest {
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

export interface CreateAppointmentResponse {
  appointment: {
    id: number;
    jobCode: string;
    appointmentType: string;
    date: string;
    time: string;
    status: string;
  };
  onfleetTasks?: Array<{
    id: string;
    shortId: string;
    state: number;
  }>;
}

export interface EditAppointmentRequest {
  appointmentId: number;
  date?: string;
  time?: string;
  address?: string;
  specialInstructions?: string;
  notifyDriver?: boolean;
}

export interface CancelAppointmentRequest {
  appointmentId: number;
  reason: string;
  refundRequested?: boolean;
}

export interface CreatePackingSupplyOrderRequest {
  customerId: number;
  items: Array<{
    itemId: number;
    quantity: number;
  }>;
  deliveryAddress: string;
  deliveryZipCode: string;
  deliveryDate: string;
  deliveryTimeWindow: string;
  specialInstructions?: string;
}

export interface CreatePackingSupplyOrderResponse {
  order: {
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    deliveryDate: string;
  };
  onfleetTask?: {
    id: string;
    shortId: string;
  };
}

export interface PackingSupplyOrderUpdate {
  orderId: number;
  status?: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';
  trackingInfo?: string;
  deliveryNotes?: string;
}

// ===== ONFLEET DOMAIN TYPES =====

export interface CreateOnfleetTaskRequest {
  appointmentId: number;
  destination: {
    address: string;
    coordinates?: [number, number];
  };
  recipients: Array<{
    name: string;
    phone: string;
    notes?: string;
  }>;
  completionWindow: {
    start: number; // Unix timestamp
    end: number; // Unix timestamp
  };
  metadata: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  notes?: string;
  autoAssign?: boolean;
}

export interface CreateOnfleetTaskResponse {
  task: {
    id: string;
    shortId: string;
    state: number;
    worker?: string;
    estimatedArrivalTime?: number;
    estimatedCompletionTime?: number;
  };
  trackingUrl: string;
}

export interface OnfleetWebhookData {
  triggerId: number;
  triggerName: string;
  taskId: string;
  workerId?: string;
  adminId?: string;
  data: {
    task?: {
      id: string;
      shortId: string;
      state: number;
      metadata: Array<{
        name: string;
        type: string;
        value: string;
      }>;
      destination: {
        address: {
          unparsed: string;
        };
      };
      completionDetails?: {
        photoUploadIds?: string[];
        signatureUploadId?: string;
        notes?: string;
        time?: number;
      };
    };
    worker?: {
      id: string;
      name: string;
      phone: string;
      vehicle?: {
        type: string;
        licensePlate: string;
      };
    };
  };
  time: number;
}

export interface UpdateOnfleetTaskRequest {
  taskId: string;
  notes?: string;
  metadata?: Array<{
    name: string;
    type: string;
    value: string;
  }>;
  destination?: {
    address: string;
    coordinates?: [number, number];
  };
}

export interface OnfleetWorkerResponse {
  workers: Array<{
    id: string;
    name: string;
    phone: string;
    isActive: boolean;
    onDuty: boolean;
    location?: [number, number];
    vehicle?: {
      type: string;
      licensePlate: string;
    };
  }>;
}

// ===== DRIVERS DOMAIN TYPES =====

export interface DriverAssignmentRequest {
  appointmentId: number;
  onfleetTaskId?: string;
  driverId?: number;
  action: 'assign' | 'accept' | 'decline' | 'retry' | 'cancel' | 'reconfirm';
}

export interface DriverAssignmentResponse {
  success: boolean;
  assignment?: {
    driverId: number;
    appointmentId: number;
    taskId: string;
    estimatedPayment: number;
  };
  nextAction?: 'wait_for_acceptance' | 'find_new_driver' | 'notify_admin';
  message: string;
}

export interface DriverAvailabilityRequest {
  driverId: number;
  date: string;
  timeSlots: Array<{
    start: string;
    end: string;
    available: boolean;
  }>;
}

export interface DriverAvailabilityResponse {
  updated: boolean;
  conflicts?: Array<{
    appointmentId: number;
    time: string;
  }>;
}

export interface CreateDriverRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  licenseNumber: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    type: 'pickup_truck' | 'van' | 'box_truck';
  };
  coverageAreas: string[]; // ZIP codes
  hourlyRate?: number;
}

export interface DriverProfileResponse {
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    isActive: boolean;
    onfleetWorkerId?: string;
    rating: number;
    totalJobs: number;
    vehicle?: {
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      type: string;
    };
    coverageAreas: string[];
  };
  stats: {
    completedJobs: number;
    cancelledJobs: number;
    totalEarnings: number;
    averageRating: number;
  };
}

export interface DriverAcceptInvitationRequest {
  token: string;
  acceptTerms: boolean;
  additionalInfo?: {
    emergencyContact: string;
    insuranceInfo: string;
  };
}

// ===== MOVING PARTNERS DOMAIN TYPES =====

export interface CreateMovingPartnerRequest {
  name: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  serviceAreas: string[]; // ZIP codes
  vehicleTypes: string[];
  hourlyRate: number;
  minimumHours: number;
}

export interface MovingPartnerAssignmentRequest {
  appointmentId: number;
  partnerId: number;
  estimatedHours: number;
  specialRequirements?: string;
}

export interface MovingPartnerAvailabilityRequest {
  partnerId: number;
  date: string;
  available: boolean;
  blockedTimeSlots?: Array<{
    start: string;
    end: string;
    reason: string;
  }>;
}

// ===== CUSTOMERS DOMAIN TYPES =====

export interface CreateCustomerRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  zipCode: string;
  referralSource?: string;
}

export interface CustomerProfileResponse {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    zipCode: string;
    stripeCustomerId?: string;
    createdAt: string;
  };
  stats: {
    totalAppointments: number;
    activeStorageUnits: number;
    totalSpent: number;
    memberSince: string;
  };
  recentActivity: Array<{
    type: 'appointment' | 'payment' | 'storage_access';
    description: string;
    date: string;
  }>;
}

export interface UpdateCustomerProfileRequest {
  customerId: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  zipCode?: string;
  email?: string;
}

// ===== ADMIN DOMAIN TYPES =====

export interface AdminTasksResponse {
  tasks: {
    unassignedJobs: Array<{
      id: number;
      jobCode: string;
      address: string;
      date: string;
      time: string;
      customerName: string;
      movingPartner?: {
        name: string;
        phoneNumber: string;
      };
    }>;
    negativeFeedback: Array<{
      id: number;
      appointmentId: number;
      rating: number;
      comments: string;
      customerName: string;
      date: string;
    }>;
    pendingCleaning: Array<{
      id: number;
      unitNumber: string;
      location: string;
      lastAccessed: string;
      priority: 'low' | 'medium' | 'high';
    }>;
    storageUnitNeeded: Array<{
      id: number;
      appointmentId: number;
      customerName: string;
      appointmentDate: string;
      unitsRequested: number;
    }>;
    pendingLocationUpdate: Array<{
      id: number;
      unitNumber: string;
      currentLocation: string;
      requestedLocation: string;
      reason: string;
    }>;
  };
  counts: {
    unassignedJobs: number;
    negativeFeedback: number;
    pendingCleaning: number;
    storageUnitNeeded: number;
    pendingLocationUpdate: number;
  };
}

export interface AdminDashboardStatsResponse {
  today: {
    appointments: number;
    revenue: number;
    activeDrivers: number;
    completedJobs: number;
  };
  thisWeek: {
    appointments: number;
    revenue: number;
    newCustomers: number;
    driverUtilization: number;
  };
  thisMonth: {
    appointments: number;
    revenue: number;
    storageUnitsActive: number;
    customerRetention: number;
  };
  trends: {
    appointmentGrowth: number;
    revenueGrowth: number;
    customerSatisfaction: number;
  };
}

export interface AdminReportsRequest {
  reportType: 'revenue' | 'drivers' | 'customers' | 'operations';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: {
    driverId?: number;
    customerId?: number;
    zipCode?: string;
    appointmentType?: string;
  };
}

export interface TaskCompletionRequest {
  taskId: string;
  taskType: 'storage' | 'feedback' | 'cleaning' | 'access' | 'prep-delivery';
  completedBy: number; // Admin user ID
  notes?: string;
  followUpRequired?: boolean;
}

// ===== NOTIFICATION TYPES =====

export interface NotificationRequest {
  recipientId: number;
  recipientType: 'customer' | 'driver' | 'mover' | 'admin';
  type: 'sms' | 'email' | 'push';
  templateId: string;
  variables: Record<string, unknown>;
  scheduledFor?: string; // ISO datetime for scheduled notifications
}

export interface NotificationResponse {
  notificationId: string;
  status: 'sent' | 'scheduled' | 'failed';
  deliveredAt?: string;
  error?: string;
}

// ===== FEEDBACK TYPES =====

export interface SubmitFeedbackRequest {
  appointmentId?: number;
  packingSupplyOrderId?: number;
  rating: number; // 1-5
  comments?: string;
  categories: string[]; // e.g., ['timeliness', 'quality', 'communication']
  photos?: string[]; // Upload IDs
}

export interface FeedbackResponse {
  feedbackId: number;
  processed: boolean;
  followUpRequired: boolean;
  adminNotified: boolean;
}

// ===== STORAGE UNIT TYPES =====

export interface StorageUnitRequest {
  customerId: number;
  size: 'small' | 'medium' | 'large' | 'extra_large';
  location: string;
  specialRequirements?: string;
}

export interface StorageUnitResponse {
  unit: {
    id: number;
    unitNumber: string;
    size: string;
    location: string;
    status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
    assignedCustomerId?: number;
    lastAccessed?: string;
  };
}

export interface AccessStorageUnitRequest {
  customerId: number;
  storageUnitIds: number[];
  accessDate: string;
  accessTime: string;
  reason: string;
  specialInstructions?: string;
}

// ===== UTILITY TYPES =====

export interface FileUploadResponse {
  uploadId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface BulkOperationRequest<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
  validateOnly?: boolean;
}

export interface BulkOperationResponse<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
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
  DRIVERS_PROFILE: '/api/drivers/[driverId]',
  DRIVERS_VEHICLE: '/api/drivers/[driverId]/vehicle',
  DRIVERS_AVAILABILITY: '/api/drivers/[driverId]/availability',
  DRIVERS_APPOINTMENTS: '/api/drivers/[driverId]/appointments',

  // Moving Partners
  MOVING_PARTNERS_CREATE: '/api/moving-partners/create-partner',
  MOVING_PARTNERS_ASSIGN: '/api/moving-partners/assign-partner',
  MOVING_PARTNERS_AVAILABILITY: '/api/moving-partners/[partnerId]/availability',
  MOVING_PARTNERS_APPOINTMENTS: '/api/moving-partners/[partnerId]/appointments',

  // Customers
  CUSTOMERS_CREATE: '/api/customers/create-customer',
  CUSTOMERS_PROFILE: '/api/customers/[customerId]/profile',
  CUSTOMERS_APPOINTMENTS: '/api/customers/[customerId]/appointments',

  // Admin
  ADMIN_DASHBOARD_STATS: '/api/admin/dashboard-stats',
  ADMIN_TASKS: '/api/admin/tasks',
  ADMIN_TASKS_DETAIL: '/api/admin/tasks/[taskId]',
  ADMIN_REPORTS: '/api/admin/reports',
  ADMIN_DRIVERS: '/api/admin/drivers',
  ADMIN_CUSTOMERS: '/api/admin/customers',
  ADMIN_STORAGE_UNITS: '/api/admin/storage-units',
  ADMIN_FEEDBACK: '/api/admin/feedback',

  // Utility
  UPLOAD_FILE: '/api/upload',
  AVAILABILITY_CHECK: '/api/availability',
  ACCESS_STORAGE_UNIT: '/api/accessStorageUnit',
  ADD_ADDITIONAL_STORAGE: '/api/addAdditionalStorage',
  STORAGE_UNITS_BY_USER: '/api/storageUnitsByUser',
  SUBMIT_QUOTE: '/api/submitQuote',
  SEND_QUOTE_EMAIL: '/api/send-quote-email',
  UPDATE_PHONE_NUMBER: '/api/updatephonenumber',

  // Webhooks
  WEBHOOKS_ONFLEET: '/api/webhooks/onfleet',
  WEBHOOKS_STRIPE: '/api/webhooks/stripe',

  // Cron Jobs
  CRON_DAILY_DISPATCH: '/api/cron/daily-dispatch',
  CRON_PACKING_SUPPLY_PAYOUTS: '/api/cron/packing-supply-payouts',
  CRON_DRIVER_REMINDERS: '/api/cron/driver-reminders',
  CRON_CLEANUP_TASKS: '/api/cron/cleanup-tasks',

  // Testing
  TEST_ONFLEET: '/api/test-onfleet',
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

// ===== HTTP STATUS CODES =====

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ===== HELPER TYPES =====

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRouteConfig {
  method: RequestMethod;
  endpoint: string;
  requiresAuth: boolean;
  roles?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Type utility for creating success responses
export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: ResponseMeta;
};

// Type utility for creating error responses
export type ErrorResponse = {
  success: false;
  error: ApiError;
  meta?: ResponseMeta;
};

// Union type for all possible API responses
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;
