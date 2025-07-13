/**
 * @fileoverview Standardized API request/response types
 * @source Various boombox-10.0 API route patterns
 * @refactor Standardized API interfaces for consistency
 */

// ===== STANDARD API RESPONSE TYPES =====

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: Date;
}

export type StandardApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

// ===== REQUEST VALIDATION TYPES =====

export interface RequestContext {
  userId?: number;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  timestamp: Date;
}

// ===== AUTHENTICATION API TYPES =====

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  agreedToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

// ===== SEARCH & FILTER API TYPES =====

export interface SearchRequest {
  query?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// ===== BULK OPERATION API TYPES =====

export interface BulkActionRequest<T = unknown> {
  action: string;
  items: T[];
  options?: Record<string, unknown>;
}

export interface BulkActionResponse<T = unknown> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
    code?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

// ===== FILE UPLOAD API TYPES =====

export interface FileUploadRequest {
  file: File;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface BulkFileUploadRequest {
  files: File[];
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface BulkFileUploadResponse {
  successful: FileUploadResponse[];
  failed: Array<{
    filename: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ===== WEBHOOK API TYPES =====

export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  source: string;
  data: T;
  timestamp: Date;
  signature?: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  message?: string;
  errors?: string[];
}

// ===== ANALYTICS API TYPES =====

export interface AnalyticsRequest {
  metrics: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  groupBy?: string;
  filters?: Record<string, unknown>;
}

export interface AnalyticsResponse {
  metrics: Record<string, number | string>;
  data: Array<Record<string, unknown>>;
  summary: {
    totalRecords: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    generatedAt: Date;
  };
}

// ===== NOTIFICATION API TYPES =====

export interface SendNotificationRequest {
  recipients: Array<{
    userId?: number;
    email?: string;
    phoneNumber?: string;
  }>;
  message: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  };
  channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  scheduledFor?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationResponse {
  notificationId: string;
  status: 'sent' | 'scheduled' | 'failed';
  recipients: Array<{
    recipient: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
  sentAt?: Date;
  scheduledFor?: Date;
}

// ===== EXPORT API TYPES =====

export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  data: string; // data type identifier
  filters?: Record<string, unknown>;
  columns?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportResponse {
  exportId: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: Date;
  recordCount?: number;
  fileSize?: number;
}

// ===== API RATE LIMITING TYPES =====

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RateLimitedResponse extends ApiErrorResponse {
  rateLimit: RateLimitInfo;
}

// ===== API VERSIONING TYPES =====

export interface ApiVersionInfo {
  version: string;
  deprecated: boolean;
  supportedUntil?: Date;
  migrationGuide?: string;
}

// ===== TYPE GUARDS =====

export function isApiSuccessResponse<T>(
  response: StandardApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiErrorResponse(
  response: StandardApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}

export function isRateLimitedResponse(
  response: ApiErrorResponse
): response is RateLimitedResponse {
  return 'rateLimit' in response;
}

export function isValidationErrorResponse(response: ApiErrorResponse): boolean {
  return response.error.code === 'VALIDATION_ERROR';
}

// ===== API ENDPOINT CONSTANTS =====

export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: '/api/auth/login',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',

  // Orders
  ORDERS_APPOINTMENTS: '/api/orders/appointments',
  ORDERS_PACKING_SUPPLIES: '/api/orders/packing-supplies',

  // Onfleet
  ONFLEET_TASKS: '/api/onfleet/tasks',
  ONFLEET_WORKERS: '/api/onfleet/workers',
  ONFLEET_WEBHOOK: '/api/onfleet/webhook',

  // Drivers
  DRIVERS: '/api/drivers',
  DRIVERS_AVAILABILITY: '/api/drivers/availability',
  DRIVERS_ASSIGN: '/api/drivers/assign',

  // Moving Partners
  MOVING_PARTNERS: '/api/moving-partners',
  MOVING_PARTNERS_AVAILABILITY: '/api/moving-partners/availability',

  // Customers
  CUSTOMERS: '/api/customers',
  CUSTOMERS_PROFILE: '/api/customers/profile',

  // Payments
  PAYMENTS_STRIPE: '/api/payments',
  PAYMENTS_WEBHOOK: '/api/payments/stripe-webhook',

  // Admin
  ADMIN_DASHBOARD: '/api/admin/dashboard-stats',
  ADMIN_TASKS: '/api/admin/tasks',
  ADMIN_REPORTS: '/api/admin/reports',
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
