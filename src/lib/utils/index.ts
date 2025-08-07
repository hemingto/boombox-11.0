/**
 * @fileoverview Central utility exports for boombox-11.0
 * Organized by domain and functionality for clean imports
 */

// Core utility functions
export * from './phoneUtils';
export * from './currencyUtils';

// Notification utilities
export * from './notificationUtils';
export * from './validationUtils';
export * from './formatUtils';
export * from './statusUtils';

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
} from './dateUtils';

export {
  generateDriverToken,
  generateCustomerMoverChangeToken,
  notifyDriverReassignment,
  notifyCustomerMoverChange,
  recordDriverCancellation,
  recordMoverCancellation,
  type DriverCancellationData,
  type MoverCancellationData,
  type AvailableDriver,
} from './cancellationUtils';

// Domain-specific utilities (avoiding conflicts)
// Note: appointmentUtils contains formatAppointmentTime which conflicts with dateFormattingUtils
// Using appointmentUtils version for appointment-specific formatting
export * from './appointmentUtils';

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

export * from './moverChangeUtils';

// Explicit exports from movingPartnerUtils to avoid conflicts
export {
  createDefaultMoverAvailability,
  parseTimeToMinutes,
  checkMoverExists,
  createMover,
  findAvailableMovingPartners,
  uploadFileToCloudinary,
  deleteOldCloudinaryFile,
  getMovingPartnerJobs,
  assignMovingPartnerDriver,
  // getDayOfWeekString - conflicts with other modules, already exported from dateFormattingUtils
} from './movingPartnerUtils';

// Messaging and communication utilities
export * from './twilioUtils';
export * from './messageClassificationUtils';
export * from './inboundMessageUtils';
// Note: dateFormattingUtils contains formatAppointmentTime which conflicts with appointmentUtils
// Using appointmentUtils version for appointment-specific formatting
// export * from './dateFormattingUtils';
// Explicit export of non-conflicting functions from dateFormattingUtils
export { formatAppointmentDate } from './dateFormattingUtils';

// Driver utilities (explicit exports to avoid conflicts)
export {
  getDriverTeamIds,
  createDefaultDriverAvailability,
  formatPhoneForOnfleet,
  mapVehicleTypeToOnfleet,
  buildOnfleetWorkerPayload,
  validateDriverUniqueness,
  findDriverInvitation,
  validateInvitationStatus,
  DEFAULT_DRIVER_SERVICES,
  DEFAULT_MOVING_PARTNER_VEHICLE_TYPE,
  DEFAULT_DRIVER_CAPACITY,
  DRIVER_STATUSES,
  type DriverRegistrationData,
  type OnfleetWorkerPayload,
  type DriverApprovalResult,
} from './driverUtils';
