/**
 * @fileoverview Admin task API for requested storage unit assignment to appointments
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (requested-unit task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts (assignment processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns requested storage unit assignment task details for admin dashboard display
 * POST endpoint: Processes requested storage unit assignment with driver verification and trailer photos
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for requested unit assignments
 * - Storage access appointment workflows where customers request specific units
 * - Customer-requested storage unit preparation and verification tasks
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct appointmentId parameter
 * - Uses centralized AssignRequestedUnitService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles unit indexing for multi-unit requested storage scenarios
 * - Manages driver verification and OnfleetTask associations
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { AssignRequestedUnitService } from '@/lib/services/admin/AssignRequestedUnitService';
import { 
  AssignRequestedUnitParamsSchema,
  AssignRequestedUnitRequestSchema,
  AssignRequestedUnitResponseSchema
} from '@/lib/validations/api.validations';

const assignRequestedUnitService = new AssignRequestedUnitService();

/**
 * GET endpoint: Retrieve requested storage unit assignment task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 531-576)
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
    const validation = AssignRequestedUnitParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    // Extract unitIndex and storageUnitId from query parameters (required for GET)
    const url = new URL(request.url);
    const unitIndexParam = url.searchParams.get('unitIndex');
    const storageUnitIdParam = url.searchParams.get('storageUnitId');

    if (!unitIndexParam || !storageUnitIdParam) {
      return NextResponse.json(
        { error: 'Missing required query parameters: unitIndex and storageUnitId' },
        { status: 400 }
      );
    }

    const unitIndex = parseInt(unitIndexParam, 10);
    const storageUnitId = parseInt(storageUnitIdParam, 10);

    if (isNaN(unitIndex) || isNaN(storageUnitId)) {
      return NextResponse.json(
        { error: 'Invalid unitIndex or storageUnitId format' },
        { status: 400 }
      );
    }

    // Get task details from service
    const task = await assignRequestedUnitService.getRequestedUnitAssignmentTask(appointmentId, unitIndex, storageUnitId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = AssignRequestedUnitResponseSchema.safeParse(task);
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
    console.error('Error retrieving requested unit assignment task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint: Process requested storage unit assignment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/assign-requested-unit/route.ts
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
    const paramsValidation = AssignRequestedUnitParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = AssignRequestedUnitRequestSchema.safeParse(body);
    
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

    // Process requested storage unit assignment
    const result = await assignRequestedUnitService.assignRequestedStorageUnit(
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

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error processing requested unit assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}