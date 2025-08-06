/**
 * @fileoverview Admin endpoint for updating moving partner contact status for appointments
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts
 * @refactor Migrated to use centralized utilities and validation schemas
 * 
 * PATCH /api/admin/appointments/[id]/called-moving-partner
 * 
 * Updates appointment with moving partner contact information and creates admin log entry.
 * 
 * ## Request Body
 * ```json
 * {
 *   "calledMovingPartner": boolean,
 *   "gotHoldOfMovingPartner": boolean (optional)
 * }
 * ```
 * 
 * ## Response
 * - 200: Updated appointment object
 * - 400: Invalid request data
 * - 401: Unauthorized (no session)
 * - 404: Admin or appointment not found
 * - 500: Server error
 * 
 * ## Business Logic
 * 1. Validates admin session and permissions
 * 2. Updates appointment contact status fields
 * 3. Creates admin log entry for audit trail
 * 
 * ## Dependencies
 * - NextAuth session management
 * - adminTaskUtils.updateAppointmentMovingPartnerContact()
 * - adminTaskUtils.createMovingPartnerContactLog()
 * - api.validations.UpdateCalledMovingPartnerSchema
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { updateMovingPartnerContactFlags, createMovingPartnerContactLog } from '@/lib/utils/adminTaskUtils';
import { UnassignedDriverRequestSchema } from '@/lib/validations/api.validations';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find admin by session email
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Parse and validate request data
    const requestBody = await request.json();
    const validationResult = UnassignedDriverRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { calledMovingPartner, gotHoldOfMovingPartner } = validationResult.data;
    const appointmentId = parseInt((await params).id);

    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    // Update appointment using centralized utility
    const updatedAppointment = await updateMovingPartnerContactFlags(
      appointmentId,
      calledMovingPartner,
      gotHoldOfMovingPartner
    );

    // Create admin log entry using centralized utility
    await createMovingPartnerContactLog(admin.id, appointmentId, calledMovingPartner);

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment moving partner contact:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}