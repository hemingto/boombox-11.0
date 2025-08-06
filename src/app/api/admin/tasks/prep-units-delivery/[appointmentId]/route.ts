/**
 * @fileoverview Admin task API for storage unit preparation for customer delivery/access appointments
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (prep-delivery task display logic)
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts (unit prep processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns unit delivery preparation task details for admin dashboard display
 * POST endpoint: Processes unit preparation by marking storage units as ready for delivery
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for unit delivery preparation workflow
 * - Storage unit access appointment coordination
 * - Warehouse operations and unit staging management
 * - Customer service delivery scheduling
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct appointmentId parameter
 * - Uses centralized PrepUnitsDeliveryService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles database transactions for unit readiness updates
 * - Integrates warehouse staging and physical unit preparation workflow
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { PrepUnitsDeliveryService } from '@/lib/services/admin/PrepUnitsDeliveryService';
import { 
  PrepUnitsDeliveryParamsSchema,
  PrepUnitsDeliveryRequestSchema,
  PrepUnitsDeliveryResponseSchema
} from '@/lib/validations/api.validations';

const prepUnitsDeliveryService = new PrepUnitsDeliveryService();

/**
 * GET endpoint: Retrieve unit delivery preparation task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 315-344)
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
    const validation = PrepUnitsDeliveryParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = validation.data;

    // Get task details from service
    const task = await prepUnitsDeliveryService.getPrepDeliveryTask(appointmentId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or units are already prepared' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = PrepUnitsDeliveryResponseSchema.safeParse(task);
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
    console.error('Error retrieving prep units delivery task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint: Process unit preparation for delivery
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/prep-units-delivery/route.ts
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
    const paramsValidation = PrepUnitsDeliveryParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const { appointmentId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = PrepUnitsDeliveryRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const prepRequest = requestValidation.data;

    // Process unit preparation for delivery
    const result = await prepUnitsDeliveryService.prepareUnitsForDelivery(
      appointmentId,
      admin.id,
      prepRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Unit preparation failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      updatedUnits: result.updatedUnits
    });

  } catch (error) {
    console.error('Error processing unit preparation for delivery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}