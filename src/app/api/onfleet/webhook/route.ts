/**
 * @fileoverview Onfleet webhook endpoint for processing delivery and storage unit notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Onfleet webhook validation and manual testing
 * POST endpoint: Processes Onfleet webhook events for packing supply deliveries and storage unit operations
 *
 * USED BY (boombox-10.0 files):
 * - Onfleet API webhook configuration (external system)
 * - Manual testing and validation endpoints
 *
 * INTEGRATION NOTES:
 * - CRITICAL: Onfleet integration - DO NOT modify webhook processing logic
 * - Handles both packing supply delivery and storage unit service workflows
 * - Processes payments, notifications, and payout calculations
 * - Updates appointment statuses and sends customer SMS notifications
 *
 * @refactor Dramatically simplified using domain-specific services and step handlers
 */

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Import refactored webhook services
import { PackingSupplyWebhookService } from '@/lib/services/webhooks/PackingSupplyWebhookService';
import { StorageUnitWebhookService } from '@/lib/services/webhooks/StorageUnitWebhookService';
import {
  getMetadataValue
} from '@/lib/utils/onfleetWebhookUtils';
import { 
  OnfleetWebhookPayloadSchema,
  type OnfleetWebhookPayload
} from '@/lib/validations/api.validations';

// GET handler for Onfleet webhook validation
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const check = url.searchParams.get('check');
    
    if (check) {
      // Onfleet webhook validation - return with minimal headers and explicit encoding
      return new Response(check, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json({ 
      error: 'Request processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 

// POST handler for webhook processing
export async function POST(req: NextRequest) {
  try {
    const webhookData = await req.json();
    
    // Validate webhook payload
    const validationResult = OnfleetWebhookPayloadSchema.safeParse(webhookData);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error.issues);
      return NextResponse.json({ 
        error: 'Invalid webhook payload',
        details: validationResult.error.issues 
      }, { status: 400 });
    }

    const { taskId, time, triggerName, data } = validationResult.data;
    
    const taskDetails = data?.task;
    const metadata = taskDetails?.metadata;
    const step = getMetadataValue(metadata, 'step');

    // Enhanced logging for debugging
    console.log(`Webhook received: ${triggerName} for task ${taskDetails?.shortId}`);
    console.log(`Task metadata:`, metadata);

    // Determine webhook type and route to appropriate service
    const jobType = getMetadataValue(metadata, 'job_type');
    const isPackingSupplyTask = jobType === 'packing_supply_delivery';

    console.log(`Job type metadata: ${jobType}`);
    console.log(`Is packing supply task: ${isPackingSupplyTask}`);

    if (isPackingSupplyTask) {
      console.log(`Processing packing supply webhook: ${triggerName} for task ${taskDetails?.shortId}`);
      
      const result = await PackingSupplyWebhookService.handle(validationResult.data);
      
      if (result.status && !result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      
      return NextResponse.json(result);
    } else {
      console.log(`Processing storage unit webhook: ${triggerName} for task ${taskDetails?.shortId}, step ${step}`);
      
      const result = await StorageUnitWebhookService.handle(validationResult.data);
      
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
      
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 