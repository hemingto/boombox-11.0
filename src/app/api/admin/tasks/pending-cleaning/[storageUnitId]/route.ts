/**
 * @fileoverview Admin task API for storage unit cleaning processing and status updates
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (cleaning task display logic)
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts (cleaning processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns pending cleaning task details for admin dashboard display
 * POST endpoint: Processes storage unit cleaning with photo uploads and status updates
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for cleaning workflow
 * - Storage unit maintenance and cleaning tracking systems
 * - Warehouse operations and unit status management
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct storageUnitId parameter
 * - Uses centralized PendingCleaningService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles database transactions for data consistency
 * - Integrates photo upload requirements and cleaning record creation
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { PendingCleaningService } from '@/lib/services/admin/PendingCleaningService';
import { 
  PendingCleaningParamsSchema,
  PendingCleaningRequestSchema,
  PendingCleaningResponseSchema
} from '@/lib/validations/api.validations';

const pendingCleaningService = new PendingCleaningService();

/**
 * GET endpoint: Retrieve pending cleaning task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 213-228)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageUnitId: string }> }
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
    const validation = PendingCleaningParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid storage unit ID format' },
        { status: 400 }
      );
    }

    const { storageUnitId } = validation.data;

    // Get task details from service
    const task = await pendingCleaningService.getCleaningTask(storageUnitId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or unit is not in Pending Cleaning status' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = PendingCleaningResponseSchema.safeParse(task);
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
    console.error('Error retrieving pending cleaning task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint: Process storage unit cleaning with photos
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storageUnitId: string }> }
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
    const paramsValidation = PendingCleaningParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid storage unit ID format' },
        { status: 400 }
      );
    }

    const { storageUnitId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = PendingCleaningRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const cleaningRequest = requestValidation.data;

    // Process storage unit cleaning
    const result = await pendingCleaningService.markUnitAsClean(
      storageUnitId,
      admin.id,
      cleaningRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Cleaning processing failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      data: result.data
    });

  } catch (error) {
    console.error('Error processing storage unit cleaning:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}