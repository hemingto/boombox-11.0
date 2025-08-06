/**
 * @fileoverview Admin task API for unassigned driver management and moving partner reminders
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (unassigned task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts (contact tracking logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns unassigned driver task details for admin dashboard display
 * PATCH endpoint: Updates moving partner contact tracking when admin takes action
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for driver assignment oversight
 * - Moving partner communication tracking workflows
 * - Driver assignment reminder processes
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct appointmentId parameter
 * - Uses centralized UnassignedDriverService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { UnassignedDriverService } from '@/lib/services/admin/UnassignedDriverService';
import { 
  UnassignedDriverParamsSchema,
  UnassignedDriverRequestSchema,
  UnassignedDriverResponseSchema,
  AdminTaskAssignmentSuccessSchema
} from '@/lib/validations/api.validations';

const unassignedDriverService = new UnassignedDriverService();

/**
 * GET endpoint: Retrieve unassigned driver task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 300-313)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
): Promise<NextResponse> {
  try {
    // Validate admin session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Validate and parse parameters
    const resolvedParams = await params;
    const validation = UnassignedDriverParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    // Get task details from service
    const task = await unassignedDriverService.getUnassignedDriverTask(appointmentId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = UnassignedDriverResponseSchema.safeParse(task);
    if (!responseValidation.success) {
      console.error('Task response validation failed:', responseValidation.error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      task: responseValidation.data
    });

  } catch (error) {
    console.error('Error retrieving unassigned driver task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint: Update moving partner contact tracking
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/called-moving-partner/route.ts
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
): Promise<NextResponse> {
  try {
    // Validate admin session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Validate and parse parameters
    const resolvedParams = await params;
    const paramsValidation = UnassignedDriverParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = UnassignedDriverRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const contactRequest = requestValidation.data;

    // Update moving partner contact tracking
    const result = await unassignedDriverService.updateMovingPartnerContact(
      appointmentId,
      admin.id,
      contactRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Contact update failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.appointment);

  } catch (error) {
    console.error('Error updating moving partner contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}