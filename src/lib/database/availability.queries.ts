/**
 * @fileoverview Optimized database queries for availability system
 * @source boombox-10.0/src/app/api/availability/route.ts (database operations)
 * @refactor Extracted and optimized queries to eliminate N+1 problems
 */

import { prisma } from '@/lib/database/prismaClient';
import { MovingPartnerStatus } from '@prisma/client';
import { 
  PlanType, 
  PartnerWithAvailability, 
  DriverWithAvailability,
  ResourceAvailabilityData,
  AvailabilityQueryFilters
} from '@/types/availability.types';

/**
 * Get blocked users for a specific date range
 * @source Original inline blocked date fetching
 */
export async function getBlockedUsersForDateRange(
  startDate: Date,
  endDate: Date
): Promise<{ blockedMoverIds: Set<number>; blockedDriverIds: Set<number> }> {
  const blockedEntries = await prisma.blockedDate.findMany({
    where: {
      blockedDate: {
        gte: startDate,
        lt: endDate
      }
    },
    select: {
      userId: true,
      userType: true
    }
  });

  const blockedMoverIds = new Set<number>(
    blockedEntries.filter((b: { userType: string }) => b.userType === 'mover').map((b: { userId: number }) => b.userId)
  );
  
  const blockedDriverIds = new Set<number>(
    blockedEntries.filter((b: { userType: string }) => b.userType === 'driver').map((b: { userId: number }) => b.userId)
  );

  return { blockedMoverIds, blockedDriverIds };
}

/**
 * Get available moving partners for specific days of week
 * @source Original mover fetching logic with optimization
 */
export async function getAvailableMovingPartners(
  daysOfWeek: string[],
  excludeBlockedIds: Set<number> = new Set()
): Promise<PartnerWithAvailability[]> {
  const excludeArray = Array.from(excludeBlockedIds);
  
  return await prisma.movingPartner.findMany({
    where: {
      status: MovingPartnerStatus.ACTIVE,
      ...(excludeArray.length > 0 && { id: { notIn: excludeArray } }),
      availability: {
        some: {
          dayOfWeek: { in: daysOfWeek },
          endTime: { gte: '08:00' }, // Business start hour
          isBlocked: false
        }
      }
    },
    include: {
      availability: {
        where: {
          dayOfWeek: { in: daysOfWeek },
          isBlocked: false
        }
      }
    }
  });
}

/**
 * Get available drivers for specific days of week
 * @source Original driver fetching logic with optimization
 */
export async function getAvailableDrivers(
  daysOfWeek: string[],
  excludeBlockedIds: Set<number> = new Set()
): Promise<DriverWithAvailability[]> {
  const excludeArray = Array.from(excludeBlockedIds);
  
  return await prisma.driver.findMany({
    where: {
      status: 'Active',
      ...(excludeArray.length > 0 && { id: { notIn: excludeArray } }),
      availability: {
        some: {
          dayOfWeek: { in: daysOfWeek },
          endTime: { gte: '08:00' }, // Business start hour
          isBlocked: false
        }
      }
    },
    include: {
      availability: {
        where: {
          dayOfWeek: { in: daysOfWeek },
          isBlocked: false
        }
      }
    }
  });
}

/**
 * Get comprehensive resource availability data for multiple days
 * @source Combined logic from original month view optimization
 */
export async function getResourceAvailabilityForDays(
  daysOfWeek: string[],
  planType: PlanType,
  startDate?: Date,
  endDate?: Date
): Promise<ResourceAvailabilityData> {
  // Get blocked users if date range provided
  const { blockedMoverIds, blockedDriverIds } = startDate && endDate 
    ? await getBlockedUsersForDateRange(startDate, endDate)
    : { blockedMoverIds: new Set<number>(), blockedDriverIds: new Set<number>() };

  // Get movers only if needed for FULL_SERVICE
  const movers = planType === 'FULL_SERVICE' 
    ? await getAvailableMovingPartners(daysOfWeek, blockedMoverIds)
    : [];

  // Get drivers if needed
  const driversNeeded = planType === 'DIY' || (planType === 'FULL_SERVICE');
  const drivers = driversNeeded 
    ? await getAvailableDrivers(daysOfWeek, blockedDriverIds)
    : [];

  return {
    movers,
    drivers,
    blockedMoverIds,
    blockedDriverIds
  };
}

/**
 * Get time slot booking conflicts for moving partners
 * @source Original booking conflict checking
 */
export async function getPartnerBookingConflicts(
  partnerIds: number[],
  dateStart: Date,
  dateEnd: Date
): Promise<Map<number, Array<{ bookingDate: Date; endDate: Date }>>> {
  if (partnerIds.length === 0) return new Map();

  const bookings = await prisma.timeSlotBooking.findMany({
    where: {
      movingPartnerAvailability: {
        movingPartnerId: { in: partnerIds }
      },
      bookingDate: {
        gte: dateStart,
        lt: dateEnd
      }
    },
    select: {
      movingPartnerAvailability: {
        select: { movingPartnerId: true }
      },
      bookingDate: true,
      endDate: true
    }
  });

  const conflictMap = new Map<number, Array<{ bookingDate: Date; endDate: Date }>>();
  
  for (const booking of bookings) {
    const partnerId = booking.movingPartnerAvailability.movingPartnerId;
    if (!conflictMap.has(partnerId)) {
      conflictMap.set(partnerId, []);
    }
    conflictMap.get(partnerId)!.push({
      bookingDate: booking.bookingDate,
      endDate: booking.endDate
    });
  }

  return conflictMap;
}

/**
 * Get driver time slot booking conflicts
 * @source Original driver booking conflict checking
 */
export async function getDriverBookingConflicts(
  driverIds: number[],
  dateStart: Date,
  dateEnd: Date
): Promise<Map<number, Array<{ bookingDate: Date; endDate: Date }>>> {
  if (driverIds.length === 0) return new Map();

  const bookings = await prisma.driverTimeSlotBooking.findMany({
    where: {
      driverAvailability: {
        driverId: { in: driverIds }
      },
      bookingDate: {
        gte: dateStart,
        lt: dateEnd
      }
    },
    select: {
      driverAvailability: {
        select: { driverId: true }
      },
      bookingDate: true,
      endDate: true
    }
  });

  const conflictMap = new Map<number, Array<{ bookingDate: Date; endDate: Date }>>();
  
  for (const booking of bookings) {
    const driverId = booking.driverAvailability.driverId;
    if (!conflictMap.has(driverId)) {
      conflictMap.set(driverId, []);
    }
    conflictMap.get(driverId)!.push({
      bookingDate: booking.bookingDate,
      endDate: booking.endDate
    });
  }

  return conflictMap;
}

/**
 * Get Onfleet task conflicts for drivers on a specific date
 * @source Original Onfleet task fetching with deduplication
 */
export async function getOnfleetTasksForDriversAndDate(
  driverIds: number[],
  dateString: string
): Promise<Record<number, Array<{ appointment: { time: Date } }>>> {
  if (driverIds.length === 0) return {};

  const allTasksForDay = await prisma.onfleetTask.findMany({
    where: {
      driverId: { in: driverIds },
      appointment: {
        date: {
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lt: new Date(`${dateString}T23:59:59.999Z`),
        },
        NOT: {
          status: { in: ['Completed', 'Canceled'] }
        }
      }
    },
    select: {
      driverId: true,
      appointmentId: true,
      appointment: {
        select: { time: true }
      }
    }
  });

  // Group tasks by driver, then by appointment (to avoid counting same appointment multiple times)
  const appointmentsByDriver = allTasksForDay.reduce((acc: Record<number, Map<number, { appointment: { time: Date } }>>, task: any) => {
    if (!task.driverId) return acc;
    if (!acc[task.driverId]) {
      acc[task.driverId] = new Map();
    }
    // Use appointmentId as key to deduplicate multiple tasks for same appointment
    acc[task.driverId].set(task.appointmentId, { appointment: { time: task.appointment.time } });
    return acc;
  }, {} as Record<number, Map<number, { appointment: { time: Date } }>>);

  // Convert to the expected format
  return Object.fromEntries(
    Object.entries(appointmentsByDriver).map(([driverId, appointmentMap]: [string, Map<number, { appointment: { time: Date } }>]) => [
      parseInt(driverId), 
      Array.from(appointmentMap.values())
    ])
  );
}

/**
 * Count total available resources by day of week
 * @source Month view optimization logic
 */
export async function getResourceCountsByDayOfWeek(
  daysOfWeek: string[],
  planType: PlanType,
  excludeBlockedMoverIds: Set<number> = new Set(),
  excludeBlockedDriverIds: Set<number> = new Set()
): Promise<{
  moversByDay: Record<string, number>;
  driversByDay: Record<string, number>;
}> {
  const moversByDay: Record<string, number> = {};
  const driversByDay: Record<string, number> = {};

  // Get mover counts if needed
  if (planType === 'FULL_SERVICE') {
    const moverCounts = await prisma.movingPartner.groupBy({
      by: ['id'],
      where: {
        status: MovingPartnerStatus.ACTIVE,
        ...(excludeBlockedMoverIds.size > 0 && { id: { notIn: Array.from(excludeBlockedMoverIds) } }),
        availability: {
          some: {
            dayOfWeek: { in: daysOfWeek },
            endTime: { gte: '08:00' },
            isBlocked: false
          }
        }
      },
      _count: {
        id: true
      }
    });

    // Initialize with 0 counts
    daysOfWeek.forEach(day => {
      moversByDay[day] = 0;
    });

    // Count movers available for each day
    for (const day of daysOfWeek) {
      const availableForDay = await prisma.movingPartner.count({
        where: {
          status: MovingPartnerStatus.ACTIVE,
          ...(excludeBlockedMoverIds.size > 0 && { id: { notIn: Array.from(excludeBlockedMoverIds) } }),
          availability: {
            some: {
              dayOfWeek: day,
              endTime: { gte: '08:00' },
              isBlocked: false
            }
          }
        }
      });
      moversByDay[day] = availableForDay;
    }
  }

  // Get driver counts if needed
  const driversNeeded = planType === 'DIY' || (planType === 'FULL_SERVICE');
  if (driversNeeded) {
    // Initialize with 0 counts
    daysOfWeek.forEach(day => {
      driversByDay[day] = 0;
    });

    // Count drivers available for each day
    for (const day of daysOfWeek) {
      const availableForDay = await prisma.driver.count({
        where: {
          status: 'Active',
          ...(excludeBlockedDriverIds.size > 0 && { id: { notIn: Array.from(excludeBlockedDriverIds) } }),
          availability: {
            some: {
              dayOfWeek: day,
              endTime: { gte: '08:00' },
              isBlocked: false
            }
          }
        }
      });
      driversByDay[day] = availableForDay;
    }
  }

  return { moversByDay, driversByDay };
}

/**
 * Batch query for all date-specific availability data
 * @source Optimized combination of multiple queries
 */
export async function getDateSpecificAvailabilityData(
  date: string,
  dayOfWeek: string,
  planType: PlanType
): Promise<{
  resourceData: ResourceAvailabilityData;
  partnerBookingConflicts: Map<number, Array<{ bookingDate: Date; endDate: Date }>>;
  driverBookingConflicts: Map<number, Array<{ bookingDate: Date; endDate: Date }>>;
  onfleetTasks: Record<number, Array<{ appointment: { time: Date } }>>;
}> {
  const dateStart = new Date(`${date}T00:00:00.000Z`);
  const dateEnd = new Date(`${date}T23:59:59.999Z`);

  // Get resource availability data
  const resourceData = await getResourceAvailabilityForDays(
    [dayOfWeek],
    planType,
    dateStart,
    dateEnd
  );

  // Get all conflict data in parallel
  const [partnerBookingConflicts, driverBookingConflicts, onfleetTasks] = await Promise.all([
    getPartnerBookingConflicts(resourceData.movers.map(m => m.id), dateStart, dateEnd),
    getDriverBookingConflicts(resourceData.drivers.map(d => d.id), dateStart, dateEnd),
    getOnfleetTasksForDriversAndDate(resourceData.drivers.map(d => d.id), date)
  ]);

  return {
    resourceData,
    partnerBookingConflicts,
    driverBookingConflicts,
    onfleetTasks
  };
} 