/**
 * @fileoverview Main types index - Re-exports all domain types
 * @source Consolidated from multiple boombox-10.0 type files
 * @refactor Organized into domain-based structure for better maintainability
 */

// Database and Prisma types
export * from './database.types';

// API request/response types
export * from './api.types';

// Business domain types
export * from './user.types';
export * from './appointment.types';
export * from './packingSupply.types';

// Storage types (explicit re-export to avoid conflicts with appointment.types)
export type {
  StorageUnit,
  StorageUnitUsage,
  FormattedStorageUnit,
  StorageUnitStatus,
  AccessRequestStatus,
  StorageAccessRequest,
  StorageAccessAppointment,
  StorageUnitCleaning,
  CleaningTask,
  StorageUnitDamageReport,
  StorageInventoryItem,
  StorageInventorySnapshot,
  WarehouseLocation,
  StorageUnitAllocation,
  StorageUtilizationMetrics,
  StorageRevenueMetrics,
  CreateStorageAccessRequest,
  UpdateStorageUnitRequest,
  StorageUnitSearchFilters,
  StorageUnitSearchResult,
  StorageUnitWithDetails,
  StorageAccessRequestWithDetails,
  StorageUnitCapacity,
  StorageUnitDimensions,
} from './storage.types';
export * from './driver.types';
export * from './movingPartner.types';
export * from './notification.types';

// External integration types
export * from './onfleet.types';
export * from './stripe.types';

// Common utility types (explicit re-export to avoid TimeSlot conflict with appointment.types)
export type {
  ID,
  PaginationParams,
  PaginationResponse,
  SortParams,
  SearchParams,
  DateRange,
  TimeRange,
  DateTimeRange,
  DayOfWeek,
  Address,
  Coordinates,
  LocationWithCoordinates,
  ContactInfo,
  ExtendedContactInfo,
  FileUpload,
  ImageFile,
  DocumentFile,
  GenericStatus,
  ProcessingStatus,
  ApprovalStatus,
  Priority,
  ValidationError,
  ValidationResult,
  ApiError,
  AuditTrail,
  Timestamped,
  SoftDeletable,
  Trackable,
  NotificationChannel,
  NotificationPreferences,
  BaseNotification,
  Rating,
  AggregateRating,
  Money,
  PriceRange,
  TaxInfo,
  AppConfig,
  FeatureFlag,
  CreateRequest,
  UpdateRequest,
  DeleteRequest,
  BulkOperation,
  BulkOperationResult,
  Optional,
  RequiredFields,
  Nullable,
  DeepPartial,
  SuccessResponse,
  ErrorResponse,
  ApiResponse,
  PaginatedResponse,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
  isValidEmail,
  isValidPhoneNumber,
  isValidZipCode,
} from './common.types';
