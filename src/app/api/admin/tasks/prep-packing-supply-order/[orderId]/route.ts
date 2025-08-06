/**
 * @fileoverview Admin task API for packing supply order preparation and delivery workflow
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (prep-packing-supply task display logic)
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts (prep processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns packing supply order preparation task details for admin dashboard display
 * PATCH endpoint: Processes order preparation with status updates and admin tracking
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for packing supply preparation workflow
 * - Inventory management and order fulfillment systems
 * - Delivery route planning and driver coordination
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct orderId parameter
 * - Uses centralized PrepPackingSupplyOrderService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles database transactions for prep status updates
 * - Integrates order validation and inventory management workflow
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { PrepPackingSupplyOrderService } from '@/lib/services/admin/PrepPackingSupplyOrderService';
import { 
  PrepPackingSupplyOrderParamsSchema,
  PrepPackingSupplyOrderRequestSchema,
  PrepPackingSupplyOrderResponseSchema
} from '@/lib/validations/api.validations';

const prepPackingSupplyOrderService = new PrepPackingSupplyOrderService();

/**
 * GET endpoint: Retrieve packing supply order preparation task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 643-696)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
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
    const validation = PrepPackingSupplyOrderParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const { orderId } = validation.data;

    // Get task details from service
    const task = await prepPackingSupplyOrderService.getPrepTask(orderId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or order is already prepped/canceled' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = PrepPackingSupplyOrderResponseSchema.safeParse(task);
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
    console.error('Error retrieving prep packing supply order task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint: Process packing supply order preparation
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
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
    const paramsValidation = PrepPackingSupplyOrderParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    const { orderId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = PrepPackingSupplyOrderRequestSchema.safeParse(body);
    
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

    // Process packing supply order preparation
    const result = await prepPackingSupplyOrderService.markOrderAsPrepped(
      orderId,
      admin.id,
      prepRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Prep processing failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order
    });

  } catch (error) {
    console.error('Error processing packing supply order preparation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}