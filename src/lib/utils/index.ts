/**
 * @fileoverview Central utility exports for boombox-11.0
 * Organized by domain and functionality for clean imports
 */

// Core utility functions
export * from './cn';
export * from './phoneUtils';
export * from './currencyUtils';
export * from './navigationUtils';
export * from './emailUtils';

// Notification utilities
export * from './notificationUtils';
export * from './validationUtils';
export * from './formatUtils';
export * from './statusUtils';

// Blog utilities
export * from './blogUtils';

// Explicit exports to resolve conflicts
export {
  calculateMonthlyStorageCost,
  isInServiceArea,
  getServiceAreaForZip,
} from './businessUtils';

export {
  formatDateForInput,
  formatDateForDisplay,
  formatDateCompact,
  formatDateTime,
  formatTime,
  formatTime24Hour,
  formatTimestamp,
  parseAppointmentTime,
  calculateDeliveryWindow,
  getUnitSpecificStartTime,
  formatVerboseDate,
  addDateSuffix,
} from './dateUtils';

// NOTE: cancellationUtils contains server-side code (MessageService) and should
// only be imported directly in API routes and Server Components, not exported here
// to avoid bundling Node.js modules in client code
// export {
//   generateDriverToken,
//   generateCustomerMoverChangeToken,
//   notifyDriverReassignment,
//   notifyCustomerMoverChange,
//   recordDriverCancellation,
//   recordMoverCancellation,
//   type DriverCancellationData,
//   type MoverCancellationData,
//   type AvailableDriver,
// } from './cancellationUtils';

// Domain-specific utilities (avoiding conflicts)
// Note: appointmentUtils contains parseLoadingHelpPrice which conflicts with pricingUtils
// Using pricingUtils version for parseLoadingHelpPrice
export {
  formatAppointmentTime,
  formatAppointmentDateForSms,
  formatTimeMinusOneHour,
  validateAppointmentDateTimeFormat,
  calculateAppointmentChanges,
  calculateFinalUnitCount,
  getUnitNumbersToRemove,
  getDayOfWeekForAvailability,
  validateMovingPartnerAvailability,
  generateDriverReconfirmToken,
  generateDriverWebViewUrl,
  formatDriverInfo,
  verifyTrackingToken,
  // parseLoadingHelpPrice - using pricingUtils version
} from './appointmentUtils';

// Explicit exports from availabilityUtils to avoid conflicts
export {
  DEFAULT_BUSINESS_HOURS,
  calculateDriverRequirements,
  formatTimeLocal,
  generateBusinessHourSlots,
  hasTimeConflict,
  isResourceAvailableInSlot,
  createTimeConflict,
  checkOnfleetTaskConflicts,
  determineAvailabilityLevel,
  getDistinctDaysOfWeekInMonth,
  groupBy,
  isDateInPast,
  generateCacheKey,
  getMinutesDifference,
  isValidTimeSlot,
  timeStringToMinutes,
  // getDayOfWeekString - conflicts with dateFormattingUtils, using that version
} from './availabilityUtils';

// NOTE: moverChangeUtils contains server-side code (Onfleet) and should
// only be imported directly in API routes and Server Components
// export * from './moverChangeUtils';

// NOTE: movingPartnerUtils contains server-side code (Cloudinary) and should
// only be imported directly in API routes and Server Components

// Moving Partner Client-Safe Utilities (safe for client components)
export {
  EMPLOYEE_COUNT_MAP,
  convertEmployeeCountToNumber,
  parseTimeToMinutes,
  getDayOfWeekString,
} from './movingPartnerClientUtils';

// Explicit exports from movingPartnerUtils to avoid conflicts
// export {
//   createDefaultMoverAvailability,
//   parseTimeToMinutes,
//   checkMoverExists,
//   createMover,
//   findAvailableMovingPartners,
//   uploadFileToCloudinary,
//   deleteOldCloudinaryFile,
//   getMovingPartnerJobs,
//   assignMovingPartnerDriver,
//   // getDayOfWeekString - conflicts with other modules, already exported from dateFormattingUtils
// } from './movingPartnerUtils';

// Messaging and communication utilities
export * from './messageClassificationUtils';
export * from './inboundMessageUtils';

// NOTE: twilioUtils contains server-side code (next/headers) and MUST NOT be exported here
// to avoid bundling server-only APIs in client components.
// Import directly from './twilioUtils' in API routes and Server Components only:
// import { validateTwilioRequest, generateSmsResponseToken, generateMoverChangeToken } from '@/lib/utils/twilioUtils';
// Note: dateFormattingUtils contains formatAppointmentTime which conflicts with appointmentUtils
// Using appointmentUtils version for appointment-specific formatting
// export * from './dateFormattingUtils';
// Explicit export of non-conflicting functions from dateFormattingUtils
export { formatAppointmentDate } from './dateFormattingUtils';

// NOTE: driverUtils contains server-side code (Cloudinary) and should
// only be imported directly in API routes and Server Components
// Driver utilities (explicit exports to avoid conflicts)
// export {
//   getDriverTeamIds,
//   createDefaultDriverAvailability,
//   formatPhoneForOnfleet,
//   mapVehicleTypeToOnfleet,
//   buildOnfleetWorkerPayload,
//   validateDriverUniqueness,
//   findDriverInvitation,
//   validateInvitationStatus,
//   DEFAULT_DRIVER_SERVICES,
//   DEFAULT_MOVING_PARTNER_VEHICLE_TYPE,
//   DEFAULT_DRIVER_CAPACITY,
//   DRIVER_STATUSES,
//   type DriverRegistrationData,
//   type OnfleetWorkerPayload,
//   type DriverApprovalResult,
// } from './driverUtils';

// Pricing utilities (explicit exports to avoid conflicts)
export {
  getBoomboxPriceByZipCode,
  formatStorageUnitPrice,
  formatInsurancePrice,
  parseLoadingHelpPrice, // Using pricingUtils version as canonical
} from './pricingUtils';

// Storage utilities (explicit exports)
export { getStorageUnitText } from './storageUtils';

// Sorting and pagination utilities
export * from './sortingUtils';

// Tracking utilities
export * from './trackingStatusUtils';

// Bin packing utilities for storage calculator
export * from './binPackingUtils';
