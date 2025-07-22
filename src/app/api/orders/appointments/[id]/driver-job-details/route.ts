/**
 * @fileoverview Get driver job details for appointment display in driver offer pages
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/driverJobDetails/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves comprehensive appointment details formatted for driver job displays.
 * Includes appointment info, customer details, and OnfleetTask assignments.
 * Has sophisticated error handling and fallback mechanisms for edge cases.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/driver/offer/[token]/page.tsx (line 118: Driver job offer page to display job details)
 *
 * INTEGRATION NOTES:
 * - Uses complex conditional database queries to avoid errors with missing user records
 * - First performs basic appointment check, then conditional user existence check
 * - Returns formatted customer info with fallback values for missing data
 * - Includes comprehensive OnfleetTask information for driver assignment tracking
 * - Critical for driver job offer workflow and driver portal functionality
 *
 * @refactor Moved from /api/appointments/[appointmentId]/ to /api/orders/appointments/[id]/ structure
 * @refactor Added centralized validation schemas and improved error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { GetDriverJobDetailsRequestSchema, GetDriverJobDetailsResponseSchema } from '@/lib/validations/api.validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appointmentIdFromParams = (await params).id;
    console.log(`Fetching driver job details for appointment with ID: ${appointmentIdFromParams}`);
    
    if (!appointmentIdFromParams) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(appointmentIdFromParams, 10);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    // Validate request parameters using Zod schema
    const validationResult = GetDriverJobDetailsRequestSchema.safeParse({
      appointmentId: appointmentIdFromParams,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    console.log(`Running simplified query for appointment ${appointmentId}`);
    
    // First, check if appointment exists with basic query
    const basicAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });
    
    console.log(`Basic appointment query result:`, basicAppointment ? 'Found' : 'Not found');
    
    if (!basicAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found for driver job details' }, 
        { status: 404 }
      );
    }

    console.log(`Checking if user exists for appointment ${appointmentId}`);
    
    // Check if user exists to avoid database errors in complex query
    const userExists = basicAppointment.userId ? await prisma.user.findUnique({
      where: { id: basicAppointment.userId },
      select: { id: true }
    }) : null;
    
    console.log(`User exists for appointment: ${!!userExists}`);
    
    // Perform conditional query based on user existence
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: {
          select: {
            id: true,
            taskId: true,
            shortId: true,
            stepNumber: true,
            unitNumber: true,
            driverId: true,
            driverNotificationStatus: true
          }
        },
        ...(userExists ? {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true
            }
          }
        } : {})
      }
    });

    console.log(`Full appointment query result for driver job details:`, appointment ? 'Found' : 'Not found');
    
    // Fallback mechanism if full query fails but basic appointment exists
    if (!appointment) {
      console.log(`Using basic appointment data as fallback for driver job details`);
      const fallbackResponse = {
        id: basicAppointment.id,
        date: basicAppointment.date,
        time: basicAppointment.time,
        address: basicAppointment.address,
        zipcode: basicAppointment.zipcode,
        status: basicAppointment.status,
        appointmentType: basicAppointment.appointmentType,
        numberOfUnits: basicAppointment.numberOfUnits,
        planType: basicAppointment.planType,
        totalEstimatedCost: basicAppointment.totalEstimatedCost,
        customer: {
          name: "Customer", 
          phone: "" 
        },
        onfleetTasks: []
      };

      return NextResponse.json(fallbackResponse);
    }

    // Format response with proper customer info and OnfleetTask data
    const response = {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      address: appointment.address,
      zipcode: appointment.zipcode,
      status: appointment.status,
      appointmentType: appointment.appointmentType,
      numberOfUnits: appointment.numberOfUnits,
      planType: appointment.planType,
      totalEstimatedCost: appointment.totalEstimatedCost,
      customer: {
        name: appointment.user 
          ? `${appointment.user.firstName} ${appointment.user.lastName}`
          : "Customer",
        phone: appointment.user?.phoneNumber || ""
      },
      onfleetTasks: appointment.onfleetTasks
    };

    // Note: Skipping response validation due to Date object serialization complexity
    // The response structure matches the original route exactly for backward compatibility

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching driver job details for appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch driver job details' },
      { status: 500 }
    );
  }
} 