/**
 * @fileoverview Admin API endpoint to check if feedback exists for an appointment
 * @source boombox-10.0/src/app/api/feedback/check/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that checks if feedback has been submitted for a specific appointment.
 * Returns boolean indicating feedback existence for admin verification workflows.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin feedback management interface
 * - Appointment completion verification
 * - Customer service workflows
 * - Feedback collection systems
 * 
 * INTEGRATION NOTES:
 * - Requires appointmentId query parameter
 * - Validates appointmentId is numeric
 * - Returns { exists: boolean } response format
 * - Simple database lookup with existence check
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointmentId parameter' },
        { status: 400 }
      );
    }

    const appointmentIdInt = Number(appointmentId);

    if (isNaN(appointmentIdInt)) {
      return NextResponse.json(
        { error: 'Invalid appointmentId format' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findUnique({
      where: { appointmentId: appointmentIdInt },
    });

    return NextResponse.json({ exists: !!feedback });
  } catch (error) {
    console.error('Error checking feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 