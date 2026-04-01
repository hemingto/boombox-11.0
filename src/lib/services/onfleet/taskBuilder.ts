/**
 * @fileoverview Onfleet task building utilities for creating tasks with proper metadata and timing
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (lines 17-348)
 * @refactor Extracted task building logic from 1,156-line monolith into reusable utilities
 */

// ===== TASK TIMING UTILITIES =====

export interface TaskTimingConfig {
  appointmentTime: Date;
  existingUnitCount: number;
  currentUnitIndex: number;
}

export interface TaskTimingResult {
  adjustedStartTime: Date;
  adjustedAppointmentTime: Date;
  adjustedWindowEnd: Date;
}

/**
 * Calculates task timing with offsets for multiple units
 * Ensures times are not in the past
 */
export function calculateTaskTiming(
  config: TaskTimingConfig
): TaskTimingResult {
  const { appointmentTime, existingUnitCount, currentUnitIndex } = config;

  const routeStartTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const windowEnd = new Date(appointmentTime.getTime() + 60 * 60 * 1000); // 1 hour after

  // Calculate time offset based on how many units already exist plus current new unit index
  // This ensures new units get properly sequenced after existing ones
  // Each unit gets 45 minute offset
  const timeOffset = (existingUnitCount + currentUnitIndex) * 45 * 60 * 1000;

  let adjustedStartTime = new Date(routeStartTime.getTime() + timeOffset);
  let adjustedAppointmentTime = new Date(
    appointmentTime.getTime() + timeOffset
  );
  let adjustedWindowEnd = new Date(windowEnd.getTime() + timeOffset);

  // Validate timestamps are not in the past
  const now = new Date().getTime();

  if (adjustedStartTime.getTime() < now) {
    console.warn(
      `Warning: adjustedStartTime is in the past. Using now + 1 hour instead.`
    );
    adjustedStartTime = new Date(now + 60 * 60 * 1000);
  }

  if (adjustedAppointmentTime.getTime() < now) {
    console.warn(
      `Warning: adjustedAppointmentTime is in the past. Using now + 2 hours instead.`
    );
    adjustedAppointmentTime = new Date(now + 2 * 60 * 60 * 1000);
  }

  if (adjustedWindowEnd.getTime() < now) {
    console.warn(
      `Warning: adjustedWindowEnd is in the past. Using now + 3 hours instead.`
    );
    adjustedWindowEnd = new Date(now + 3 * 60 * 60 * 1000);
  }

  return {
    adjustedStartTime,
    adjustedAppointmentTime,
    adjustedWindowEnd,
  };
}

// ===== TASK METADATA & CUSTOM FIELDS =====

export interface TaskMetadataConfig {
  appointmentId: number;
  userId: number;
  appointmentType: string;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  stripeCustomerId?: string;
  parsedLoadingHelpPrice?: number;
  insuranceCoverage?: string;
  storageUnitCount: number;
  movingPartnerName?: string;
  planType: string;
  isAdditionalUnit: boolean;
  stepNumber: number;
  deliveryReason?: string;
  storageUnitId?: number;
}

/**
 * Builds Onfleet metadata array
 */
export function buildTaskMetadata(config: TaskMetadataConfig) {
  const baseMetadata = [
    {
      name: 'step',
      type: 'number' as const,
      value: config.stepNumber,
      visibility: ['api' as const],
    },
    {
      name: 'appointmentType',
      type: 'string' as const,
      value: String(config.appointmentType),
      visibility: ['api' as const],
    },
    {
      name: 'monthlyStorageRate',
      type: 'number' as const,
      value: Number(config.monthlyStorageRate) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'monthlyInsuranceRate',
      type: 'number' as const,
      value: Number(config.monthlyInsuranceRate) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'stripeCustomerId',
      type: 'string' as const,
      value: config.stripeCustomerId ? String(config.stripeCustomerId) : '',
      visibility: ['api' as const],
    },
    {
      name: 'parsedLoadingHelpPrice',
      type: 'number' as const,
      value: Number(config.parsedLoadingHelpPrice) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'insuranceCoverage',
      type: 'string' as const,
      value: String(config.insuranceCoverage || 'No Insurance'),
      visibility: ['api' as const],
    },
    {
      name: 'storageUnitCount',
      type: 'number' as const,
      value: Number(config.storageUnitCount) || 0,
      visibility: ['api' as const],
    },
    {
      name: 'movingPartnerName',
      type: 'string' as const,
      value: String(config.movingPartnerName || 'No Moving Partner'),
      visibility: ['api' as const],
    },
    {
      name: 'planType',
      type: 'string' as const,
      value: String(config.planType || ''),
      visibility: ['api' as const],
    },
    {
      name: 'additionalUnit',
      type: 'boolean' as const,
      value: config.isAdditionalUnit,
      visibility: ['api' as const],
    },
  ];

  // Add delivery reason and storage unit ID for access appointments
  const isAccessAppointment =
    config.appointmentType === 'Storage Unit Access' ||
    config.appointmentType === 'End Storage Term';

  if (isAccessAppointment && config.deliveryReason) {
    baseMetadata.push({
      name: 'deliveryReason',
      type: 'string' as const,
      value: String(config.deliveryReason),
      visibility: ['api' as const],
    });
  }

  if (isAccessAppointment && config.storageUnitId) {
    baseMetadata.push({
      name: 'storageUnitId',
      type: 'string' as const,
      value: String(config.storageUnitId),
      visibility: ['api' as const],
    });
  }

  return baseMetadata;
}

/**
 * Builds Onfleet custom fields array
 */
export function buildTaskCustomFields(config: {
  appointmentId: number;
  unitNumber: number;
  userId: number;
  customerName: string;
  stepLabel: string;
  storageUnitId?: number;
  storageUnitNumber?: string; // Add this to pass the actual storage unit number (e.g., "SFBB004")
  isAccessAppointment: boolean;
}) {
  const baseFields = [
    {
      key: 'boomboxAppointmentId',
      value: config.appointmentId,
    },
    {
      key: 'boomboxUnitNumber',
      value: config.storageUnitNumber || `Unit #${config.unitNumber}`, // Use actual storage unit number or fallback
    },
    {
      key: 'boomboxUserId',
      value: config.userId,
    },
    {
      key: 'customerName',
      value: config.customerName,
    },
    {
      key: 'step',
      value: config.stepLabel,
    },
  ];

  // Add storage unit ID for access appointments
  if (config.isAccessAppointment && config.storageUnitId) {
    baseFields.push({
      key: 'storageUnitId',
      value: config.storageUnitId,
    });
  }

  return baseFields;
}

// ===== TASK NOTES BUILDERS =====

export interface TaskNotesConfig {
  appointmentType: string;
  jobCode: string;
  isDIY: boolean;
  isFirstUnit: boolean;
  totalUnits: number;
  currentUnitNumber: number;
  storageUnitNumber: string;
  movingPartnerName: string;
}

function isAccessOrEndTerm(appointmentType: string): boolean {
  return (
    appointmentType === 'Storage Unit Access' ||
    appointmentType === 'End Storage Term'
  );
}

function buildStep1Notes(config: TaskNotesConfig): string {
  const unitLine = isAccessOrEndTerm(config.appointmentType)
    ? `Warehouse staff will attach trailer and ${config.storageUnitNumber} to your vehicle`
    : 'Warehouse staff will attach trailer and storage unit to your vehicle';

  return `STEP 1: WAREHOUSE PICKUP

Job Code: ${config.jobCode}

Check in with warehouse staff when you arrive

Share job code

${unitLine}

Take photo of the storage unit attached and the back door is closed and secure`;
}

function buildStep2Notes(config: TaskNotesConfig): string {
  const isAccess = isAccessOrEndTerm(config.appointmentType);
  const isEndTerm = config.appointmentType === 'End Storage Term';
  const isMultiUnit = config.totalUnits > 1;
  const isAdditionalUnit = !config.isFirstUnit;

  const intro = `Drive to customer's address. Find a safe and secure place to park. Call customer if they do not come outside within 5 mins. Greet them in a professional manner.`;

  let taskParagraph: string;
  let photoParagraph: string;

  if (config.isDIY) {
    if (isAccess) {
      taskParagraph =
        'Wait for the customer to unload the items they need from their unit. You are not insured to assist with the packing process. Politely explain this to the customer if they ask for your help.';
    } else {
      taskParagraph =
        'Wait for the customer to pack their unit. You are not insured to assist with the packing process. Politely explain this to the customer if they ask for your help.';
    }
    photoParagraph =
      '[Important] Once the unit is packed, take a photo of the storage unit with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
  } else if (isAdditionalUnit) {
    taskParagraph = `Your unit is being packed by ${config.movingPartnerName} and the customer. You are ${config.currentUnitNumber} out of ${config.totalUnits}.`;
    if (isAccess) {
      photoParagraph =
        '[Important] Once the customer is done with their unit, take a photo of the storage unit you towed with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    } else {
      photoParagraph =
        '[Important] Once your unit is packed, take a photo of the storage unit that you towed with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    }
  } else if (isMultiUnit) {
    if (isAccess) {
      taskParagraph = `Assist the customer with unloading or loading all of their units. There are ${config.totalUnits} in this order.`;
      photoParagraph =
        '[Important] Once the customer is done with their unit, take a photo of the storage unit you towed with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    } else {
      taskParagraph = `You are packing ${config.totalUnits} total. Assist the customer with loading all of their units and packing their items so they are ready to be stored safely and securely. Pack the unit you towed last to clear up parking space at the customer's location.`;
      photoParagraph =
        '[Important] Once your unit is packed, take a photo of the storage unit that you towed with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    }
  } else {
    if (isAccess) {
      taskParagraph =
        'Assist the customer with unloading or loading their unit.';
      photoParagraph =
        '[Important] Once the customer is done with their unit, take a photo of the storage unit with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    } else {
      taskParagraph =
        'Assist the customer with loading their unit and packing their items so they are ready to be stored safely and securely';
      photoParagraph =
        '[Important] Once the unit is packed, take a photo of the storage unit with the door open. Stand directly behind the unit so you can see the full opening of the storage unit door.';
    }
  }

  if (isEndTerm) {
    taskParagraph += ' Please ensure the unit is completely empty.';
  }

  return `STEP 2: CUSTOMER DELIVERY

${intro}

${taskParagraph}

${photoParagraph}

Make sure the back door is secure and padlocked before leaving.`;
}

function buildStep3Notes(): string {
  return `STEP 3: RETURN TO WAREHOUSE

Return directly to the Boombox facility.

Check in with the warehouse staff when you arrive and the crew will unload the storage unit and remove the trailer from your vehicle if this is your last job of the day.

Take a photo of the unit back at the storage facility.`;
}

/**
 * Factory function to build all 3 task notes based on appointment type, plan type, and unit scenario
 */
export function buildTaskNotes(config: TaskNotesConfig) {
  return {
    pickup: buildStep1Notes(config),
    customer: buildStep2Notes(config),
    return: buildStep3Notes(),
  };
}
