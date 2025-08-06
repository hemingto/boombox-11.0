/**
 * @fileoverview Twilio inbound SMS webhook handler
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts
 * @refactor Migrated to clean architecture with centralized utilities and templates
 * 
 * BUSINESS LOGIC PRESERVED:
 * - Twilio signature validation with HMAC-SHA1
 * - Multi-domain message routing (mover changes, packing supply, driver tasks)
 * - Complex state management for reconfirmation declines
 * - Error handling and user feedback
 * - Database operations across multiple models
 * 
 * ARCHITECTURAL IMPROVEMENTS:
 * - Centralized message templates (15+ templates)
 * - Extracted utilities for validation, classification, and database queries
 * - Service-based architecture for complex business logic
 * - Proper TypeScript types and Zod validation
 * - Environment configuration integration
 * 
 * USAGE:
 * - Used by Twilio webhook for inbound SMS processing
 * - Handles customer mover change responses via SMS
 * - Processes driver task acceptance/decline via SMS
 * - Manages packing supply route offer responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateTwilioRequest, 
  parseInboundMessage 
} from '@/lib/utils';
import { InboundMessageRouter } from '@/lib/services/messaging/InboundMessageRouter';
import { 
  TwilioInboundRequestSchema,
  type TwilioInboundResponse 
} from '@/lib/validations/api.validations';

export async function POST(req: NextRequest) {
  try {
    // Parse the form data from Twilio
    const formData = await req.formData();
    const { from, body } = parseInboundMessage(formData);
    
    // Convert FormData to object for validation
    const requestBody: Record<string, string> = {};
    formData.forEach((value, key) => {
      requestBody[key] = value.toString();
    });
    
    // Validate the request format
    const validation = TwilioInboundRequestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('Invalid Twilio request format:', validation.error.issues);
      return NextResponse.json({ 
        error: 'Invalid request format',
        details: validation.error.issues 
      }, { status: 400 });
    }
    
    // Validate the request signature from Twilio
    if (!await validateTwilioRequest(req, requestBody)) {
      console.error('Twilio signature validation failed');
      return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
    }
    
    // Validate required fields
    if (!from || !body) {
      return NextResponse.json({ 
        error: 'Missing required fields: From and Body are required' 
      }, { status: 400 });
    }
    
    // Route message to appropriate handler
    const router = new InboundMessageRouter();
    const result = await router.routeMessage(from, body);
    
    // Return structured response
    const response: TwilioInboundResponse = {
      success: result.success,
      ...(result.action && { action: result.action as any }),
      ...(result.type && { type: result.type }),
      ...(result.appointmentId && { appointmentId: result.appointmentId }),
      ...(result.routeId && { routeId: result.routeId }),
      ...(result.error && { error: result.error })
    };
    
    if (!result.success) {
      return NextResponse.json(response, { 
        status: result.error === 'User not found' ? 404 : 400 
      });
    }
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error processing Twilio webhook:', error);
    
    const response: TwilioInboundResponse = {
      success: false,
      error: error.message || 'Failed to process SMS'
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}