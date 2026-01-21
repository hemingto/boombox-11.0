/**
 * @fileoverview Update existing appointment with plan changes, unit modifications, and time updates
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * PUT endpoint that handles appointment modifications including plan switches (DIY ↔ Full Service),
 * storage unit count changes, time updates, moving partner assignments, and driver reassignments.
 *
 * USED BY:
 * - Edit appointment forms for access storage and additional storage appointments
 *
 * INTEGRATION NOTES:
 * - Uses AppointmentUpdateOrchestrator for coordinated updates
 * - Onfleet integration handled by OnfleetTaskUpdateService
 * - Notifications handled by NotificationOrchestrator
 * - Database transactions ensure atomic updates
 *
 * @refactor Refactored from ~492 lines to ~165 lines using orchestrator pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { AppointmentUpdateOrchestrator } from '@/lib/services/AppointmentUpdateOrchestrator';
import { 
  UpdateAppointmentRequestSchema, 
  UpdateAppointmentResponseSchema 
} from '@/lib/validations/api.validations';
import { validateAppointmentDateTimeFormat } from '@/lib/utils/appointmentUtils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Trigger driver assignment through existing API
 * @deprecated Will be refactored when driver-assign route is migrated
 */
async function triggerDriverAssignment(appointmentId: number): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/onfleet/driver-assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        action: 'assign',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Driver assignment trigger failed:', errorData);
    } else {
      console.log(`✅ Successfully triggered driver assignment for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('❌ Error triggering driver assignment:', error);
  }
}

/**
 * Parse and normalize update input data
 */
function parseUpdateInput(validatedData: any, appointmentDate: Date): any {
  // Convert userId to number
  const numericUserId = typeof validatedData.userId === 'string' 
    ? parseInt(validatedData.userId, 10) 
    : validatedData.userId;
  
  if (isNaN(numericUserId)) {
    throw new Error('Invalid userId format');
  }

  // Parse storage unit IDs
  const selectedStorageUnits = validatedData.selectedStorageUnits || [];

  // Calculate final moving partner IDs based on plan type
  const movingPartnerId = validatedData.planType === 'Full Service Plan' 
    ? validatedData.movingPartnerId 
    : null;
  const thirdPartyMovingPartnerId = validatedData.planType === 'Third Party Loading Help' 
    ? validatedData.thirdPartyMovingPartnerId 
    : null;

  // Parse loading help price
  const loadingHelpPrice = validatedData.selectedLabor?.price 
    ? parseFloat(validatedData.selectedLabor.price.replace(/[^\d.]/g, '')) 
    : validatedData.parsedLoadingHelpPrice || 0;

  // Calculate final unit count based on appointment type
  // For Access Storage appointments: use selectedStorageUnits.length + additionalUnitsCount
  // For Initial Pickup/Additional Storage: use storageUnitCount directly
  const isAccessStorageAppointment = 
    validatedData.appointmentType === 'Storage Unit Access' ||
    validatedData.appointmentType === 'End Storage Term';
  
  let numberOfUnits: number;
  if (isAccessStorageAppointment) {
    // Access Storage: count from selected units
    const baseUnitCount = selectedStorageUnits.length || 0;
    const additionalUnits = validatedData.additionalUnitsCount || 0;
    numberOfUnits = baseUnitCount + additionalUnits;
  } else {
    // Initial Pickup / Additional Storage: use storageUnitCount from payload
    numberOfUnits = validatedData.storageUnitCount || validatedData.numberOfUnits || 1;
  }

  return {
    userId: numericUserId,
    address: validatedData.address,
    zipcode: validatedData.zipCode,
    planType: validatedData.planType,
    appointmentDateTime: appointmentDate,
    description: validatedData.description || 'No added info',
    selectedLabor: validatedData.selectedLabor,
    movingPartnerId,
    thirdPartyMovingPartnerId,
    selectedStorageUnits,
    numberOfUnits,
    loadingHelpPrice,
    monthlyStorageRate: validatedData.monthlyStorageRate,
    monthlyInsuranceRate: validatedData.monthlyInsuranceRate,
    quotedPrice: validatedData.calculatedTotal,
    // Pass through additional fields for Onfleet task creation
    deliveryReason: validatedData.deliveryReason,
    appointmentType: validatedData.appointmentType,
    insuranceCoverage: validatedData.selectedInsurance?.label || null,
    status: validatedData.status || 'Scheduled',
  };
}

/**
 * PUT /api/orders/appointments/[id]/edit
 * Update an existing appointment
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. Validate and parse input
    const { id: appointmentIdParam } = await params;
    const appointmentId = parseInt(appointmentIdParam, 10);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID format' }, 
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const validatedData = UpdateAppointmentRequestSchema.parse(body);

    // 2. Validate appointment date time
    const dateTimeValidation = validateAppointmentDateTimeFormat(validatedData.appointmentDateTime);
    if (!dateTimeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: dateTimeValidation.error }, 
        { status: 400 }
      );
    }
    
    const appointmentDate = dateTimeValidation.date!;

    // 3. Parse and normalize input data
    const updateInput = parseUpdateInput(validatedData, appointmentDate);

    console.log(`📝 Processing appointment update for ID ${appointmentId}`);

    // 4. Process update through orchestrator
    const result = await AppointmentUpdateOrchestrator.processAppointmentUpdate(
      appointmentId,
      updateInput
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Update failed' },
        { status: 400 }
      );
    }

    // 5. Trigger driver assignment if needed
    if (result.changes?.driverReassignmentRequired) {
      console.log(`🚗 Triggering driver assignment for appointment ${appointmentId}`);
      await triggerDriverAssignment(appointmentId);
    }

    // 6. Revalidate cache
    if (result.appointment?.userId) {
      revalidatePath(`/user-page/${result.appointment.userId}/`);
    }

    // 7. Return standardized response
    const response = UpdateAppointmentResponseSchema.parse({
      success: true,
      appointment: result.appointment,
      newUnitsAdded: (result.changes?.unitsAdded?.length ?? 0) > 0,
      newUnitCount: result.changes?.unitsAdded?.length ?? 0,
      changes: result.changes,
      notificationsSent: result.notificationsSent,
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error updating appointment:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    
    // Handle general errors
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update appointment', 
      details: error.message 
    }, { status: 500 });
  }
}
