/**
 * @fileoverview Admin task utilities for task management and processing
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (task parsing and formatting)
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (dashboard data aggregation)
 * 
 * UTILITY FUNCTIONS:
 * - Task ID parsing and validation
 * - Task response formatting
 * - Common admin task operations
 * - Storage unit assignment utilities
 * - Dashboard data aggregation and statistics
 * 
 * @refactor Extracted from monolithic admin tasks route for better organization
 */

import { prisma } from '@/lib/database/prismaClient';

// Base admin task interface
export interface BaseAdminTask {
  id: string;
  title: string;
  description: string;
  action: string;
  color: TaskColor;
  details: string;
}

export type TaskColor = 'rose' | 'amber' | 'cyan' | 'orange' | 'indigo' | 'purple' | 'emerald' | 'sky' | 'darkAmber';

/**
 * Format date for admin task display
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 285-296)
 */
export function formatTaskDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time for admin task display
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 292-296)
 */
export function formatTaskTime(time: Date): string {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Validate storage unit availability for assignment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts (lines 79-93)
 */
export async function validateStorageUnitsAvailable(storageUnitNumbers: string[]): Promise<{
  valid: boolean;
  availableUnits: any[];
  error?: string;
}> {
  const storageUnits = await prisma.storageUnit.findMany({
    where: {
      storageUnitNumber: {
        in: storageUnitNumbers
      },
      status: 'Empty'
    }
  });

  if (storageUnits.length !== storageUnitNumbers.length) {
    return {
      valid: false,
      availableUnits: storageUnits,
      error: 'One or more storage units are not available'
    };
  }

  return {
    valid: true,
    availableUnits: storageUnits
  };
}

/**
 * Create storage unit usage records
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts (lines 98-119)
 */
export async function createStorageUnitUsages(
  storageUnits: any[],
  appointmentId: number,
  userId: number,
  trailerPhotos?: string[]
) {
  const now = new Date();
  const createdUsages = [];

  for (const unit of storageUnits) {
    // Create usage record
    const usage = await prisma.storageUnitUsage.create({
      data: {
        storageUnitId: unit.id,
        userId: userId,
        startAppointmentId: appointmentId,
        usageStartDate: now,
        unitPickupPhotos: trailerPhotos || [],
      }
    });
    
    createdUsages.push(usage);
    
    // Update storage unit status
    await prisma.storageUnit.update({
      where: {
        id: unit.id
      },
      data: {
        status: 'Assigned'
      }
    });
  }

  return createdUsages;
}

/**
 * Update Onfleet tasks with storage unit assignments
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts (lines 120-137)
 */
export async function updateOnfleetTasksWithStorageUnits(
  appointmentId: number,
  unitIndex: number,
  storageUnits: any[],
  driverMatches?: boolean
) {
  const onfleetTasks = await prisma.onfleetTask.findMany({
    where: {
      appointmentId: appointmentId,
      unitNumber: unitIndex
    }
  });

  for (const task of onfleetTasks) {
    for (const unit of storageUnits) {
      await prisma.onfleetTask.update({
        where: {
          id: task.id
        },
        data: {
          storageUnitId: unit.id,
          // Update driverVerified if driverMatches was provided
          ...(driverMatches !== undefined && { driverVerified: driverMatches })
        }
      });
    }
  }
}

/**
 * Create admin log entry for storage unit assignment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts (lines 139-146)
 */
export async function createStorageAssignmentLog(
  adminId: number,
  appointmentId: number,
  action: string = 'Assigned storage units'
) {
  await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: action,
      targetType: 'Appointment',
      targetId: appointmentId.toString(),
    }
  });
}

/**
 * Update appointment flags for moving partner contact
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts (lines 33-40)
 */
export async function updateMovingPartnerContactFlags(
  appointmentId: number,
  calledMovingPartner: boolean,
  gotHoldOfMovingPartner?: boolean
) {
  return await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      calledMovingPartner: calledMovingPartner,
      gotHoldOfMovingPartner: gotHoldOfMovingPartner,
    },
  });
}

/**
 * Create admin log entry for moving partner contact
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts (lines 42-50)
 */
export async function createMovingPartnerContactLog(
  adminId: number,
  appointmentId: number,
  calledMovingPartner: boolean
) {
  await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: calledMovingPartner ? 'Called moving partner' : 'Marked as not called moving partner',
      targetType: 'Appointment',
      targetId: appointmentId.toString(),
    }
  });
}

/**
 * Create damage reports for storage units
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (lines 16-47)
 */
export async function createStorageUnitDamageReports(
  storageStartUsages: any[],
  appointmentId: number,
  adminId: number,
  damageDescription: string | null | undefined,
  frontPhotos: string[],
  backPhotos: string[]
) {
  console.log('Creating damage reports for appointment:', appointmentId);
  
  for (const usage of storageStartUsages) {
    try {
      console.log('Creating damage report for storage unit:', usage.storageUnitId);
      
      // Create the damage report
      await prisma.storageUnitDamageReport.create({
        data: {
          storageUnitId: usage.storageUnitId,
          appointmentId: appointmentId,
          adminId: adminId,
          damageDescription: damageDescription || '',
          damagePhotos: [...frontPhotos, ...backPhotos],
          status: 'Pending',
        },
      });
    } catch (error) {
      console.error('Error creating damage report:', error);
      throw error;
    }
  }
}

/**
 * Update storage unit status and usage records for return processing
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (various lines)
 */
export async function updateStorageUnitForReturn(
  usage: any,
  appointmentId: number,
  isEmpty: boolean
) {
  if (isEmpty) {
    // If unit is empty: Update to Pending Cleaning and end usage
    await prisma.storageUnit.update({
      where: { id: usage.storageUnitId },
      data: { status: 'Pending Cleaning' },
    });

    await prisma.storageUnitUsage.update({
      where: { id: usage.id },
      data: {
        usageEndDate: new Date(),
        endAppointmentId: appointmentId,
        warehouseLocation: "Pending Update",
        warehouseName: "South San Francisco"
      },
    });
  } else {
    // If unit is not empty: Update to Occupied with warehouse info
    await prisma.storageUnit.update({
      where: { id: usage.storageUnitId },
      data: { status: 'Occupied' },
    });

    await prisma.storageUnitUsage.update({
      where: { id: usage.id },
      data: {
        warehouseLocation: "Pending Update",
        warehouseName: "South San Francisco"
      },
    });
  }
}

/**
 * Update storage unit usage record for access/end storage appointments
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (lines 201-210)
 */
export async function updateStorageUnitUsageForAccess(
  usage: any,
  appointmentId: number
) {
  await prisma.storageUnitUsage.update({
    where: { id: usage.id },
    data: {
      usageEndDate: new Date(),
      endAppointmentId: appointmentId,
      warehouseLocation: "Pending Update",
      warehouseName: "South San Francisco"
    },
  });
}

/**
 * Create admin log entry for storage unit return processing
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (various log entries)
 */
export async function createStorageReturnLog(
  adminId: number,
  appointmentId: number,
  appointmentType: string,
  hasDamage: boolean,
  statusDetails: string
) {
  const action = hasDamage 
    ? `${appointmentType.toUpperCase()}_${statusDetails}_WITH_DAMAGE`
    : `${appointmentType.toUpperCase()}_${statusDetails}`;

  await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: action,
      targetType: 'APPOINTMENT',
      targetId: appointmentId.toString(),
    },
  });
}

/**
 * Update requested storage unit to mark as ready with trailer photos
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts (lines 59-71)
 */
export async function markRequestedUnitReady(
  appointmentId: number,
  storageUnitId: number,
  trailerPhotos: string[]
) {
  await prisma.requestedAccessStorageUnit.update({
    where: {
      appointmentId_storageUnitId: {
        appointmentId,
        storageUnitId
      }
    },
    data: {
      unitsReady: true,
      requestedUnitPickupPhotos: trailerPhotos || []
    }
  });
}

/**
 * Update OnfleetTask records for requested unit assignment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts (lines 73-116)
 */
export async function updateOnfleetTasksForRequestedUnit(
  appointmentId: number,
  storageUnitId: number,
  unitIndex: number,
  driverMatches: boolean
) {
  // Get the driver ID from the appointment's tasks
  const task = await prisma.onfleetTask.findFirst({
    where: {
      appointmentId,
      unitNumber: unitIndex
    },
    select: {
      driverId: true
    }
  });
  
  let driverId = null;
  if (task?.driverId) {
    driverId = task.driverId;
    
    // Update driver verification for this specific unit number
    await prisma.onfleetTask.updateMany({
      where: {
        appointmentId,
        driverId: task.driverId,
        unitNumber: unitIndex
      },
      data: {
        driverVerified: driverMatches === true
      }
    });
  }
  
  // Update OnfleetTask to associate it with this storage unit
  await prisma.onfleetTask.updateMany({
    where: {
      appointmentId,
      unitNumber: unitIndex,
      storageUnitId: null // Only update tasks that don't already have a storage unit assigned
    },
    data: {
      storageUnitId
    }
  });
  
  return driverId;
}

/**
 * Create admin log entry for requested unit assignment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts (lines 118-126)
 */
export async function createRequestedUnitAssignmentLog(
  adminId: number,
  appointmentId: number,
  storageUnitNumber: string,
  unitIndex: number,
  driverId: number | null,
  driverMatches: boolean
) {
  const driverInfo = driverId ? ` and recorded driver verification (${driverMatches ? 'Verified' : 'Not Verified'})` : '';
  const action = `Assigned storage unit ${storageUnitNumber} to appointment unit #${unitIndex}${driverInfo}`;

  await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: action,
      targetType: 'Appointment',
      targetId: appointmentId.toString(),
    },
  });
}

/**
 * Update feedback record to mark as responded
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 103-119)
 */
export async function markFeedbackAsResponded(
  feedbackId: number,
  response: string,
  isPackingSupplyFeedback: boolean = false
) {
  if (isPackingSupplyFeedback) {
    return await prisma.packingSupplyFeedback.update({
      where: { id: feedbackId },
      data: {
        responded: true,
        response: response,
      },
    });
  } else {
    return await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        responded: true,
        response: response,
      },
    });
  }
}

/**
 * Send email response for negative feedback
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 86-99)
 */
export async function sendFeedbackResponseEmail(
  userEmail: string,
  adminEmail: string,
  emailSubject: string,
  emailBody: string
) {
  // Note: SendGrid import and configuration should be handled at the service level
  // This is a placeholder for the email sending logic
  const msg = {
    to: userEmail,
    from: adminEmail,
    subject: emailSubject,
    text: emailBody,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="white-space: pre-wrap;">${emailBody}</div>
      </div>
    `,
  };
  
  // Return the email message object for service layer to handle sending
  return msg;
}

/**
 * Create admin log entry for feedback response
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 121-129)
 */
export async function createFeedbackResponseLog(
  adminId: number,
  feedbackId: number,
  jobCode: string,
  isPackingSupplyFeedback: boolean = false
) {
  const feedbackType = isPackingSupplyFeedback ? 'packing supply' : 'appointment';
  const action = `RESPOND_TO_FEEDBACK: Responded to ${feedbackType} feedback for job ${jobCode}`;

  await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: action,
      targetType: 'FEEDBACK',
      targetId: feedbackId.toString(),
    },
  });
}

/**
 * Mark storage unit as clean with photos and timestamp
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts (lines 46-77)
 */
export async function markStorageUnitAsClean(
  storageUnitId: number,
  adminId: number,
  photos: string[]
) {
  return await prisma.$transaction(async (prisma) => {
    // 1. Update the storage unit status to "Empty"
    const updatedUnit = await prisma.storageUnit.update({
      where: { id: storageUnitId },
      data: {
        status: 'Empty',
        cleaningPhotos: photos,
        lastCleanedAt: new Date()
      }
    });

    // 2. Create a new cleaning record
    const cleaningRecord = await prisma.storageUnitCleaning.create({
      data: {
        storageUnitId,
        adminId: adminId,
        photos,
      }
    });

    // 3. Create admin log entry
    const adminLog = await prisma.adminLog.create({
      data: {
        adminId: adminId,
        action: 'MARK_UNIT_CLEAN',
        targetType: 'StorageUnit', 
        targetId: storageUnitId.toString(),
      }
    });

    return { updatedUnit, cleaningRecord, adminLog };
  });
}

/**
 * Validate storage unit exists and is in Pending Cleaning status
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts (lines 35-43)
 */
export async function validateStorageUnitForCleaning(storageUnitId: number) {
  const storageUnit = await prisma.storageUnit.findUnique({
    where: { id: storageUnitId },
    select: { id: true, storageUnitNumber: true, status: true }
  });

  if (!storageUnit) {
    return { valid: false, error: 'Storage unit not found', storageUnit: null };
  }

  if (storageUnit.status !== 'Pending Cleaning') {
    return { 
      valid: false, 
      error: `Storage unit status is ${storageUnit.status}, expected Pending Cleaning`,
      storageUnit: storageUnit
    };
  }

  return { valid: true, error: null, storageUnit: storageUnit };
}

/**
 * Mark packing supply order as prepped with timestamp and admin tracking
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts (lines 31-55)
 */
export async function markPackingSupplyOrderAsPrepped(
  orderId: number,
  adminId: number,
  isPrepped: boolean = true
) {
  return await prisma.$transaction(async (prisma) => {
    // 1. Update the packing supply order
    const updatedOrder = await prisma.packingSupplyOrder.update({
      where: { id: orderId },
      data: {
        isPrepped: isPrepped,
        preppedAt: isPrepped ? new Date() : null,
        preppedBy: isPrepped ? adminId : null,
      }
    });

    // 2. Create admin log entry
    const adminLog = await prisma.adminLog.create({
      data: {
        adminId: adminId,
        action: 'PREP_PACKING_SUPPLY_ORDER',
        targetType: 'PackingSupplyOrder',
        targetId: orderId.toString(),
      }
    });

    return { updatedOrder, adminLog };
  });
}

/**
 * Validate packing supply order exists and can be prepped
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts validation logic
 */
export async function validatePackingSupplyOrderForPrep(orderId: number) {
  const order = await prisma.packingSupplyOrder.findUnique({
    where: { id: orderId },
    select: { 
      id: true, 
      contactName: true, 
      status: true, 
      isPrepped: true,
      onfleetTaskShortId: true
    }
  });

  if (!order) {
    return { valid: false, error: 'Packing supply order not found', order: null };
  }

  if (order.status === 'Canceled') {
    return { 
      valid: false, 
      error: 'Cannot prep canceled order',
      order: order
    };
  }

  if (order.isPrepped) {
    return { 
      valid: false, 
      error: 'Order is already prepped',
      order: order
    };
  }

  return { valid: true, error: null, order: order };
}

/**
 * Validate appointment exists and has requested storage units for delivery prep
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts (lines 44-53)
 */
export async function validateAppointmentForUnitsDelivery(appointmentId: number) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      jobCode: true,
      appointmentType: true,
      requestedStorageUnits: {
        select: {
          id: true,
          storageUnitId: true,
          unitsReady: true,
          storageUnit: {
            select: {
              storageUnitNumber: true
            }
          }
        }
      }
    }
  });

  if (!appointment) {
    return { valid: false, error: 'Appointment not found', appointment: null };
  }

  if (!['Storage Unit Access', 'End Storage Plan'].includes(appointment.appointmentType)) {
    return { 
      valid: false, 
      error: `Appointment type ${appointment.appointmentType} does not require unit delivery prep`,
      appointment: appointment
    };
  }

  if (appointment.requestedStorageUnits.length === 0) {
    return { 
      valid: false, 
      error: 'No requested storage units found for this appointment',
      appointment: appointment
    };
  }

  return { valid: true, error: null, appointment: appointment };
}

/**
 * Validate unit numbers belong to appointment and mark units as ready for delivery
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts (lines 62-95)
 */
export async function markUnitsReadyForDelivery(
  appointmentId: number,
  unitNumbers: string[],
  adminId: number
) {
  return await prisma.$transaction(async (prisma) => {
    // Get appointment with requested storage units
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        requestedStorageUnits: {
          include: {
            storageUnit: true
          }
        }
      }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Validate that all unit numbers in the request are associated with the appointment
    const validUnitNumbers = appointment.requestedStorageUnits.map(
      unit => unit.storageUnit.storageUnitNumber
    );

    const invalidUnitNumbers = unitNumbers.filter(
      unitNumber => !validUnitNumbers.includes(unitNumber)
    );

    if (invalidUnitNumbers.length > 0) {
      throw new Error(`Invalid unit numbers: ${invalidUnitNumbers.join(', ')}`);
    }

    // Get the storageUnitIds from the unit numbers
    const unitNumberToIdMap = appointment.requestedStorageUnits.reduce(
      (map, unit) => {
        map[unit.storageUnit.storageUnitNumber] = unit.storageUnitId;
        return map;
      },
      {} as Record<string, number>
    );

    // Update all requested storage units for this appointment to mark them as ready for delivery
    const updatePromises = unitNumbers.map(unitNumber => 
      prisma.$executeRaw`
        UPDATE "RequestedAccessStorageUnit" 
        SET "unitsReady" = true 
        WHERE "appointmentId" = ${appointment.id} 
        AND "storageUnitId" = ${unitNumberToIdMap[unitNumber]}
      `
    );

    // Execute all update operations
    await Promise.all(updatePromises);

    // Create admin log entry
    const adminLog = await prisma.adminLog.create({
      data: {
        adminId: adminId,
        action: 'Prepared units for delivery',
        targetType: 'Appointment',
        targetId: appointment.id.toString()
      }
    });

    return { 
      appointment: appointment, 
      updatedUnits: unitNumbers.length,
      adminLog: adminLog
    };
  });
}

/**
 * Create units delivery prep log entry
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts (lines 98-105)
 */
export async function createUnitsDeliveryPrepLog(adminId: number, appointmentId: number) {
  return await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: 'Prepared units for delivery',
      targetType: 'Appointment',
      targetId: appointmentId.toString()
    }
  });
}

/**
 * Validate storage unit usage exists and needs location update
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts (lines 40-47)
 */
export async function validateStorageUnitUsageForLocationUpdate(usageId: number) {
  const usage = await prisma.storageUnitUsage.findUnique({
    where: { id: usageId },
    select:  {
      id: true,
      warehouseLocation: true,
      storageUnit: {
        select: {
          id: true,
          storageUnitNumber: true
        }
      },
      user: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!usage) {
    return { valid: false, error: 'Storage unit usage not found', usage: null };
  }

  if (usage.warehouseLocation !== "Pending Update") {
    return { 
      valid: false, 
      error: `Storage unit usage does not need location update. Current location: ${usage.warehouseLocation}`,
      usage: usage
    };
  }

  return { valid: true, error: null, usage: usage };
}

/**
 * Update storage unit usage warehouse location with admin tracking
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts (lines 49-66)
 */
export async function updateStorageUnitWarehouseLocation(
  usageId: number,
  warehouseLocation: string,
  adminId: number
) {
  return await prisma.$transaction(async (prisma) => {
    // Get usage details for logging
    const usage = await prisma.storageUnitUsage.findUnique({
      where: { id: usageId },
      include: { storageUnit: true }
    });

    if (!usage) {
      throw new Error('Storage unit usage not found');
    }

    // Update storage unit usage with warehouse location
    const updatedUsage = await prisma.storageUnitUsage.update({
      where: { id: usageId },
      data: { 
        warehouseLocation,
        warehouseName: "South San Francisco"
      }
    });

    // Create admin log entry
    const adminLog = await prisma.adminLog.create({
      data: {
        adminId: adminId,
        action: `UPDATE_WAREHOUSE_LOCATION: Updated warehouse location for unit ${usage.storageUnit.storageUnitNumber} to ${warehouseLocation}`,
        targetType: 'STORAGE_UNIT',
        targetId: usage.storageUnit.id.toString()
      }
    });

    return { updatedUsage, adminLog };
  });
}

/**
 * Create warehouse location update log entry
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts (lines 59-66)
 */
export async function createWarehouseLocationUpdateLog(
  adminId: number, 
  storageUnitId: number, 
  storageUnitNumber: string, 
  warehouseLocation: string
) {
  return await prisma.adminLog.create({
    data: {
      adminId: adminId,
      action: `UPDATE_WAREHOUSE_LOCATION: Updated warehouse location for unit ${storageUnitNumber} to ${warehouseLocation}`,
      targetType: 'STORAGE_UNIT',
      targetId: storageUnitId.toString()
    }
  });
}

// ===== DASHBOARD DATA AGGREGATION UTILITIES =====

/**
 * Dashboard response interface
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 101-121)
 */
export interface DashboardData {
  jobsToday: {
    Scheduled: number;
    'In Transit': number;
    'Loading Complete': number;
    'Admin Check': number;
    Complete: number;
  };
  awaitingApprovals: {
    drivers: number;
    movers: number;
    vehicles: number;
  };
  taskCounts: {
    unassignedJobs: number;
    negativeFeedback: number;
    pendingCleaning: number;
    adminCheck: number;
    storageUnitNeeded: number;
  };
}

/**
 * Get today's date range for dashboard queries
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 6-10)
 */
export function getTodayDateRange(): { today: Date; tomorrow: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
}

/**
 * Get appointments grouped by status for today
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 12-24)
 */
export async function getAppointmentsByStatus(today: Date, tomorrow: Date) {
  return await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      date: {
        gte: today,
        lt: tomorrow
      }
    },
    _count: {
      _all: true
    }
  });
}

/**
 * Get counts for items awaiting approval
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 26-45)
 */
export async function getAwaitingApprovalCounts() {
  const [driversAwaitingApproval, moversAwaitingApproval, vehiclesAwaitingApproval] = await Promise.all([
    prisma.driver.count({
      where: {
        applicationComplete: true,
        isApproved: false
      }
    }),
    prisma.movingPartner.count({
      where: {
        applicationComplete: true,
        isApproved: false
      }
    }),
    prisma.vehicle.count({
      where: {
        isApproved: false
      }
    })
  ]);

  return {
    drivers: driversAwaitingApproval,
    movers: moversAwaitingApproval,
    vehicles: vehiclesAwaitingApproval
  };
}

/**
 * Get various task counts for admin dashboard
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 48-98)
 */
export async function getTaskCounts() {
  const { today, tomorrow } = getTodayDateRange();

  const [unassignedJobsCount, negativeFeedbackCount, pendingCleaningCount, adminCheckCount, storageUnitNeededCount] = await Promise.all([
    // Unassigned Jobs
    prisma.appointment.count({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) // today + 4 days (5 days total)
        },
        onfleetTasks: {
          none: {
            driverId: { not: null }
          }
        }
      }
    }),
    // Negative Feedback
    prisma.feedback.count({
      where: {
        rating: {
          lte: 3
        }
      }
    }),
    // Pending Cleaning
    prisma.storageUnit.count({
      where: {
        status: 'pending cleaning'
      }
    }),
    // Admin Check
    prisma.appointment.count({
      where: {
        status: 'Awaiting Admin Check In'
      }
    }),
    // Storage Unit Needed
    prisma.appointment.count({
      where: {
        appointmentType: {
          in: ['Initial Pickup', 'Additional Storage']
        },
        storageStartUsages: {
          none: {} // No storage unit usage records exist
        },
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })
  ]);

  return {
    unassignedJobs: unassignedJobsCount,
    negativeFeedback: negativeFeedbackCount,
    pendingCleaning: pendingCleaningCount,
    adminCheck: adminCheckCount,
    storageUnitNeeded: storageUnitNeededCount
  };
}

/**
 * Format appointments by status into dashboard format
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 102-108)
 */
export function formatJobsToday(appointmentsByStatus: Array<{ status: string; _count: { _all: number } }>) {
  return {
    Scheduled: appointmentsByStatus.find(a => a.status === 'Scheduled')?._count._all || 0,
    'In Transit': appointmentsByStatus.find(a => a.status === 'In Transit')?._count._all || 0,
    'Loading Complete': appointmentsByStatus.find(a => a.status === 'Loading Complete')?._count._all || 0,
    'Admin Check': appointmentsByStatus.find(a => a.status === 'Admin Check')?._count._all || 0,
    Complete: appointmentsByStatus.find(a => a.status === 'Complete')?._count._all || 0
  };
}

/**
 * Aggregate all dashboard data
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts (lines 100-121)
 */
export async function aggregateDashboardData(): Promise<DashboardData> {
  const { today, tomorrow } = getTodayDateRange();
  
  const [appointmentsByStatus, awaitingApprovals, taskCounts] = await Promise.all([
    getAppointmentsByStatus(today, tomorrow),
    getAwaitingApprovalCounts(),
    getTaskCounts()
  ]);

  return {
    jobsToday: formatJobsToday(appointmentsByStatus),
    awaitingApprovals,
    taskCounts
  };
}

/**
 * Fetch all feedback (regular and packing supply) with combined data structure
 * @source boombox-10.0/src/app/api/admin/feedback/route.ts (lines 6-90)
 */
export async function fetchAllFeedbackCombined() {
  // Fetch regular feedback
  const regularFeedback = await prisma.feedback.findMany({
    include: {
      movingPartner: {
        select: {
          name: true,
        },
      },
      appointment: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          appointmentType: true,
          date: true,
          jobCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch packing supply feedback
  const packingSupplyFeedback = await prisma.packingSupplyFeedback.findMany({
    include: {
      packingSupplyOrder: {
        select: {
          onfleetTaskShortId: true,
          contactName: true,
          contactEmail: true,
          deliveryDate: true,
          assignedDriver: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Transform packing supply feedback to match the structure of regular feedback
  const transformedPackingSupplyFeedback = packingSupplyFeedback.map(feedback => ({
    id: feedback.id,
    rating: feedback.rating,
    comment: feedback.comment,
    tipAmount: feedback.tipAmount,
    createdAt: feedback.createdAt,
    responded: feedback.responded,
    response: feedback.response,
    feedbackType: 'packing-supply' as const, // Add a type identifier
    movingPartner: feedback.packingSupplyOrder.assignedDriver ? {
      name: `${feedback.packingSupplyOrder.assignedDriver.firstName} ${feedback.packingSupplyOrder.assignedDriver.lastName}`
    } : null,
    appointment: {
      user: {
        firstName: feedback.packingSupplyOrder.contactName.split(' ')[0] || feedback.packingSupplyOrder.contactName,
        lastName: feedback.packingSupplyOrder.contactName.split(' ').slice(1).join(' ') || '',
        email: feedback.packingSupplyOrder.contactEmail,
      },
      appointmentType: 'Packing Supply Delivery',
      date: feedback.packingSupplyOrder.deliveryDate,
      jobCode: feedback.packingSupplyOrder.onfleetTaskShortId || 'N/A',
    },
  }));

  // Transform regular feedback to include type identifier
  const transformedRegularFeedback = regularFeedback.map(feedback => ({
    ...feedback,
    feedbackType: 'appointment' as const, // Add a type identifier
  }));

  // Combine both types of feedback and sort by creation date
  const allFeedback = [...transformedRegularFeedback, ...transformedPackingSupplyFeedback]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return allFeedback;
}

/**
 * Find feedback by ID (handles both regular and packing supply feedback)
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 36-80)
 */
export async function findFeedbackById(feedbackId: number) {
  // First try to find regular feedback
  const regularFeedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      appointment: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (regularFeedback) {
    return {
      feedback: regularFeedback,
      userEmail: regularFeedback.appointment.user.email,
      userName: `${regularFeedback.appointment.user.firstName} ${regularFeedback.appointment.user.lastName}`,
      jobCode: regularFeedback.appointment.jobCode || 'N/A',
      isPackingSupply: false,
    };
  }

  // Try to find packing supply feedback
  const packingSupplyFeedback = await prisma.packingSupplyFeedback.findUnique({
    where: { id: feedbackId },
    include: {
      packingSupplyOrder: {
        select: {
          contactEmail: true,
          contactName: true,
          onfleetTaskShortId: true,
        },
      },
    },
  });

  if (packingSupplyFeedback) {
    return {
      feedback: packingSupplyFeedback,
      userEmail: packingSupplyFeedback.packingSupplyOrder.contactEmail,
      userName: packingSupplyFeedback.packingSupplyOrder.contactName,
      jobCode: packingSupplyFeedback.packingSupplyOrder.onfleetTaskShortId || 'N/A',
      isPackingSupply: true,
    };
  }

  return null;
}

/**
 * Create or update appointment feedback
 * @source boombox-10.0/src/app/api/feedback/submit/route.ts (lines 98-133)
 */
export async function createOrUpdateAppointmentFeedback(
  appointmentId: number,
  rating: number,
  comment: string = '',
  tipAmount: number = 0
) {
  // Check if feedback already exists
  const existingFeedback = await prisma.feedback.findUnique({
    where: { appointmentId }
  });

  // Get appointment details for movingPartnerId
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { movingPartner: true }
  });

  if (!appointment) {
    throw new Error(`Appointment not found with ID: ${appointmentId}`);
  }

  if (existingFeedback) {
    // Update existing feedback
    return await prisma.feedback.update({
      where: { id: existingFeedback.id },
      data: {
        rating,
        comment,
        tipAmount
      }
    });
  } else {
    // Create new feedback
    return await prisma.feedback.create({
      data: {
        appointmentId,
        movingPartnerId: appointment.movingPartnerId,
        rating,
        comment,
        tipAmount
      }
    });
  }
}

/**
 * Update driver ratings for OnfleetTask records
 * @source boombox-10.0/src/app/api/feedback/submit/route.ts (lines 135-158)
 */
export async function updateDriverRatings(
  appointmentId: number,
  driverRatings: Record<string, 'thumbs_up' | 'thumbs_down'>
) {
  if (!driverRatings || typeof driverRatings !== 'object') {
    return;
  }

  const updatePromises = Object.entries(driverRatings).map(async ([taskId, rating]) => {
    if (rating && (rating === 'thumbs_up' || rating === 'thumbs_down')) {
      return prisma.onfleetTask.updateMany({
        where: {
          taskId: taskId,
          appointmentId: appointmentId
        },
        data: {
          driverFeedback: rating
        }
      });
    }
  });
  
  await Promise.all(updatePromises.filter(Boolean));
}

/**
 * Create or update packing supply feedback
 * @source boombox-10.0/src/app/api/packing-supplies/feedback/submit/route.ts (lines 82-118)
 */
export async function createOrUpdatePackingSupplyFeedback(
  taskShortId: string,
  rating: number,
  comment: string = '',
  tipAmount: number = 0,
  driverRating: 'thumbs_up' | 'thumbs_down' | null = null
) {
  // Find the packing supply order
  const order = await prisma.packingSupplyOrder.findFirst({
    where: { onfleetTaskShortId: taskShortId },
    include: {
      assignedDriver: true,
      user: true
    }
  });

  if (!order) {
    throw new Error(`Packing supply order not found with task short ID: ${taskShortId}`);
  }

  // Check if feedback already exists
  const existingFeedback = await prisma.packingSupplyFeedback.findUnique({
    where: { packingSupplyOrderId: order.id }
  });

  const feedbackData = {
    rating,
    comment,
    tipAmount,
    driverRating
  };

  if (existingFeedback) {
    // Update existing feedback
    return {
      feedback: await prisma.packingSupplyFeedback.update({
        where: { id: existingFeedback.id },
        data: feedbackData
      }),
      order
    };
  } else {
    // Create new feedback
    return {
      feedback: await prisma.packingSupplyFeedback.create({
        data: {
          packingSupplyOrderId: order.id,
          ...feedbackData
        }
      }),
      order
    };
  }
}

/**
 * Update feedback with payment information
 * @source boombox-10.0/src/app/api/feedback/submit/route.ts (lines 181-188)
 */
export async function updateFeedbackWithPayment(
  feedbackId: number,
  paymentIntentId: string,
  paymentStatus: string,
  isPackingSupply: boolean = false
) {
  if (isPackingSupply) {
    return await prisma.packingSupplyFeedback.update({
      where: { id: feedbackId },
      data: {
        tipPaymentIntentId: paymentIntentId,
        tipPaymentStatus: paymentStatus
      }
    });
  } else {
    return await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        tipPaymentIntentId: paymentIntentId,
        tipPaymentStatus: paymentStatus
      }
    });
  }
}