/**
 * @fileoverview Admin task API for negative feedback processing and email responses
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (feedback task display logic)
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (feedback response processing logic)
 * @refactor PHASE 4 - Admin Domain Routes - Task-specific route implementation
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns negative feedback task details for admin dashboard display
 * POST endpoint: Processes feedback response with email sending and status updates
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task management interface for feedback review and response
 * - Customer service workflows for negative feedback resolution
 * - Email response and communication tracking systems
 * 
 * INTEGRATION NOTES:
 * - Replaces complex taskId parsing logic with direct feedbackId parameter
 * - Uses centralized NegativeFeedbackService for business logic
 * - Implements proper Zod validation and TypeScript interfaces
 * - Maintains admin authentication and logging requirements
 * - Preserves exact business logic for 99.9% compatibility
 * - Handles both regular feedback and packing supply feedback types
 * - Integrates SendGrid email sending for customer communication
 * 
 * @refactor Extracted from 716-line monolithic admin tasks route for better organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { NegativeFeedbackService } from '@/lib/services/admin/NegativeFeedbackService';
import { 
  NegativeFeedbackParamsSchema,
  NegativeFeedbackRequestSchema,
  NegativeFeedbackResponseSchema
} from '@/lib/validations/api.validations';

const negativeFeedbackService = new NegativeFeedbackService();

/**
 * GET endpoint: Retrieve negative feedback task details
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 127-211)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
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
    const validation = NegativeFeedbackParamsSchema.safeParse(resolvedParams);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid feedback ID format' },
        { status: 400 }
      );
    }

    const { feedbackId } = validation.data;

    // Get task details from service
    const task = await negativeFeedbackService.getNegativeFeedbackTask(feedbackId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate response format
    const responseValidation = NegativeFeedbackResponseSchema.safeParse(task);
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
    console.error('Error retrieving negative feedback task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint: Process feedback response with email sending
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
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
    const paramsValidation = NegativeFeedbackParamsSchema.safeParse(resolvedParams);
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid feedback ID format' },
        { status: 400 }
      );
    }

    const { feedbackId } = paramsValidation.data;

    // Validate request body
    const body = await request.json();
    const requestValidation = NegativeFeedbackRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: requestValidation.error.errors
        },
        { status: 400 }
      );
    }

    const feedbackRequest = requestValidation.data;

    // Process feedback response
    const result = await negativeFeedbackService.processFeedbackResponse(
      feedbackId,
      admin.id,
      session.user.email,
      feedbackRequest
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Response processing failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(result.updatedFeedback);

  } catch (error) {
    console.error('Error processing feedback response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}