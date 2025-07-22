/**
 * @fileoverview Mover change utility functions
 * @source boombox-10.0/src/app/api/customer/mover-change-response/route.ts (business logic functions)
 * @source boombox-10.0/src/app/api/customer/verify-mover-change-token/route.ts (token validation logic)
 * @refactor Extracted mover change business logic into reusable utilities
 */

import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';

/**
 * Find available drivers for appointment
 */
export async function findAvailableDrivers(appointment: any, task: any, excludeDriverIds: number[] = []) {
  const appointmentDate = new Date(appointment.date);
  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" });
  const appointmentTime = new Date(appointment.time);
  const hours = appointmentTime.getHours();
  const minutes = appointmentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return prisma.driver.findMany({
    where: {
      isApproved: true,
      applicationComplete: true,
      status: 'Active',
      onfleetWorkerId: { not: null },
      id: { notIn: excludeDriverIds },
      availability: {
        some: {
          dayOfWeek,
          startTime: { lte: formattedTime },
          endTime: { gte: formattedTime },
          isBlocked: false
        }
      },
      NOT: {
        assignedTasks: {
          some: {
            appointment: {
              date: { equals: appointmentDate },
              time: {
                gte: new Date(appointmentTime.getTime() - (60 * 60 * 1000)),
                lte: new Date(appointmentTime.getTime() + (60 * 60 * 1000))
              }
            }
          }
        }
      }
    },
    include: { _count: { select: { assignedTasks: true } } },
    orderBy: [{ assignedTasks: { _count: 'desc' } }]
  });
}

/**
 * Assign moving partner driver to appointment
 */
export async function assignMovingPartnerDriver(appointment: any, movingPartnerId: number) {
  // Get available drivers for this moving partner
  const movingPartnerDrivers = await prisma.movingPartnerDriver.findMany({
    where: { 
      movingPartnerId,
      isActive: true 
    },
    include: {
      driver: {
        include: {
          availability: true
        }
      }
    }
  });

  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" });
  const hours = appointmentTime.getHours();
  const minutes = appointmentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Find available driver from this moving partner
  const availableDriver = movingPartnerDrivers.find(mpd => {
    const driver = mpd.driver;
    return driver.isApproved && 
           driver.applicationComplete && 
           driver.status === 'Active' &&
           driver.onfleetWorkerId &&
           driver.availability.some(avail => 
             avail.dayOfWeek === dayOfWeek &&
             avail.startTime <= formattedTime &&
             avail.endTime >= formattedTime &&
             !avail.isBlocked
           );
  });

  return availableDriver?.driver || null;
}

/**
 * Decode mover change token
 */
export function decodeMoverChangeToken(token: string) {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid token format');
  }
}

/**
 * Validate mover change token data
 */
export function validateMoverChangeTokenData(tokenData: any) {
  const { appointmentId, suggestedMovingPartnerId, originalMovingPartnerId, timestamp } = tokenData;

  if (!appointmentId || !suggestedMovingPartnerId || !originalMovingPartnerId || !timestamp) {
    throw new Error('Invalid token data');
  }

  return { appointmentId, suggestedMovingPartnerId, originalMovingPartnerId, timestamp };
}

/**
 * Check if mover change request is still pending
 */
export function checkMoverChangeRequestStatus(appointment: any) {
  let appointmentDescription;
  try {
    appointmentDescription = appointment.description ? JSON.parse(appointment.description) : {};
  } catch {
    appointmentDescription = {};
  }

  const moverChangeRequest = appointmentDescription.moverChangeRequest;
  if (!moverChangeRequest || moverChangeRequest.status !== 'pending') {
    throw new Error('Mover change request has already been processed');
  }

  return moverChangeRequest;
}

/**
 * Create time slot booking for moving partner
 */
export async function createTimeSlotBooking(appointment: any, movingPartnerId: number) {
  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const endTime = new Date(appointmentTime.getTime() + (3 * 60 * 60 * 1000)); // 3 hours duration

  // Find availability slot for the moving partner
  const dayOfWeek = appointmentDate.toLocaleDateString("en-US", { weekday: "long" });
  const hours = appointmentTime.getHours();
  const minutes = appointmentTime.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const availabilitySlot = await prisma.movingPartnerAvailability.findFirst({
    where: {
      movingPartnerId,
      dayOfWeek,
      startTime: { lte: formattedTime },
      endTime: { gte: formattedTime },
      isBlocked: false
    }
  });

  if (availabilitySlot) {
    await prisma.timeSlotBooking.create({
      data: {
        movingPartnerAvailabilityId: availabilitySlot.id,
        appointmentId: appointment.id,
        bookingDate: appointmentDate,
        endDate: endTime
      }
    });
  }
}

/**
 * Process DIY plan conversion
 */
export async function processDiyPlanConversion(appointment: any) {
  const onfleetClient = await getOnfleetClient();
  
  for (const task of appointment.onfleetTasks) {
    try {
      // Move task to Boombox Delivery Network team
      await (onfleetClient as any).tasks.update(task.taskId, {
        container: { type: "TEAM", team: process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID },
        worker: null
      });

      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: { 
          driverId: null,
          driverNotificationStatus: 'switched_to_diy'
        }
      });

      // Find and notify available Boombox drivers
      const availableDrivers = await findAvailableDrivers(appointment, task);
      
      if (availableDrivers.length > 0) {
        const topDriver = availableDrivers[0];
        
        // Assign the highest-rated driver
        await (onfleetClient as any).tasks.update(task.taskId, {
          worker: topDriver.onfleetWorkerId
        });

        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: { 
            driverId: topDriver.id,
            driverNotificationStatus: 'assigned_diy_driver'
          }
        });
      }
    } catch (error) {
      console.error(`Error processing DIY task ${task.taskId}:`, error);
    }
  }
} 