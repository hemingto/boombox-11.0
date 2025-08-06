/**
 * @fileoverview Admin task API for warehouse location updates for storage unit usages
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (update-location task display logic)
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts (location update processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns warehouse location update task details for admin dashboard display
 * PATCH endpoint: Processes warehouse location updates for storage unit usages
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for warehouse location update workflow
 * - Storage unit inventory management and tracking systems
 * - Warehouse operations and location assignment
 * - Inventory auditing and location verification
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct usageId parameter
 * - Uses centralized UpdateLocationService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles database transactions for location updates
 * - Integrates warehouse inventory management workflow
 * - Fixes original bug in admin log creation (missing await)
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { UpdateLocationService } from '@/lib/services/admin/UpdateLocationService';
import { 
  UpdateLocationParamsSchema,
  UpdateLocationRequestSchema,
  UpdateLocationResponseSchema
} from '@/lib/validations/api.validations';

const updateLocationService = new UpdateLocationService();

/**
 * GET endpoint: Retrieve warehouse location update task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 608-640)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ usageId: string }> }
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
    const validation = UpdateLocationParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid usage ID format' },
        { status: 400 }
      );
    }

    const { usageId } = validation.data;

    // Get task details from service
    const task = await updateLocationService.getLocationUpdateTask(usageId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or usage does not need location update' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = UpdateLocationResponseSchema.safeParse(task);
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
    console.error('Error retrieving warehouse location update task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint: Process warehouse location update for storage unit usage
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/update-location/route.ts
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ usageId: string }> }
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
    const paramsValidation = UpdateLocationParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid usage ID format' },
        { status: 400 }
      );
    }

    const { usageId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = UpdateLocationRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const locationRequest = requestValidation.data;

    // Additional validation for warehouse location format
    const formatValidation = updateLocationService.validateWarehouseLocationFormat(locationRequest.warehouseLocation);
    if (!formatValidation.valid) {
      return NextResponse.json(
        { error: formatValidation.error },
        { status: 400 }
      );
    }

    // Process warehouse location update
    const result = await updateLocationService.updateWarehouseLocation(
      usageId,
      admin.id,
      locationRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Location update failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      updatedUsage: result.updatedUsage
    });

  } catch (error) {
    console.error('Error processing warehouse location update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}