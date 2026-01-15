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
import { validateOnfleetSignature } from '@/lib/utils/onfleetSignatureValidation';
import { prisma } from '@/lib/database/prismaClient';
import { 
  OnfleetWebhookPayloadSchema,
  type OnfleetWebhookPayload
} from '@/lib/validations/api.validations';

// GET handler for Onfleet webhook validation
export async function GET(req: NextRequest) {
  console.log('=== [WEBHOOK] GET request received ===');
  try {
    const url = new URL(req.url);
    const check = url.searchParams.get('check');
    
    console.log(`[WEBHOOK] GET params - check: ${check}`);
    
    if (check) {
      // Onfleet webhook validation - return with minimal headers and explicit encoding
      console.log(`[WEBHOOK] Returning validation check value: ${check}`);
      return new Response(check, {
        status: 200,
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    console.log('[WEBHOOK] No check param, returning OK');
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (error) {
    console.error('[WEBHOOK] GET request error:', error);
    return NextResponse.json({ 
      error: 'Request processing failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 

// POST handler for webhook processing
export async function POST(req: NextRequest) {
  console.log('=== [WEBHOOK] POST request received ===');
  console.log(`[WEBHOOK] Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Handle empty request body (common during webhook validation)
    const text = await req.text();
    console.log(`[WEBHOOK] Raw body length: ${text?.length || 0} chars`);
    
    if (!text || text.trim() === '') {
      console.log('[WEBHOOK] Empty POST body - likely a validation request');
      return NextResponse.json({ success: true, message: 'Webhook endpoint active' });
    }

    // Validate webhook signature (skips in development)
    if (!await validateOnfleetSignature(req, text)) {
      console.error('[WEBHOOK] Invalid Onfleet signature - rejecting request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.log('[WEBHOOK] Signature validation passed');

    // Log first 500 chars of body for debugging
    console.log(`[WEBHOOK] Raw body preview: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);

    let webhookData;
    try {
      webhookData = JSON.parse(text);
      console.log('[WEBHOOK] JSON parsed successfully');
    } catch (parseError) {
      console.error('[WEBHOOK] Failed to parse webhook JSON:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON payload',
        details: parseError instanceof Error ? parseError.message : 'Parse error'
      }, { status: 400 });
    }
    
    // Log parsed data structure
    console.log(`[WEBHOOK] Parsed data keys: ${Object.keys(webhookData).join(', ')}`);
    console.log(`[WEBHOOK] triggerName: ${webhookData.triggerName}`);
    console.log(`[WEBHOOK] taskId: ${webhookData.taskId}`);
    console.log(`[WEBHOOK] time: ${webhookData.time}`);
    
    // Validate webhook payload
    const validationResult = OnfleetWebhookPayloadSchema.safeParse(webhookData);
    if (!validationResult.success) {
      console.error('[WEBHOOK] Validation failed:', JSON.stringify(validationResult.error.issues, null, 2));
      return NextResponse.json({ 
        error: 'Invalid webhook payload',
        details: validationResult.error.issues 
      }, { status: 400 });
    }
    console.log('[WEBHOOK] Payload validation passed');

    const { taskId, time, triggerName, data } = validationResult.data;
    
    const taskDetails = data?.task;
    const metadata = taskDetails?.metadata;
    const step = getMetadataValue(metadata, 'step');

    // Enhanced logging for debugging
    console.log('=== [WEBHOOK] Event Details ===');
    console.log(`[WEBHOOK] Trigger: ${triggerName}`);
    console.log(`[WEBHOOK] Task ID: ${taskId}`);
    console.log(`[WEBHOOK] Task shortId: ${taskDetails?.shortId}`);
    console.log(`[WEBHOOK] Step: ${step}`);
    console.log(`[WEBHOOK] Time: ${time}`);
    console.log(`[WEBHOOK] Metadata:`, JSON.stringify(metadata, null, 2));

    // Determine webhook type and route to appropriate service
    const jobType = getMetadataValue(metadata, 'job_type');
    const isPackingSupplyTask = jobType === 'packing_supply_delivery';

    console.log(`[WEBHOOK] Job type: ${jobType || 'not specified (storage unit)'}`);
    console.log(`[WEBHOOK] Is packing supply task: ${isPackingSupplyTask}`);

    // Check for duplicate webhook (idempotency) for storage unit tasks
    // Packing supply tasks are tracked differently via order status
    let onfleetTask = null;
    if (!isPackingSupplyTask && taskDetails?.shortId) {
      onfleetTask = await prisma.onfleetTask.findFirst({
        where: { shortId: taskDetails.shortId }
      });
      
      if (onfleetTask?.lastProcessedWebhookTime === BigInt(time)) {
        console.log(`[WEBHOOK] Skipping duplicate webhook: ${triggerName} at ${time} for task ${taskDetails.shortId}`);
        return NextResponse.json({ success: true, message: 'Already processed' });
      }
    }

    if (isPackingSupplyTask) {
      console.log(`[WEBHOOK] >>> Routing to PackingSupplyWebhookService`);
      
      const result = await PackingSupplyWebhookService.handle(validationResult.data);
      console.log(`[WEBHOOK] PackingSupply result:`, JSON.stringify(result, null, 2));
      
      if (result.status && !result.success) {
        console.log(`[WEBHOOK] PackingSupply returned error status: ${result.status}`);
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      
      console.log('[WEBHOOK] PackingSupply processing complete');
      return NextResponse.json(result);
    } else {
      console.log(`[WEBHOOK] >>> Routing to StorageUnitWebhookService`);
      console.log(`[WEBHOOK] Trigger: ${triggerName}, Step: ${step}`);
      
      const result = await StorageUnitWebhookService.handle(validationResult.data);
      console.log(`[WEBHOOK] StorageUnit result:`, JSON.stringify(result, null, 2));
      
      if (!result.success) {
        console.log(`[WEBHOOK] StorageUnit processing failed: ${result.message}`);
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
      
      // Update webhook timestamp for idempotency tracking
      if (onfleetTask) {
        await prisma.onfleetTask.update({
          where: { id: onfleetTask.id },
          data: { lastProcessedWebhookTime: BigInt(time) }
        });
        console.log(`[WEBHOOK] Updated lastProcessedWebhookTime to ${time} for task ${onfleetTask.shortId}`);
      }
      
      console.log('[WEBHOOK] StorageUnit processing complete');
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('[WEBHOOK] Unhandled error:', error);
    console.error('[WEBHOOK] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 