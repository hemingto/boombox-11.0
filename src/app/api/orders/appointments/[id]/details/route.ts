/**
 * @fileoverview Get detailed appointment information including user, driver, moving partner, and storage units
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/getAppointmentDetails/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches comprehensive appointment details including:
 * - User information (firstName, lastName, email, phoneNumber)
 * - Primary driver information (from OnfleetTasks with lowest unitNumber)
 * - Moving partner details (name, hourly rate, contact info)
 * - Storage unit usage (both current and requested units)
 * - Backward compatibility formatting for existing components
 *
 * USED BY (boombox-10.0 files):
 * - src/app/admin/tasks/[taskId]/assign-storage-unit/page.tsx (line 79: Admin task management)
 * - src/app/admin/tasks/[taskId]/prep-units-delivery/page.tsx (line 86: Delivery preparation)
 * - src/app/admin/tasks/[taskId]/assign-requested-unit/page.tsx (line 113: Unit assignment)
 * - src/app/components/edit-appointment/editaddstorageappointment.tsx (line 66: Appointment editing)
 * - src/app/components/edit-appointment/editaccessstorageappointment.tsx (line 64: Access appointment editing)
 *
 * INTEGRATION NOTES:
 * - Uses complex Prisma include for related data (user, onfleetTasks, driver, movingPartner, storage units)
 * - Formats response with driver field for backward compatibility
 * - Returns primary driver (lowest unitNumber from OnfleetTasks)
 * - Critical for admin task management and appointment editing workflows
 *
 * @refactor Moved from /api/appointments/[appointmentId]/ to /api/orders/appointments/[id]/ structure
 * @refactor Added centralized driver utilities and validation schemas
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Validate appointment ID parameter
    if (!resolvedParams.id) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(String(resolvedParams.id), 10);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    // Fetch appointment with comprehensive related data (preserving exact boombox-10.0 structure)
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
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
                driverLicenseFrontPhoto: true
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
            id: true,
            name: true,
            phoneNumber: true,
            hourlyRate: true,
            onfleetTeamId: true
          }
        },
        storageStartUsages: {
          include: {
            storageUnit: true
          }
        },
        requestedStorageUnits: {
          include: {
            storageUnit: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Format response to maintain backward compatibility (exact same format as boombox-10.0)
    const appointmentWithTasks = appointment as typeof appointment & {
      onfleetTasks: Array<{ driver: { firstName: string; lastName: string; phoneNumber: string | null; driverLicenseFrontPhoto: string | null } | null }>;
    };
    
    const formattedAppointment = {
      ...appointment,
      driver: appointmentWithTasks.onfleetTasks?.length > 0 ? appointmentWithTasks.onfleetTasks[0].driver : null
    };

    // Response formatted for backward compatibility with existing components

    return NextResponse.json(formattedAppointment);

  } catch (error) {
    console.error('Error fetching appointment details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointment details', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 