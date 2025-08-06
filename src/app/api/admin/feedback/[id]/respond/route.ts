/**
 * @fileoverview Admin feedback response API - Send email response to customer feedback
 * @source boombox-10.0/src/app/api/admin/feedback/[id]/respond/route.ts (lines 1-139)
 * @refactor Migrated to centralized utilities and messaging templates with improved error handling
 * 
 * ENDPOINT FUNCTIONALITY:
 * - Handles feedback responses for both appointment and packing supply feedback
 * - Sends email responses using SendGrid with centralized email templates
 * - Updates feedback records with response status and content
 * - Creates admin audit log entries for response tracking
 * 
 * BUSINESS LOGIC:
 * - Validates admin authentication and permissions
 * - Supports dual feedback types (regular vs packing supply)
 * - Maintains consistent email formatting with template system
 * - Preserves original response workflow and error handling
 * 
 * USED BY:
 * - Admin dashboard feedback management interface
 * - Customer service response workflows
 * - Negative feedback resolution system
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { adminFeedbackResponseTemplate } from '@/lib/messaging/templates/email/admin';
import { 
  findFeedbackById,
  markFeedbackAsResponded,
  createFeedbackResponseLog 
} from '@/lib/utils/adminTaskUtils';
import { NegativeFeedbackRequestSchema } from '@/lib/validations/api.validations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = NegativeFeedbackRequestSchema.parse(body);
    const { emailSubject, emailBody, feedbackType } = validatedData;
    
    const feedbackId = parseInt((await params).id);

    // Find feedback by ID (handles both types)
    const feedbackData = await findFeedbackById(feedbackId);

    if (!feedbackData) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const { feedback, userEmail, userName, jobCode, isPackingSupply } = feedbackData;

    // Send email using centralized MessageService
    const emailResult = await MessageService.sendEmail({
      to: userEmail,
      from: session.user.email,
      subject: emailSubject,
      template: adminFeedbackResponseTemplate,
      variables: {
        emailBody,
      },
    });

    if (!emailResult.success) {
      console.error('Failed to send feedback response email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email response' },
        { status: 500 }
      );
    }

    // Update feedback record with response
    const updatedFeedback = await markFeedbackAsResponded(
      feedbackId,
      emailBody,
      isPackingSupply
    );

    // Create admin log entry
    await createFeedbackResponseLog(
      admin.id,
      feedbackId,
      jobCode,
      isPackingSupply
    );

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error sending feedback response:', error);
    return NextResponse.json(
      { error: 'Failed to send feedback response' },
      { status: 500 }
    );
  }
}