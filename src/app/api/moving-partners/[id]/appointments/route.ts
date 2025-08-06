/**
 * @fileoverview API endpoint to fetch appointments for a moving partner
 * @source boombox-10.0/src/app/api/movers/[moverId]/appointments/route.ts
 * @refactor PHASE 4 - Moving Partners Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all appointments assigned to a specific moving partner.
 * Includes comprehensive related data: customer info, driver details, and storage units.
 * 
 * USED BY (boombox-10.0 files):
 * - Moving partner dashboard appointment listings
 * - Partner job management interface
 * - Appointment scheduling overview
 * - Partner performance tracking
 * 
 * INTEGRATION NOTES:
 * - Returns appointments ordered by date ascending
 * - Includes customer contact information (firstName, lastName, email, phone)
 * - Includes assigned driver details from onfleetTasks relationship
 * - Includes moving partner name and additional appointment info
 * - Includes requested storage units with details
 * - Transforms data to include primary driver for backward compatibility
 * - Filters onfleetTasks to show only those with assigned drivers
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const moverId = parseInt((await params).id);
    console.log('Fetching appointments for moverId:', moverId);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        movingPartnerId: moverId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        onfleetTasks: {
          where: {
            driverId: { not: null }
          },
          include: {
            driver: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
                profilePicture: true,
              }
            }
          },
          orderBy: {
            unitNumber: 'asc'
          },
          take: 1
        },
        movingPartner: {
          select: {
            name: true,
          },
        },
        additionalInfo: true,
        requestedStorageUnits: {
          include: {
            storageUnit: true
          }
        }
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Transform appointments to add driver property for backward compatibility
    const formattedAppointments = appointments.map(appointment => {
      const primaryDriver = appointment.onfleetTasks.length > 0 
        ? appointment.onfleetTasks[0].driver 
        : null;
        
      return {
        ...appointment,
        driver: primaryDriver
      };
    });

    console.log('Found appointments:', formattedAppointments.length);
    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
} 