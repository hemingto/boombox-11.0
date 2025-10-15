// Export all type definitions for clean imports across the application

// API types and validation schemas (TYPES_002 completed)
export * from './api.types';

// Core domain types (TYPES_001 completed)
export * from './common.types';
export * from './user.types';
export * from './database.types';

// Domain-specific types (now with domain prefixing - no conflicts)
export * from './appointment.types';
export * from './packingSupply.types';
export * from './storage.types';
export * from './onfleet.types';
export * from './stripe.types';
export * from './driver.types';
export * from './movingPartner.types';
export * from './notification.types';
export * from './insurance';

// GetQuote flow types (TASK_004 completed)
export * from './getQuote.types';

// Note: With domain prefixing implemented, all types can be safely exported
// - API types: Prefixed with "Api" (e.g., ApiCreateAppointmentRequest)
// - Domain types: Prefixed with domain name (e.g., AppointmentDomainCreateRequest)
// - Legacy exports maintained for backward compatibility
