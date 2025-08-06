/**
 * @fileoverview API endpoint to fetch jobs/appointments for admin management
 * @source boombox-10.0/src/app/api/admin/jobs/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns appointments/jobs with optional date filtering.
 * Provides comprehensive job data including customer, moving partner, driver, and storage info.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin jobs management interface
 * - Admin dashboard job listings
 * - Job scheduling and tracking
 * - Admin job oversight tools
 * 
 * INTEGRATION NOTES:
 * - Supports optional 'date' query parameter for filtering jobs by specific date
 * - Returns extensive appointment data with all related entities
 * - Includes user, movingPartner, onfleetTasks with drivers
 * - Includes storage unit information (both start and requested units)
 * - Includes pricing, tracking, and service timing information
 * - Orders results by appointment time ascending
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    let whereClause = {};
    if (dateParam) {
      const targetDate = new Date(dateParam);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause = {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      };
    }

    const jobs = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        jobCode: true,
        status: true,
        date: true,
        appointmentType: true,
        user: true,
        movingPartner: true,
        onfleetTasks: {
          include: {
            driver: true
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
        },
        address: true,
        zipcode: true,
        numberOfUnits: true,
        planType: true,
        insuranceCoverage: true,
        loadingHelpPrice: true,
        monthlyStorageRate: true,
        monthlyInsuranceRate: true,
        quotedPrice: true,
        invoiceTotal: true,
        description: true,
        deliveryReason: true,
        trackingToken: true,
        trackingUrl: true,
        invoiceUrl: true,
        serviceStartTime: true,
        serviceEndTime: true,
        thirdPartyMovingPartner: true
      },
      orderBy: {
        time: 'asc',
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 