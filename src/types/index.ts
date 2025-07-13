// Export all type definitions for clean imports across the application

// API types and validation schemas (TYPES_002 completed)
export * from './api.types';

// Core domain types (TYPES_001 completed)
export * from './common.types';
export * from './user.types';
export * from './database.types';

// Domain-specific types (selective exports to avoid API conflicts)
export type {
  // Core appointment types (non-conflicting)
  AppointmentStatus,
  AppointmentType,
  Appointment,
  AppointmentWithDetails,
} from './appointment.types';

export type {
  // Core storage types
  StorageUnit,
} from './storage.types';

// Integration types (non-conflicting)
export * from './stripe.types';
export * from './driver.types';
export * from './movingPartner.types';
export * from './notification.types';

// Note: Some domain types have naming conflicts with API types
// Import them directly from their respective files when needed:
// - './appointment.types' for detailed appointment interfaces
// - './packingSupply.types' for packing supply domain types
// - './storage.types' for detailed storage interfaces
// - './onfleet.types' for Onfleet-specific types
