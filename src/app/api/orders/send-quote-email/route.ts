/**
 * @fileoverview Send quote email API - Email detailed price quotes to customers
 * @source boombox-10.0/src/app/api/send-quote-email/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that sends beautifully formatted quote emails to customers containing
 * detailed pricing information, service details, and booking links. Generates HTML
 * email content dynamically based on quote data using centralized template system.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/reusablecomponents/sendquoteemailpopup.tsx (line 66: Customer requests quote email from popup modal)
 *
 * INTEGRATION NOTES:
 * - Uses SendGrid for email delivery - critical integration, DO NOT modify
 * - Generates dynamic HTML content with quote-specific pricing details
 * - Includes booking CTA with proper URL generation
 * - Handles optional insurance and storage unit configurations
 * - Template-based email generation for consistency and maintainability
 *
 * @refactor Moved from /api/send-quote-email/ to /api/orders/send-quote-email/ structure,
 *           replaced inline HTML generation with centralized template system,
 *           added comprehensive validation with Zod schema,
 *           extracted business logic into reusable utility functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/lib/messaging/MessageService';
import { quoteEmail } from '@/lib/messaging/templates/email/booking';
import { 
  processQuoteDataForTemplate, 
  validateQuoteEmailData, 
  type QuoteEmailData 
} from '@/lib/utils/quoteUtils';
import { SendQuoteEmailRequestSchema } from '@/lib/validations/api.validations';

export async function POST(request: NextRequest) {
  try {
    // Validate environment configuration
    if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
      console.error('SendGrid API Key or From Email not configured. Cannot send quote email.');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const requestBody = await request.json();
    
    // Validate with Zod schema
    const validationResult = SendQuoteEmailRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('Quote email validation failed:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid quote data format',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const quoteData: QuoteEmailData = validationResult.data;

    // Additional runtime validation with type guard
    if (!validateQuoteEmailData(quoteData)) {
      console.error('Quote email data failed runtime validation:', quoteData);
      return NextResponse.json(
        { error: 'Invalid quote data structure' },
        { status: 400 }
      );
    }

    // Process quote data into template variables
    const templateVariables = processQuoteDataForTemplate(quoteData);

    // Send email using centralized messaging service
    const emailResult = await MessageService.sendEmail(
      quoteData.email,
      quoteEmail,
      templateVariables
    );

    if (!emailResult.success) {
      console.error('Failed to send quote email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send quote email' },
        { status: 500 }
      );
    }

    console.log(`Quote email sent successfully to ${quoteData.email}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Quote email sent successfully',
      messageId: emailResult.messageId
    });

  } catch (error: unknown) {
    console.error('Error in send-quote-email route:', error);
    
    // Handle different error types appropriately
    if (error instanceof Error && error.name === 'SyntaxError') {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error while sending quote email' },
      { status: 500 }
    );
  }
} 