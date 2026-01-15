/**
 * @fileoverview Smart driver reassignment service for appointment edits
 * 
 * This service analyzes driver requirements when appointments are modified
 * (plan type changes, unit count changes) and determines the optimal way
 * to keep/shift existing drivers rather than blindly unassigning everyone.
 * 
 * Key goals:
 * - Minimize driver notification churn (avoid unassign then reassign same driver)
 * - Keep compatible drivers when possible
 * - Shift drivers to appropriate units when plan type changes
 * - Only send notifications for actual changes
 */

import { prisma } from '@/lib/database/prismaClient';
import { getUnitSpecificStartTime } from '@/lib/utils/driverAssignmentUtils';

// Types for reassignment planning
export interface TaskWithDriver {
  id: number;
  taskId: string;
  unitNumber: number;
  stepNumber: number;
  driverId: number | null;
  driver?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    onfleetWorkerId: string | null;
  } | null;
}

export interface DriverShift {
  driverId: number;
  driverName: string;
  driverPhone: string | null;
  currentUnit: number;
  newUnit: number;
  newArrivalTime: Date;
}

export interface DriverRemoval {
  driverId: number;
  driverName: string;
  driverPhone: string | null;
  reason: string;
}

export interface UnitSlot {
  unitNumber: number;
  driverType: 'moving_partner' | 'boombox';
}

export interface ReassignmentPlan {
  driversToKeep: DriverShift[];
  driversToRemove: DriverRemoval[];
  unitsNeedingNewDriver: UnitSlot[];
}

/**
 * Driver type requirements by plan
 */
const DRIVER_REQUIREMENTS = {
  'Full Service Plan': {
    // Unit 1 = Moving Partner driver (first to arrive, handles packing)
    // Unit 2+ = Boombox Delivery Network drivers
    getDriverType: (unitNumber: number): 'moving_partner' | 'boombox' => 
      unitNumber === 1 ? 'moving_partner' : 'boombox'
  },
  'Do It Yourself Plan': {
    // All units = Boombox Delivery Network drivers
    getDriverType: (_unitNumber: number): 'moving_partner' | 'boombox' => 'boombox'
  },
  'Third Party Loading Help': {
    // All units = Boombox Delivery Network drivers (third party handles loading)
    getDriverType: (_unitNumber: number): 'moving_partner' | 'boombox' => 'boombox'
  }
} as const;

/**
 * Check if a driver is a Moving Partner driver
 */
async function isMovingPartnerDriver(driverId: number, movingPartnerId?: number): Promise<boolean> {
  if (!movingPartnerId) return false;
  
  const association = await prisma.movingPartnerDriver.findFirst({
    where: {
      driverId,
      movingPartnerId,
      isActive: true
    }
  });
  
  return !!association;
}

/**
 * Check if a driver is a Boombox Delivery Network driver
 */
async function isBoomboxDriver(driverId: number): Promise<boolean> {
  const boomboxTeamId = process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
  if (!boomboxTeamId) return false;
  
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { onfleetTeamIds: true }
  });
  
  return driver?.onfleetTeamIds?.includes(boomboxTeamId) ?? false;
}

export class DriverReassignmentService {
  /**
   * Analyze what driver changes are needed when an appointment is modified
   * 
   * @param existingTasks - Current tasks with driver assignments
   * @param oldPlanType - Previous plan type
   * @param newPlanType - New plan type
   * @param oldUnitCount - Previous number of units
   * @param newUnitCount - New number of units
   * @param appointmentTime - Appointment start time (for calculating arrival times)
   * @param movingPartnerId - Moving partner ID (for Full Service Plan)
   */
  static async analyzeDriverRequirements(
    existingTasks: TaskWithDriver[],
    oldPlanType: string,
    newPlanType: string,
    oldUnitCount: number,
    newUnitCount: number,
    appointmentTime: Date,
    movingPartnerId?: number
  ): Promise<ReassignmentPlan> {
    const plan: ReassignmentPlan = {
      driversToKeep: [],
      driversToRemove: [],
      unitsNeedingNewDriver: []
    };

    // Get the new plan's driver type requirements
    const newRequirements = DRIVER_REQUIREMENTS[newPlanType as keyof typeof DRIVER_REQUIREMENTS];
    if (!newRequirements) {
      console.warn(`Unknown plan type: ${newPlanType}, defaulting to DIY requirements`);
      return plan;
    }

    // Group existing tasks by unit and find unique drivers per unit
    const driversByUnit = new Map<number, TaskWithDriver>();
    for (const task of existingTasks) {
      if (task.driverId && task.driver && !driversByUnit.has(task.unitNumber)) {
        driversByUnit.set(task.unitNumber, task);
      }
    }

    // Track which units need new drivers (start with all units that will exist)
    const unitsNeedingDriver = new Set<number>();
    for (let unit = 1; unit <= newUnitCount; unit++) {
      unitsNeedingDriver.add(unit);
    }

    // Analyze each existing driver assignment
    const existingDrivers: { driverId: number; unitNumber: number; task: TaskWithDriver }[] = [];
    for (const [unitNumber, task] of driversByUnit) {
      if (task.driverId && task.driver) {
        existingDrivers.push({ driverId: task.driverId, unitNumber, task });
      }
    }

    // Sort by unit number so we process in order
    existingDrivers.sort((a, b) => a.unitNumber - b.unitNumber);

    // Process each existing driver
    for (const { driverId, unitNumber, task } of existingDrivers) {
      const driver = task.driver!;
      const driverName = `${driver.firstName} ${driver.lastName}`;
      const driverPhone = driver.phoneNumber;

      // Check if this unit still exists in the new configuration
      if (unitNumber > newUnitCount) {
        // Unit was reduced - driver must be removed
        plan.driversToRemove.push({
          driverId,
          driverName,
          driverPhone,
            reason: `a reduction in unit count`
        });
        continue;
      }

      // Determine what driver type is needed for this unit in the new plan
      const neededDriverType = newRequirements.getDriverType(unitNumber);

      // Check if the driver matches the needed type
      const isMP = await isMovingPartnerDriver(driverId, movingPartnerId);
      const isBB = await isBoomboxDriver(driverId);

      const driverCanStayOnUnit = 
        (neededDriverType === 'moving_partner' && isMP) ||
        (neededDriverType === 'boombox' && isBB);

      if (driverCanStayOnUnit) {
        // Driver can stay on their current unit
        const arrivalTime = getUnitSpecificStartTime(appointmentTime, unitNumber);
        plan.driversToKeep.push({
          driverId,
          driverName,
          driverPhone,
          currentUnit: unitNumber,
          newUnit: unitNumber,
          newArrivalTime: arrivalTime
        });
        unitsNeedingDriver.delete(unitNumber);
      } else {
        // Driver type doesn't match - can they be shifted to a different unit?
        // For DIY→Full Service: Boombox driver on Unit 1 can shift to Unit 2+
        if (neededDriverType === 'moving_partner' && isBB) {
          // This is a Boombox driver on Unit 1 when we now need a Moving Partner
          // Try to shift them to the next available Boombox unit
          let shiftedTo: number | null = null;
          for (let targetUnit = 2; targetUnit <= newUnitCount; targetUnit++) {
            if (unitsNeedingDriver.has(targetUnit)) {
              const targetDriverType = newRequirements.getDriverType(targetUnit);
              if (targetDriverType === 'boombox') {
                shiftedTo = targetUnit;
                break;
              }
            }
          }

          if (shiftedTo !== null) {
            // Shift the driver to a later unit
            const arrivalTime = getUnitSpecificStartTime(appointmentTime, shiftedTo);
            plan.driversToKeep.push({
              driverId,
              driverName,
              driverPhone,
              currentUnit: unitNumber,
              newUnit: shiftedTo,
              newArrivalTime: arrivalTime
            });
            unitsNeedingDriver.delete(shiftedTo);
          } else {
            // No unit available to shift to - driver must be removed
            plan.driversToRemove.push({
              driverId,
              driverName,
              driverPhone,
              reason: `a plan change to ${newPlanType}`
            });
          }
        } else {
          // Moving Partner driver when we now need Boombox, or other mismatch
          plan.driversToRemove.push({
            driverId,
            driverName,
            driverPhone,
            reason: `a plan change to ${newPlanType}`
          });
        }
      }
    }

    // Any units still needing drivers go into the slots to fill
    for (const unitNumber of unitsNeedingDriver) {
      plan.unitsNeedingNewDriver.push({
        unitNumber,
        driverType: newRequirements.getDriverType(unitNumber)
      });
    }

    // Sort units needing new drivers by unit number
    plan.unitsNeedingNewDriver.sort((a, b) => a.unitNumber - b.unitNumber);

    // Log the plan for debugging
    console.log(`REASSIGNMENT_PLAN: Analyzing ${oldPlanType} (${oldUnitCount} units) → ${newPlanType} (${newUnitCount} units)`);
    console.log(`  Drivers to keep: ${plan.driversToKeep.length}`);
    plan.driversToKeep.forEach(d => {
      console.log(`    - ${d.driverName}: Unit ${d.currentUnit} → Unit ${d.newUnit}`);
    });
    console.log(`  Drivers to remove: ${plan.driversToRemove.length}`);
    plan.driversToRemove.forEach(d => {
      console.log(`    - ${d.driverName}: ${d.reason}`);
    });
    console.log(`  Units needing new driver: ${plan.unitsNeedingNewDriver.length}`);
    plan.unitsNeedingNewDriver.forEach(u => {
      console.log(`    - Unit ${u.unitNumber}: ${u.driverType}`);
    });

    return plan;
  }

  /**
   * Get existing task assignments with driver info for an appointment
   */
  static async getExistingAssignments(appointmentId: number): Promise<TaskWithDriver[]> {
    const tasks = await prisma.onfleetTask.findMany({
      where: { appointmentId },
      select: {
        id: true,
        taskId: true,
        unitNumber: true,
        stepNumber: true,
        driverId: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            onfleetWorkerId: true
          }
        }
      },
      orderBy: [
        { unitNumber: 'asc' },
        { stepNumber: 'asc' }
      ]
    });

    return tasks;
  }
}

