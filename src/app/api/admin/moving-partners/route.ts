/**
 * @fileoverview Admin API endpoint to fetch all moving partners with related data
 * @source boombox-10.0/src/app/api/admin/movers/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all moving partners with comprehensive related data.
 * Includes appointments, availability, feedback, drivers, vehicles, and cancellations.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin moving partner management dashboard
 * - Partner overview and analytics pages
 * - Comprehensive partner data views
 * - Admin reporting and monitoring systems
 * 
 * INTEGRATION NOTES:
 * - Fetches complete moving partner records with all relations
 * - Includes appointment details with customer information
 * - Returns availability schedules and feedback history
 * - Includes driver relationships and vehicle information
 * - Admin authentication assumed via middleware
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    const movingPartners = await prisma.movingPartner.findMany({
      include: {
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            jobCode: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        availability: true,
        feedback: true,
        approvedDrivers: {
          include: {
            driver: true,
          },
        },
        driverInvitations: true,
        vehicles: true,
        moverCancellations: true,
      },
    });

    return NextResponse.json(movingPartners);
  } catch (error) {
    console.error('Error fetching moving partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moving partners' },
      { status: 500 }
    );
  }
} 