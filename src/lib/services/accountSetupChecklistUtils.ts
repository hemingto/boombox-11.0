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

export interface HaulerChecklistStatus {
  companyPicture: boolean;
  phoneVerified: boolean;
  usdotNumber: boolean;
  californiaMcpNumber: boolean;
  insuranceAdded: boolean;
  routePricing: boolean;
  approvedDrivers: boolean;
  approvedVehicles: boolean;
  calendarSet: boolean;
  bankAccountLinked: boolean;
  termsOfServiceReviewed: boolean;
}

export type ChecklistStatus =
  | MoverChecklistStatus
  | DriverChecklistStatus
  | HaulerChecklistStatus;

export interface ChecklistData {
  checklistStatus: ChecklistStatus;
  isApproved: boolean;
  status?: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  hasMovingPartner?: boolean;
  hasHaulingPartner?: boolean;
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
 * Type guard to check if checklist is for a hauler
 */
export function isHaulerChecklist(
  checklist: ChecklistStatus
): checklist is HaulerChecklistStatus {
  return 'usdotNumber' in checklist;
}

/**
 * Checks if checklist is complete (all required items checked)
 * @param hasMovingPartner - For drivers, indicates if they're linked to a moving partner.
 * @param hasHaulingPartner - For drivers, indicates if they're linked to a hauling partner.
 *   If either is true, vehicle/schedule/bank items are not required (handled by the partner).
 */
export function isChecklistComplete(
  checklist: ChecklistStatus,
  userType: 'driver' | 'mover' | 'hauler',
  isApproved: boolean = false,
  hasMovingPartner: boolean = false,
  hasHaulingPartner: boolean = false
): boolean {
  if (userType === 'mover' && isMoverChecklist(checklist)) {
    return Object.entries(checklist).every(([key, value]) => {
      if (key === 'approvedDrivers' && !isApproved) {
        return true;
      }
      return value === true;
    });
  } else if (userType === 'hauler' && isHaulerChecklist(checklist)) {
    return Object.entries(checklist).every(([key, value]) => {
      if (key === 'approvedDrivers' && !isApproved) {
        return true;
      }
      return value === true;
    });
  } else if (userType === 'driver' && isDriverChecklist(checklist)) {
    const coreItemsComplete =
      checklist.profilePicture &&
      checklist.driversLicense &&
      checklist.phoneVerified &&
      checklist.termsOfServiceReviewed;

    // If driver is linked to a moving or hauling partner, core items are sufficient
    // (vehicle, schedule, bank are managed by the partner)
    if (hasMovingPartner || hasHaulingPartner) {
      return coreItemsComplete;
    }

    return (
      coreItemsComplete &&
      !!checklist.approvedVehicle &&
      !!checklist.workSchedule &&
      !!checklist.bankAccountLinked
    );
  }
  return false;
}
