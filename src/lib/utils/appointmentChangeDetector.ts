/**
 * @fileoverview Appointment change detection utility for calculating diffs between appointments
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (change detection logic)
 * @refactor Extracted change detection logic into reusable utility functions
 */

import { AppointmentChanges } from '@/lib/utils/appointmentUtils';

/**
 * Detect if appointment time has changed
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Time change details or null
 */
export function detectTimeChange(
  existingAppointment: any,
  updateData: any
): { changed: boolean; oldTime: Date; newTime: Date } | null {
  if (!updateData.appointmentDateTime) {
    return null;
  }

  const newDateTime = new Date(updateData.appointmentDateTime);
  const oldDateTime = existingAppointment.time || existingAppointment.date;
  
  const timeChanged = oldDateTime.getTime() !== newDateTime.getTime();

  if (timeChanged) {
    return {
      changed: true,
      oldTime: oldDateTime,
      newTime: newDateTime,
    };
  }

  return null;
}

/**
 * Detect if plan type has changed
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Plan change details or null
 */
export function detectPlanChange(
  existingAppointment: any,
  updateData: any
): {
  changed: boolean;
  oldPlan: string;
  newPlan: string;
  switchType: 'diy_to_full_service' | 'full_service_to_diy';
} | null {
  if (!updateData.planType || updateData.planType === existingAppointment.planType) {
    return null;
  }

  const oldPlan = existingAppointment.planType;
  const newPlan = updateData.planType;

  // Determine switch type
  let switchType: 'diy_to_full_service' | 'full_service_to_diy';
  
  if (oldPlan === 'Do It Yourself Plan' && newPlan === 'Full Service Plan') {
    switchType = 'diy_to_full_service';
  } else if (oldPlan === 'Full Service Plan' && newPlan === 'Do It Yourself Plan') {
    switchType = 'full_service_to_diy';
  } else {
    // Other plan changes (not switching between DIY/Full Service)
    return {
      changed: true,
      oldPlan,
      newPlan,
      switchType: 'diy_to_full_service', // Default
    };
  }

  return {
    changed: true,
    oldPlan,
    newPlan,
    switchType,
  };
}

/**
 * Detect if moving partner has changed
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Moving partner change details or null
 */
export function detectMovingPartnerChange(
  existingAppointment: any,
  updateData: any
): {
  changed: boolean;
  oldMovingPartnerId: number | null;
  newMovingPartnerId: number | null;
} | null {
  if (updateData.movingPartnerId === undefined) {
    return null;
  }

  const oldId = existingAppointment.movingPartnerId;
  const newId = updateData.movingPartnerId;

  if (oldId !== newId) {
    return {
      changed: true,
      oldMovingPartnerId: oldId,
      newMovingPartnerId: newId,
    };
  }

  return null;
}

/**
 * Detect storage unit changes (added/removed)
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Storage unit change details or null
 */
export function detectStorageUnitChange(
  existingAppointment: any,
  updateData: any
): {
  changed: boolean;
  unitsAdded: number[];
  unitsRemoved: number[];
  countIncreased: boolean;
  countDecreased: boolean;
} | null {
  // Get existing unit IDs
  const existingUnitIds =
    existingAppointment.requestedStorageUnits?.map((unit: any) => unit.storageUnitId) || [];

  // Get new unit IDs (could be from selectedStorageUnits or numberOfUnits)
  let newUnitIds: number[] = [];
  
  if (updateData.selectedStorageUnits) {
    newUnitIds = updateData.selectedStorageUnits;
  } else if (updateData.numberOfUnits !== undefined) {
    // If only numberOfUnits is provided, we can't determine exact unit IDs
    // Just compare counts
    if (updateData.numberOfUnits !== existingUnitIds.length) {
      return {
        changed: true,
        unitsAdded: [],
        unitsRemoved: [],
        countIncreased: updateData.numberOfUnits > existingUnitIds.length,
        countDecreased: updateData.numberOfUnits < existingUnitIds.length,
      };
    }
    return null;
  } else {
    return null;
  }

  // Calculate added and removed units
  const unitsAdded = newUnitIds.filter((id: number) => !existingUnitIds.includes(id));
  const unitsRemoved = existingUnitIds.filter((id: number) => !newUnitIds.includes(id));

  if (unitsAdded.length > 0 || unitsRemoved.length > 0) {
    return {
      changed: true,
      unitsAdded,
      unitsRemoved,
      countIncreased: newUnitIds.length > existingUnitIds.length,
      countDecreased: newUnitIds.length < existingUnitIds.length,
    };
  }

  return null;
}

/**
 * Detect if address has changed
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Address change details or null
 */
export function detectAddressChange(
  existingAppointment: any,
  updateData: any
): {
  changed: boolean;
  oldAddress: string;
  newAddress: string;
  oldZipcode: string;
  newZipcode: string;
} | null {
  const addressChanged = updateData.address && updateData.address !== existingAppointment.address;
  const zipcodeChanged = updateData.zipcode && updateData.zipcode !== existingAppointment.zipcode;

  if (addressChanged || zipcodeChanged) {
    return {
      changed: true,
      oldAddress: existingAppointment.address || '',
      newAddress: updateData.address || existingAppointment.address,
      oldZipcode: existingAppointment.zipcode || '',
      newZipcode: updateData.zipcode || existingAppointment.zipcode,
    };
  }

  return null;
}

/**
 * Get unit numbers to remove based on unit IDs being removed
 * @param existingUnitIds - Current storage unit IDs
 * @param unitIdsToRemove - Unit IDs being removed
 * @returns Array of unit numbers to remove (1-based)
 */
export function getUnitNumbersToRemove(
  existingUnitIds: number[],
  unitIdsToRemove: number[]
): number[] {
  const unitNumbers: number[] = [];

  for (const unitId of unitIdsToRemove) {
    const index = existingUnitIds.indexOf(unitId);
    if (index !== -1) {
      // Convert 0-based index to 1-based unit number
      unitNumbers.push(index + 1);
    }
  }

  return unitNumbers;
}

/**
 * Calculate comprehensive appointment changes
 * @param existingAppointment - Original appointment
 * @param updateData - New appointment data
 * @returns Detailed change information
 */
export function calculateDetailedAppointmentChanges(
  existingAppointment: any,
  updateData: any
): {
  hasChanges: boolean;
  timeChange: ReturnType<typeof detectTimeChange>;
  planChange: ReturnType<typeof detectPlanChange>;
  movingPartnerChange: ReturnType<typeof detectMovingPartnerChange>;
  storageUnitChange: ReturnType<typeof detectStorageUnitChange>;
  addressChange: ReturnType<typeof detectAddressChange>;
} {
  const timeChange = detectTimeChange(existingAppointment, updateData);
  const planChange = detectPlanChange(existingAppointment, updateData);
  const movingPartnerChange = detectMovingPartnerChange(existingAppointment, updateData);
  const storageUnitChange = detectStorageUnitChange(existingAppointment, updateData);
  const addressChange = detectAddressChange(existingAppointment, updateData);

  const hasChanges =
    timeChange !== null ||
    planChange !== null ||
    movingPartnerChange !== null ||
    storageUnitChange !== null ||
    addressChange !== null;

  return {
    hasChanges,
    timeChange,
    planChange,
    movingPartnerChange,
    storageUnitChange,
    addressChange,
  };
}

