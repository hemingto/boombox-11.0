/**
 * @fileoverview Utility functions for account setup checklist
 * @note These utilities are in a separate file from the service to avoid
 * Next.js Server Actions restrictions (non-async exports in 'use server' files)
 */

export interface MoverChecklistStatus {
  companyDescription: boolean;
  companyPicture: boolean;
  phoneVerified: boolean;
  hourlyRate: boolean;
  approvedDrivers: boolean;
  approvedVehicles: boolean;
  calendarSet: boolean;
  bankAccountLinked: boolean;
  termsOfServiceReviewed: boolean;
}

export interface DriverChecklistStatus {
  profilePicture: boolean;
  driversLicense: boolean;
  phoneVerified: boolean;
  termsOfServiceReviewed: boolean;
  approvedVehicle?: boolean;
  workSchedule?: boolean;
  bankAccountLinked?: boolean;
}

export type ChecklistStatus = MoverChecklistStatus | DriverChecklistStatus;

export interface ChecklistData {
  checklistStatus: ChecklistStatus;
  isApproved: boolean;
  status?: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  hasMovingPartner?: boolean;
  applicationComplete?: boolean;
  activeMessageShown?: boolean;
}

/**
 * Type guard to check if checklist is for a mover
 */
export function isMoverChecklist(
  checklist: ChecklistStatus
): checklist is MoverChecklistStatus {
  return 'companyDescription' in checklist;
}

/**
 * Type guard to check if checklist is for a driver
 */
export function isDriverChecklist(
  checklist: ChecklistStatus
): checklist is DriverChecklistStatus {
  return 'profilePicture' in checklist;
}

/**
 * Checks if checklist is complete (all required items checked)
 * @param hasMovingPartner - For drivers, indicates if they're linked to a moving partner.
 *   If true, vehicle/schedule/bank items are not required (handled by the partner).
 *   If false, these items must be completed by the driver.
 */
export function isChecklistComplete(
  checklist: ChecklistStatus,
  userType: 'driver' | 'mover',
  isApproved: boolean = false,
  hasMovingPartner: boolean = false
): boolean {
  if (userType === 'mover' && isMoverChecklist(checklist)) {
    // For movers, check all items except approvedDrivers if not approved
    return Object.entries(checklist).every(([key, value]) => {
      if (key === 'approvedDrivers' && !isApproved) {
        return true; // Skip this check if mover not approved
      }
      return value === true;
    });
  } else if (userType === 'driver' && isDriverChecklist(checklist)) {
    // Core items required for all drivers
    const coreItemsComplete =
      checklist.profilePicture &&
      checklist.driversLicense &&
      checklist.phoneVerified &&
      checklist.termsOfServiceReviewed;

    // If driver has a moving partner, core items are sufficient
    // (vehicle, schedule, bank are managed by the moving partner)
    if (hasMovingPartner) {
      return coreItemsComplete;
    }

    // Independent drivers must also complete vehicle, schedule, and bank account
    return (
      coreItemsComplete &&
      !!checklist.approvedVehicle &&
      !!checklist.workSchedule &&
      !!checklist.bankAccountLinked
    );
  }
  return false;
}

