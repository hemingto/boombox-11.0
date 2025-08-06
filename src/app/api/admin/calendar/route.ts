/**
 * @fileoverview API endpoint to fetch all appointments for admin calendar view
 * @source boombox-10.0/src/app/api/admin/calendar/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all appointments with related data for admin calendar display.
 * Includes customer, moving partner, and driver information for comprehensive calendar view.
 *
 * USED BY (boombox-10.0 files):
 * - Admin calendar interface
 * - Admin dashboard scheduling view
 * - Appointment management overview
 * - Admin scheduling tools
 *
 * INTEGRATION NOTES:
 * - Returns all appointments with user, movingPartner, and onfleetTasks relations
 * - Filters onfleetTasks to show only those with assigned drivers
 * - Transforms data to include primary driver name for backward compatibility
 * - Uses TypeScript interfaces for type safety
 * - Orders onfleetTasks by unitNumber ascending and takes first driver
 *
 * @refactor Removed unused import getPrimaryDriverForAppointment
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
// import { Appointment, User, MovingPartner, Driver, OnfleetTask } from '@prisma/client';

// Define the expected type for the fetched appointments
// type AppointmentWithIncludes = Appointment & {
//   user: Pick<User, 'firstName' | 'lastName'>;
//   movingPartner: Pick<MovingPartner, 'name'> | null;
//   onfleetTasks: (OnfleetTask & {
//     driver: Pick<Driver, 'firstName' | 'lastName'> | null;
//   })[];
// };

export async function GET() {
  try {
    // Use the defined type for the findMany result
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        movingPartner: {
          select: {
            name: true,
          },
        },
        onfleetTasks: {
          where: {
            driverId: { not: null },
          },
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            unitNumber: 'asc',
          },
          take: 1,
        },
      },
    });

    // Format the appointments to maintain backward compatibility
    const formattedAppointments = appointments.map(appointment => {
      // Get the primary driver from the first OnfleetTask
      const primaryDriver =
        appointment.onfleetTasks.length > 0
          ? appointment.onfleetTasks[0].driver
          : null;

      return {
        ...appointment,
        driver: primaryDriver
          ? {
              name: `${primaryDriver.firstName} ${primaryDriver.lastName}`.trim(),
            }
          : null,
      };
    });

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
