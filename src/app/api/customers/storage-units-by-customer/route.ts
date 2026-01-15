/**
 * @fileoverview API endpoint to fetch storage units for a specific customer
 * @source boombox-10.0/src/app/api/storageUnitsByUser/route.ts
 * @refactor PHASE 4 - Customers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all active storage units for a specific customer.
 * Filters for currently occupied units with completed start appointments.
 * 
 * USED BY (boombox-10.0 files):
 * - Customer dashboard showing current storage units
 * - Storage unit management interface
 * - Customer account pages
 * - Storage unit access workflows
 * 
 * INTEGRATION NOTES:
 * - Requires userId query parameter
 * - Filters for active units (usageEndDate: null)
 * - Only includes units from completed start appointments
 * - Returns storage unit details with appointment information
 * 
 * @refactor Removed manual Prisma disconnect (handled by connection pooling)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(req: NextRequest) {
  try {
    const userId = parseInt(req.nextUrl.searchParams.get('userId') || '', 10);
    // Optional: exclude a specific appointment from pending checks (for edit mode)
    const excludeAppointmentId = parseInt(req.nextUrl.searchParams.get('excludeAppointmentId') || '', 10) || undefined;

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        message: 'Missing userId parameter',
        error: 'Missing userId'
      }, { status: 400 });
    }

    // Build the appointment filter for access requests
    const appointmentFilter: any = {
      userId: userId, // Only consider appointments for this user
      status: { in: ['Scheduled', 'Pending', 'Confirmed', 'In Progress'] },
      appointmentType: { in: ['Storage Unit Access', 'End Storage Term'] }
    };

    // In edit mode, exclude the current appointment from pending checks
    if (excludeAppointmentId) {
      appointmentFilter.id = { not: excludeAppointmentId };
    }

    const storageUnits = await prisma.storageUnitUsage.findMany({
      where: { 
        userId, 
        usageEndDate: null, // Filter for currently occupied units
        startAppointment: {
          status: 'Completed',
        },
      },
      include: {
        storageUnit: {
          include: {
            // Check for any active access storage appointments for this unit by this user
            // Use explicit list of active statuses to ensure we only match truly pending appointments
            accessRequests: {
              where: {
                appointment: appointmentFilter
              },
              include: {
                appointment: {
                  select: { 
                    id: true, 
                    date: true, 
                    status: true 
                  }
                }
              },
              take: 1 // Only need to know if one exists
            }
          }
        },
        startAppointment: {
          select: {
            id: true,
            address: true,
            status: true
          }
        }
      },
    });

    return NextResponse.json({
      success: true,
      data: storageUnits,
      message: storageUnits.length === 0 
        ? 'No active storage units found' 
        : `Found ${storageUnits.length} storage unit${storageUnits.length > 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error fetching storage units:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch storage units',
      error: 'Internal server error'
    }, { status: 500 });
  }
} 