/**
 * @fileoverview Centralized exports for all utility functions
 * @refactor Single source of truth for importing utilities across the app
 */

// Phone utilities
export {
  normalizePhoneNumberToE164,
  formatPhoneNumberForDisplay,
  isValidPhoneNumber,
} from './phoneUtils';

// Date utilities  
export {
  formatDateForInput,
  formatDateForDisplay,
  formatDateCompact,
  formatDateTime,
  formatTime,
  formatTimestamp,
  parseAppointmentTime,
  formatTimeMinusOneHour,
  getUnitSpecificStartTime,
  calculateDeliveryWindow,
} from './dateUtils';

// Currency utilities
export { formatCurrency, centsToDollars } from './currencyUtils';

// Validation utilities
export {
  isValidEmail,
  isValidEmailStrict,
  isValidURL,
  isValidYear,
  isRequired,
  validateField,
  validateForm,
} from './validationUtils';

// Format utilities
export { generateJobCode, generateVerificationCode } from './formatUtils';

// Status utilities
export { StatusColors, getStatusBadgeClass } from './statusUtils';

// Business utilities
export {
  parseLoadingHelpPrice,
  calculateMonthlyStorageCost,
  isInServiceArea,
  getServiceAreaForZip,
} from './businessUtils';

// Cancellation utilities
export {
  generateDriverToken,
  generateCustomerMoverChangeToken,
  findAvailableDrivers,
  notifyDriverReassignment,
  notifyCustomerMoverChange,
  recordDriverCancellation,
  recordMoverCancellation,
  type DriverCancellationData,
  type MoverCancellationData,
  type AvailableDriver,
} from './cancellationUtils';

// Appointment utilities
export {
  generateDriverReconfirmToken,
  calculateAppointmentChanges,
  formatAppointmentDateForSms,
  formatAppointmentTime,
  validateMovingPartnerAvailability,
  getDayOfWeekForAvailability,
  calculateFinalUnitCount,
  getUnitNumbersToRemove,
  validateAppointmentDateTime,
  generateDriverWebViewUrl,
  type AppointmentChanges,
  type DriverReconfirmToken,
} from './appointmentUtils';

// Quote utilities
export {
  processQuoteDataForTemplate,
  validateQuoteEmailData,
  type QuoteEmailData,
  type QuoteTemplateVariables,
} from './quoteUtils';

// Availability utilities
export {
  calculateDriverRequirements,
  getDayOfWeekString,
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
  DEFAULT_BUSINESS_HOURS,
} from './availabilityUtils';

export * from './packingSupplyUtils';
export * from './storageUtils';
export * from './moverChangeUtils';
