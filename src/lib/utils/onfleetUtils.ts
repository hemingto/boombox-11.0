/**
 * @fileoverview Onfleet utility functions for task creation and management
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (calculateTaskTiming, processStorageUnits, buildTaskPayload, validateTaskTimes)
 * @refactor Extracted reusable Onfleet utilities from monolithic route function
 */

export interface TaskTimingOptions {
  appointmentTime: Date;
  existingUnitCount: number;
  currentUnitIndex: number;
}

export interface TaskTimingResult {
  adjustedStartTime: Date;
  adjustedAppointmentTime: Date;
  adjustedWindowEnd: Date;
}

export interface StorageUnitInfo {
  id: number;
  storageUnitNumber: string;
}

export interface StorageUnitProcessingResult {
  storageUnitIds: number[];
  unitCount: number;
  storageUnitNumbersMap: Record<number, string>;
  allUnitNumbers: string;
}

/**
 * Calculate adjusted timing for Onfleet tasks with proper validation
 */
export function calculateTaskTiming(options: TaskTimingOptions): TaskTimingResult {
  const { appointmentTime, existingUnitCount, currentUnitIndex } = options;
  
  const windowEnd = new Date(appointmentTime.getTime() + 60 * 60 * 1000);
  const routeStartTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
  
  // Calculate time offset based on existing units plus current index
  const timeOffset = (existingUnitCount + currentUnitIndex) * 45 * 60 * 1000;
  
  let adjustedStartTime = new Date(routeStartTime.getTime() + timeOffset);
  let adjustedAppointmentTime = new Date(appointmentTime.getTime() + timeOffset);
  let adjustedWindowEnd = new Date(windowEnd.getTime() + timeOffset);
  
  // Validate times aren't in the past
  const now = new Date().getTime();
  
  if (adjustedStartTime.getTime() < now) {
    console.warn(`Warning: adjustedStartTime is in the past. Using now + 1 hour instead.`);
    adjustedStartTime = new Date(now + 60 * 60 * 1000);
  }
  
  if (adjustedAppointmentTime.getTime() < now) {
    console.warn(`Warning: adjustedAppointmentTime is in the past. Using now + 2 hours instead.`);
    adjustedAppointmentTime = new Date(now + 2 * 60 * 60 * 1000);
  }
  
  if (adjustedWindowEnd.getTime() < now) {
    console.warn(`Warning: adjustedWindowEnd is in the past. Using now + 3 hours instead.`);
    adjustedWindowEnd = new Date(now + 3 * 60 * 60 * 1000);
  }
  
  return {
    adjustedStartTime,
    adjustedAppointmentTime,
    adjustedWindowEnd
  };
}

/**
 * Process storage units and create mappings for task creation
 */
export async function processStorageUnits(
  storageUnitIds: number[],
  isAccessAppointment: boolean,
  unitCount: number
): Promise<StorageUnitProcessingResult> {
  // Get storage unit numbers for mapping
  const { prisma } = await import('@/lib/database/prismaClient');
  
  const storageUnits = await prisma.storageUnit.findMany({
    where: { id: { in: storageUnitIds } },
    select: { id: true, storageUnitNumber: true }
  });

  const storageUnitNumbersMap: Record<number, string> = {};
  storageUnits.forEach((unit: StorageUnitInfo) => {
    storageUnitNumbersMap[unit.id] = unit.storageUnitNumber || `Unit #${unit.id}`;
  });

  const allUnitNumbers = storageUnitIds.map((id: number) => 
    storageUnitNumbersMap[id] || id.toString()
  ).join(', ');

  const finalUnitCount = isAccessAppointment && storageUnitIds.length > 0 
    ? storageUnitIds.length 
    : unitCount;

  return {
    storageUnitIds,
    unitCount: finalUnitCount,
    storageUnitNumbersMap,
    allUnitNumbers
  };
}

/**
 * Build Onfleet task payload with proper metadata and custom fields
 */
export function buildOnfleetTaskPayload(options: {
  destination: { address: any };
  recipients: any[];
  notes: string;
  serviceTime: number;
  completeAfter: number;
  completeBefore: number;
  teamId: string;
  dependencies?: string[];
  customFields: Record<string, any>;
  metadata: Record<string, any>;
  pickupTask?: boolean;
  recipientSkipSMSNotifications?: boolean;
  requirePhoto?: boolean;
}) {
  const {
    destination,
    recipients,
    notes,
    serviceTime,
    completeAfter,
    completeBefore,
    teamId,
    dependencies,
    customFields,
    metadata,
    pickupTask = false,
    recipientSkipSMSNotifications = false,
    requirePhoto = false
  } = options;

  // Convert customFields object to Onfleet array format
  const customFieldsArray = Object.entries(customFields).map(([key, value]) => ({
    key,
    value
  }));

  // Convert metadata object to Onfleet array format
  const metadataArray = Object.entries(metadata).map(([name, value]) => {
    let type = 'string';
    if (typeof value === 'number') type = 'number';
    if (typeof value === 'boolean') type = 'boolean';

    return {
      name,
      type,
      value,
      visibility: ['api']
    };
  });

  const payload: any = {
    destination,
    recipients,
    notes,
    serviceTime,
    completeAfter,
    completeBefore,
    quantity: 1,
    container: { type: 'TEAM', team: teamId },
    customFields: customFieldsArray,
    metadata: metadataArray
  };

  // Add optional fields
  if (dependencies && dependencies.length > 0) {
    payload.dependencies = dependencies;
  }
  
  if (pickupTask) {
    payload.pickupTask = true;
  }
  
  if (recipientSkipSMSNotifications) {
    payload.recipientSkipSMSNotifications = true;
  }
  
  if (requirePhoto) {
    payload.requirePhoto = true;
  }

  return payload;
} 