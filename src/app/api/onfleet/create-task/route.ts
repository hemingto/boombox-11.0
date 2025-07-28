/**
 * @fileoverview Onfleet task creation API route
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates linked Onfleet task sequences for storage unit appointments.
 * Creates 3-task sequences (pickup, customer delivery, return) for each storage unit.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/getquote/getquoteform.tsx (line 500: Initial appointment task creation)
 * - src/app/components/admin/AppointmentDetails.tsx (line 250: Additional unit task creation)
 * - src/app/api/appointments/[appointmentId]/edit/route.ts (line 180: Task creation for appointment edits)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - preserves exact API functionality
 * - Creates tasks with dependencies (pickup → customer → return)
 * - Handles both access appointments and regular storage appointments
 * - Supports DIY and Full Service plan types with different team assignments
 * - Includes comprehensive metadata and custom fields for driver app
 *
 * @refactor Extracted business logic into services, utilities, and message templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { createOnfleetTasksWithDatabaseSave } from '@/lib/services/appointmentOnfleetService';
import { CreateOnfleetAppointmentTasksRequestSchema } from '@/lib/validations/api.validations';

// In-memory set to track appointments currently being processed
const processingAppointments = new Set<number>();

// Main API handler
export async function POST(req: NextRequest) {
  let appointmentIdForLock: number | null = null;

  try {
    // Parse and validate request body
    const body = await req.json();
    console.log('Received Onfleet task creation request for appointment:', body.appointmentId);

    const validationResult = CreateOnfleetAppointmentTasksRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const payload = validationResult.data;
    appointmentIdForLock = typeof payload.appointmentId === 'string' 
      ? parseInt(payload.appointmentId, 10) 
      : payload.appointmentId;

    if (isNaN(appointmentIdForLock)) {
      return NextResponse.json(
        { error: 'Invalid appointmentId format' },
        { status: 400 }
      );
    }

    // Prevent duplicate processing with in-memory lock
    if (processingAppointments.has(appointmentIdForLock)) {
      console.warn(`Appointment ${appointmentIdForLock} is already being processed. Rejecting duplicate request.`);
      return NextResponse.json(
        { error: 'Request for this appointment is currently being processed. Please try again in a moment.' },
        { status: 429 }
      );
    }

    processingAppointments.add(appointmentIdForLock);
    console.log(`Processing appointment ${appointmentIdForLock}`);

    // Fetch storage units for access appointments (if not additionalUnitsOnly)
    if (!payload.additionalUnitsOnly && 
        (payload.appointmentType === "Storage Unit Access" || payload.appointmentType === "End Storage Term")) {
      
      const appointmentWithUnits = await prisma.appointment.findUnique({
        where: { id: appointmentIdForLock },
        include: {
          requestedStorageUnits: {
            include: {
              storageUnit: true
            }
          }
        }
      });

      if (appointmentWithUnits) {
        const storageUnitIds = appointmentWithUnits.requestedStorageUnits.map(
          relation => relation.storageUnit.id
        );
        
        // Convert payload to mutable object to add storage unit IDs
        const mutablePayload = { ...payload };
        mutablePayload.storageUnitIds = storageUnitIds;
        Object.assign(payload, mutablePayload);
        
        console.log(`Found and attached storage unit IDs:`, storageUnitIds);
      } else {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
    }

    // @REFACTOR-P9-TEMP: Uses placeholder service implementation until API_004 completes
    // Priority: High | Est: 2h | Dependencies: API_004_ONFLEET_DOMAIN
    // Create Onfleet tasks using centralized service
    const convertedPayload = {
      appointmentId: appointmentIdForLock,
      userId: typeof payload.userId === 'string' 
        ? parseInt(payload.userId, 10) 
        : payload.userId,
      address: payload.address,
      appointmentDateTime: payload.appointmentDateTime,
      appointmentType: payload.appointmentType,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      deliveryReason: payload.deliveryReason,
      description: payload.description,
      selectedPlanName: payload.selectedPlanName,
      selectedLabor: payload.selectedLabor,
      parsedLoadingHelpPrice: payload.parsedLoadingHelpPrice,
      storageUnitIds: payload.storageUnitIds,
      storageUnitCount: payload.storageUnitCount || 1,
      startingUnitNumber: payload.startingUnitNumber,
      additionalUnitsOnly: payload.additionalUnitsOnly
    };

    console.log('Creating Onfleet tasks...');
    const tasks = await createOnfleetTasksWithDatabaseSave(convertedPayload);
    console.log(`Successfully created Onfleet task sequences. Created ${tasks.taskIds.pickup.length} task triads.`);

    return NextResponse.json({
      success: true,
      taskIds: tasks.taskIds,
      shortIds: tasks.shortIds
    });

  } catch (error: any) {
    console.error('Error in Onfleet task creation:', error);
    
    // Provide detailed error information for debugging
    const errorResponse = {
      error: 'Failed to create Onfleet tasks',
      details: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };

    return NextResponse.json(errorResponse, { status: 500 });
  } finally {
    // Always release the lock
    if (appointmentIdForLock !== null) {
      processingAppointments.delete(appointmentIdForLock);
      console.log(`Released lock for appointment ${appointmentIdForLock}`);
    }
    
    // Disconnect Prisma
    await prisma.$disconnect();
  }
}

/**
 * Export function for direct calls (maintain backward compatibility)
 * @source boombox-10.0/src/app/api/onfleet/create-task/route.ts (createLinkedOnfleetTasksDirectly)
 * @REFACTOR-P9-TYPES: Replace any payload type with proper TypeScript interface
 * Priority: Medium | Est: 30min | Dependencies: None
 */
export async function createLinkedOnfleetTasksDirectly(payload: any) {
  console.log('Direct call to createLinkedOnfleetTasksDirectly for appointment:', payload.appointmentId);
  
  try {
    // Validate required fields
    if (!payload.appointmentId) {
      throw new Error('Missing required field: appointmentId');
    }

    if (!payload.userId) {
      throw new Error('Missing required field: userId');
    }

    const appointmentId = parseInt(String(payload.appointmentId), 10);
    if (isNaN(appointmentId)) {
      throw new Error('Invalid appointmentId format');
    }

    // Fetch storage units if needed (for access appointments, non-additional)
    if (!payload.additionalUnitsOnly && 
        (payload.appointmentType === "Storage Unit Access" || payload.appointmentType === "End Storage Term")) {
      
      const appointmentWithUnits = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          requestedStorageUnits: {
            include: {
              storageUnit: true
            }
          }
        }
      });

      if (appointmentWithUnits) {
        const storageUnitIds = appointmentWithUnits.requestedStorageUnits.map(
          relation => relation.storageUnit.id
        );
        payload.storageUnitIds = storageUnitIds;
        console.log('Direct call - found and attached storage unit IDs:', storageUnitIds);
      } else {
        throw new Error('Appointment not found');
      }
    }

    // Convert payload and create tasks
    const convertedPayload = {
      appointmentId,
      userId: parseInt(String(payload.userId), 10),
      address: payload.address || '',
      appointmentDateTime: payload.appointmentDateTime || new Date().toISOString(),
      appointmentType: payload.appointmentType || 'Mobile Storage',
      firstName: payload.firstName || 'Customer',
      lastName: payload.lastName || '',
      phoneNumber: payload.phoneNumber || '',
      deliveryReason: payload.deliveryReason,
      description: payload.description,
      selectedPlanName: payload.selectedPlanName,
      selectedLabor: payload.selectedLabor,
      parsedLoadingHelpPrice: payload.parsedLoadingHelpPrice,
      storageUnitIds: payload.storageUnitIds,
      storageUnitCount: payload.storageUnitCount || 1,
      startingUnitNumber: payload.startingUnitNumber,
      additionalUnitsOnly: payload.additionalUnitsOnly
    };

    const tasks = await createOnfleetTasksWithDatabaseSave(convertedPayload);
    
    return {
      success: true,
      taskIds: tasks.taskIds,
      shortIds: tasks.shortIds
    };
  } catch (error: any) {
    console.error('Error in direct Onfleet task creation:', error);
    throw error;
  }
} 