/**
 * @fileoverview Common utility types shared across the application
 * @source Various boombox-10.0 files with shared patterns
 * @refactor Centralized common types for better reusability
 */

// ===== GENERIC UTILITY TYPES =====

export type ID = string | number;

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  sort?: SortParams;
  filters?: Record<string, unknown>;
}

// ===== DATE & TIME TYPES =====

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

export interface DateTimeRange {
  start: Date;
  end: Date;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ===== LOCATION & ADDRESS TYPES =====

export interface Address {
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithCoordinates extends Address {
  coordinates?: Coordinates;
}

// ===== CONTACT INFORMATION TYPES =====

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface ExtendedContactInfo extends ContactInfo {
  company?: string;
  title?: string;
  alternatePhone?: string;
  preferredContactMethod: 'email' | 'phone' | 'text';
}

// ===== FILE & MEDIA TYPES =====

export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  uploadedAt: Date;
  uploadedBy?: number;
}

export interface ImageFile extends FileUpload {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  altText?: string;
}

export interface DocumentFile extends FileUpload {
  documentType: 'pdf' | 'doc' | 'docx' | 'txt' | 'other';
  pageCount?: number;
}

// ===== STATUS & STATE TYPES =====

export type GenericStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'archived';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'under_review';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// ===== ERROR & VALIDATION TYPES =====

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId?: string;
}

// ===== AUDIT & TRACKING TYPES =====

export interface AuditTrail {
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

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt?: Date | null;
  isDeleted: boolean;
}

export interface Trackable extends Timestamped {
  createdBy?: number;
  updatedBy?: number;
}

// ===== NOTIFICATION TYPES =====

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface BaseNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: Priority;
  channels: NotificationChannel[];
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
}

// ===== RATING & FEEDBACK TYPES =====

export interface Rating {
  value: number; // 1-5
  maxValue: number;
  comment?: string;
  ratedBy: number;
  ratedAt: Date;
}

export interface AggregateRating {
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

export interface Money {
  amount: number;
  currency: string; // ISO 4217 currency code
}

export interface PriceRange {
  min: Money;
  max: Money;
}

export interface TaxInfo {
  rate: number; // percentage
  amount: Money;
  type: 'sales' | 'vat' | 'service' | 'other';
  description?: string;
}

// ===== CONFIGURATION TYPES =====

export interface AppConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  urls: Record<string, string>;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
}

// ===== GENERIC CRUD TYPES =====

export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateRequest<T> {
  id: ID;
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
}

export interface DeleteRequest {
  id: ID;
  soft?: boolean;
}

export interface BulkOperation<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
}

export interface BulkOperationResult<T> {
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

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Nullable<T> = T | null;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ===== RESPONSE WRAPPER TYPES =====

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
  message: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export interface PaginatedResponse<T = unknown> extends SuccessResponse<T[]> {
  pagination: PaginationResponse;
}

// ===== TYPE GUARDS =====

export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

export function isErrorResponse(
  response: ApiResponse
): response is ErrorResponse {
  return response.success === false;
}

export function isPaginatedResponse<T>(
  response: ApiResponse<T[] | T>
): response is PaginatedResponse<T> {
  return isSuccessResponse(response) && 'pagination' in response;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function isValidZipCode(zipCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}
