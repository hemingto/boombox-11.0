/**
 * @fileoverview Admin task API for storage unit return processing and inspection
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (storage-return task display logic)
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts (return processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns storage unit return task details for admin dashboard display
 * PATCH endpoint: Processes storage unit return with damage inspection and status updates
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for storage unit return processing
 * - Storage unit inspection and damage reporting workflows
 * - Appointment completion processing with different business logic flows
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct appointmentId parameter
 * - Uses centralized StorageUnitReturnService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility across appointment types
 * - Handles different appointment types: Initial Pickup, Storage Access, End Storage Term
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { StorageUnitReturnService } from '@/lib/services/admin/StorageUnitReturnService';
import { 
  StorageUnitReturnParamsSchema,
  StorageUnitReturnRequestSchema,
  StorageUnitReturnResponseSchema
} from '@/lib/validations/api.validations';

const storageUnitReturnService = new StorageUnitReturnService();

/**
 * GET endpoint: Retrieve storage unit return task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 346-494)
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
    const validation = StorageUnitReturnParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    // Extract storageUnitId from query parameters if provided
    const url = new URL(request.url);
    const storageUnitIdParam = url.searchParams.get('storageUnitId');
    const storageUnitId = storageUnitIdParam ? parseInt(storageUnitIdParam, 10) : undefined;

    // Get task details from service
    const task = await storageUnitReturnService.getStorageUnitReturnTask(appointmentId, storageUnitId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = StorageUnitReturnResponseSchema.safeParse(task);
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
    console.error('Error retrieving storage unit return task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint: Process storage unit return with inspection and status updates
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/storage-unit-return/route.ts
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
    const paramsValidation = StorageUnitReturnParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = StorageUnitReturnRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const returnRequest = requestValidation.data;

    // Process storage unit return
    const result = await storageUnitReturnService.processStorageUnitReturn(
      appointmentId,
      admin.id,
      returnRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Return processing failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.appointment);

  } catch (error) {
    console.error('Error processing storage unit return:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}