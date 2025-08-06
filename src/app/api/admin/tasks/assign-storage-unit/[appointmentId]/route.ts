/**
 * @fileoverview Admin task API for storage unit assignment to appointments
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (storage task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts (assignment logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns storage unit assignment task details for admin dashboard display
 * POST endpoint: Executes storage unit assignment to appointment with validation and logging
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface
 * - Storage unit assignment workflows in admin dashboard
 * - Task detail displays and assignment forms
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct appointmentId parameter
 * - Uses centralized AssignStorageUnitService for business logic
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
import { AssignStorageUnitService } from '@/lib/services/admin/AssignStorageUnitService';
import { 
  AssignStorageUnitParamsSchema,
  AssignStorageUnitRequestSchema,
  AssignStorageUnitResponseSchema,
  AdminTaskAssignmentSuccessSchema
} from '@/lib/validations/api.validations';

const assignStorageUnitService = new AssignStorageUnitService();

/**
 * GET endpoint: Retrieve storage unit assignment task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 578-602)
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
    const validation = AssignStorageUnitParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    // Extract unitIndex from query parameters if provided
    const url = new URL(request.url);
    const unitIndexParam = url.searchParams.get('unitIndex');
    const unitIndex = unitIndexParam ? parseInt(unitIndexParam, 10) : undefined;

    // Get task details from service
    const task = await assignStorageUnitService.getStorageUnitAssignmentTask(appointmentId, unitIndex);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = AssignStorageUnitResponseSchema.safeParse(task);
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
    console.error('Error retrieving storage unit assignment task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint: Execute storage unit assignment to appointment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-storage-units/route.ts
 */
export async function POST(
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
    const paramsValidation = AssignStorageUnitParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = AssignStorageUnitRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const assignmentRequest = requestValidation.data;

    // Execute storage unit assignment
    const result = await assignStorageUnitService.assignStorageUnitsToAppointment(
      appointmentId,
      admin.id,
      assignmentRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Assignment failed' },
        { status: 400 }
      );
    }

    // Validate success response
    const successValidation = AdminTaskAssignmentSuccessSchema.safeParse(result);
    if (!successValidation.success) {
      console.error('Success response validation failed:', successValidation.error);
      // Still return success to user, but log validation issue
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error executing storage unit assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}