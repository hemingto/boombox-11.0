/**
 * @fileoverview Packing supply tracking verification API - POST endpoint for order tracking
 * @source boombox-10.0/src/app/api/packing-supplies/tracking/verify/route.ts (lines 1-179)
 * @refactor Migrated to centralized utilities with improved tracking URL handling and feedback token generation
 * 
 * ENDPOINT FUNCTIONALITY:
 * - Verifies packing supply order tracking tokens
 * - Fetches live tracking URLs from Onfleet API
 * - Generates feedback tokens for delivered orders
 * - Returns comprehensive order status and delivery progress
 * 
 * BUSINESS LOGIC:
 * - Validates tracking tokens against database records
 * - Provides fallback tracking URLs if API fails
 * - Generates time-limited feedback tokens for completed deliveries
 * - Formats delivery progress with real-time status updates
 * 
 * USED BY:
 * - Customer tracking interface for packing supply orders
 * - Order status monitoring and delivery updates
 * - Post-delivery feedback collection workflows
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { createFeedbackToken } from '@/lib/utils/onfleetWebhookUtils';
import {
  fetchOnfleetTrackingUrl,
  formatPackingSupplyTrackingResponse
} from '@/lib/utils/packingSupplyUtils';

// Tracking verification request schema
import { z } from 'zod';

const PackingSupplyTrackingRequestSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedData = PackingSupplyTrackingRequestSchema.parse(body);
    const { token } = validatedData;

    // Find the packing supply order by tracking token
    const order = await prisma.packingSupplyOrder.findFirst({
      where: { trackingToken: token },
      include: {
        orderDetails: {
          include: {
            product: true,
          },
        },
        assignedDriver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          }
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Invalid or expired tracking link' }, { status: 404 });
    }

    // Get live tracking URL from Onfleet API if we have a task short ID
    let liveTrackingUrl: string | undefined = undefined;
    if (order.onfleetTaskShortId) {
      console.log(`Fetching live tracking URL for task: ${order.onfleetTaskShortId}`);
      liveTrackingUrl = await fetchOnfleetTrackingUrl(order.onfleetTaskShortId) || undefined;
      
      if (liveTrackingUrl) {
        console.log(`Successfully fetched live tracking URL: ${liveTrackingUrl}`);
      } else {
        console.warn(`Failed to fetch live tracking URL for task: ${order.onfleetTaskShortId}`);
        // Fallback to direct URL construction
        liveTrackingUrl = `https://onfleet.com/track/${order.onfleetTaskShortId}`;
        console.log(`Using fallback tracking URL: ${liveTrackingUrl}`);
      }
    }

    // Generate feedback token if order is delivered
    let feedbackToken: string | undefined = undefined;
    if (order.status === 'Delivered' && order.onfleetTaskShortId) {
      feedbackToken = createFeedbackToken(order.onfleetTaskShortId, 30); // 30 days expiry
    }

    // Format and return response data
    const responseData = formatPackingSupplyTrackingResponse(
      order,
      liveTrackingUrl,
      feedbackToken
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Packing supply tracking verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}