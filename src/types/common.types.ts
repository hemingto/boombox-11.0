/**
 * @fileoverview Common utility types shared across the application
 * @source Various boombox-10.0 files with shared patterns
 * @refactor Centralized common types for better reusability
 */

// ===== GENERIC UTILITY TYPES =====

export type CommonID = string | number;

export interface CommonPaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface CommonPaginationResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CommonSortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CommonSearchParams extends CommonPaginationParams {
  query?: string;
  sort?: CommonSortParams;
  filters?: Record<string, unknown>;
}

// ===== DATE & TIME TYPES =====

export interface CommonDateRange {
  start: Date;
  end: Date;
}

export interface CommonTimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface CommonDateTimeRange {
  start: Date;
  end: Date;
}

export type CommonTimeSlot = 'morning' | 'afternoon' | 'evening';
export type CommonDayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ===== LOCATION & ADDRESS TYPES =====

export interface CommonAddress {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CommonCoordinates {
  latitude: number;
  longitude: number;
}

export interface CommonLocationWithCoordinates extends CommonAddress {
  coordinates?: CommonCoordinates;
}

// ===== CONTACT INFORMATION TYPES =====

export interface CommonContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface CommonExtendedContactInfo extends CommonContactInfo {
  company?: string;
  title?: string;
  alternatePhone?: string;
  preferredContactMethod: 'email' | 'phone' | 'text';
}

// ===== FILE & MEDIA TYPES =====

export interface CommonFileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  uploadedAt: Date;
  uploadedBy?: number;
}

export interface CommonImageFile extends CommonFileUpload {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  altText?: string;
}

export interface CommonDocumentFile extends CommonFileUpload {
  documentType: 'pdf' | 'doc' | 'docx' | 'txt' | 'other';
  pageCount?: number;
}

// ===== STATUS & STATE TYPES =====

export type CommonGenericStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'archived';

export type CommonProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type CommonApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'under_review';

export type CommonPriority = 'low' | 'medium' | 'high' | 'urgent';

// ===== ERROR & VALIDATION TYPES =====

export interface CommonValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface CommonValidationResult {
  isValid: boolean;
  errors: CommonValidationError[];
  warnings?: CommonValidationError[];
}

export interface CommonApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

// ===== AUDIT & TRACKING TYPES =====

export interface CommonAuditTrail {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  performedBy: number;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface CommonTimestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface CommonSoftDeletable {
  deletedAt?: Date | null;
  isDeleted: boolean;
}

export interface CommonTrackable extends CommonTimestamped {
  createdBy?: number;
  updatedBy?: number;
}

// ===== NOTIFICATION TYPES =====

export type CommonNotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface CommonNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface CommonBaseNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: CommonPriority;
  channels: CommonNotificationChannel[];
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
}

// ===== RATING & FEEDBACK TYPES =====

export interface CommonRating {
  value: number; // 1-5
  maxValue: number;
  comment?: string;
  ratedBy: number;
  ratedAt: Date;
}

export interface CommonAggregateRating {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ===== FINANCIAL TYPES =====

export interface CommonMoney {
  amount: number;
  currency: string; // ISO 4217 currency code
}

export interface CommonPriceRange {
  min: CommonMoney;
  max: CommonMoney;
}

export interface CommonTaxInfo {
  rate: number; // percentage
  amount: CommonMoney;
  type: 'sales' | 'vat' | 'service' | 'other';
  description?: string;
}

// ===== CONFIGURATION TYPES =====

export interface CommonAppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  urls: Record<string, string>;
}

export interface CommonFeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
}

// ===== GENERIC CRUD TYPES =====

export interface CommonCreateRequest<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface CommonUpdateRequest<T> {
  id: CommonID;
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface CommonDeleteRequest {
  id: CommonID;
  soft?: boolean;
}

export interface CommonBulkOperation<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
}

export interface CommonBulkOperationResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ===== TYPE UTILITIES =====

export type CommonOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
export type CommonRequiredFields<T, K extends keyof T> = T &
  Required<Pick<T, K>>;
export type CommonNullable<T> = T | null;
export type CommonDeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? CommonDeepPartial<T[P]> : T[P];
};

// ===== RESPONSE WRAPPER TYPES =====

export interface CommonSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface CommonErrorResponse {
  success: false;
  error: CommonApiError;
  message: string;
}

export type CommonApiResponse<T = unknown> =
  | CommonSuccessResponse<T>
  | CommonErrorResponse;

export interface CommonPaginatedResponse<T = unknown>
  extends CommonSuccessResponse<T[]> {
  pagination: CommonPaginationResponse;
}

// ===== TYPE GUARDS =====

export function CommonIsSuccessResponse<T>(
  response: CommonApiResponse<T>
): response is CommonSuccessResponse<T> {
  return response.success === true;
}

export function CommonIsErrorResponse(
  response: CommonApiResponse
): response is CommonErrorResponse {
  return response.success === false;
}

export function CommonIsPaginatedResponse<T>(
  response: CommonApiResponse<T[] | T>
): response is CommonPaginatedResponse<T> {
  return CommonIsSuccessResponse(response) && 'pagination' in response;
}

export function CommonIsValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function CommonIsValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function CommonIsValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}
