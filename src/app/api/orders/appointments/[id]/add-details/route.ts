/**
 * @fileoverview Add or update additional details for an appointment
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/addDetails/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that adds or updates additional details for an appointment including
 * items over 100lbs, storage term, access frequency, move description, and conditions.
 * Uses upsert operation to handle both creation and updates gracefully.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/user-page/movedetailspopupform.tsx (line 74: User adding move details via popup form)
 *
 * INTEGRATION NOTES:
 * - Uses Prisma upsert operation for atomic create/update
 * - Critical for customer onboarding flow after appointment booking
 * - No external service integrations - pure database operation
 *
 * @refactor Moved from /api/appointments/[appointmentId]/ to /api/orders/appointments/[id]/ structure
 * Added centralized validation, error handling, and business logic extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentAdditionalDetails } from '@/lib/utils/appointmentUtils';
import { AddAppointmentDetailsRequestSchema } from '@/lib/validations/api.validations';
import type { AppointmentDomainAdditionalInfo } from '@/types/appointment.types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AppointmentDomainAdditionalInfo | { error: string }>> {
  try {
    // Extract and validate appointment ID
    const { id } = await params;
    const appointmentId = parseInt(id, 10);

    if (isNaN(appointmentId) || appointmentId <= 0) {
      return NextResponse.json(
        { error: 'Invalid appointment ID provided' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = AddAppointmentDetailsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const additionalInfo = validationResult.data;

    // Update appointment additional details using centralized utility
    const updatedAppointment = await updateAppointmentAdditionalDetails(
      appointmentId,
      additionalInfo
    );

    // Transform result to match expected AppointmentDomainAdditionalInfo interface
    const result: AppointmentDomainAdditionalInfo = {
      id: updatedAppointment.id,
      appointmentId: updatedAppointment.id,
      itemsOver100lbs: additionalInfo.itemsOver100lbs || false,
      storageTerm: additionalInfo.storageTerm || null,
      storageAccessFrequency: additionalInfo.storageAccessFrequency || null,
      moveDescription: additionalInfo.moveDescription || null,
      conditionsDescription: additionalInfo.conditionsDescription || null,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error adding appointment details:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Appointment not found')) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Failed to update')) {
        return NextResponse.json(
          { error: 'Failed to update appointment details. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error occurred while adding appointment details' },
      { status: 500 }
    );
  }
} 