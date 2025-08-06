/**
 * @fileoverview Admin API endpoint to check if packing supply feedback exists
 * @source boombox-10.0/src/app/api/packing-supplies/feedback/check/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that checks if feedback has been submitted for a packing supply order.
 * Uses Onfleet task short ID to lookup order and check for associated feedback.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin packing supply feedback management
 * - Delivery completion verification workflows
 * - Customer service interfaces
 * - Feedback collection systems
 * 
 * INTEGRATION NOTES:
 * - Requires taskShortId query parameter (Onfleet task identifier)
 * - First finds packing supply order by task short ID
 * - Then checks for associated feedback record
 * - Returns { exists: boolean } response format
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const taskShortId = url.searchParams.get('taskShortId');

    if (!taskShortId) {
      return NextResponse.json(
        { error: 'Missing taskShortId parameter' },
        { status: 400 }
      );
    }

    // Find the order by task short ID first
    const order = await prisma.packingSupplyOrder.findFirst({
      where: { onfleetTaskShortId: taskShortId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found for task short ID' },
        { status: 404 }
      );
    }

    const feedback = await prisma.packingSupplyFeedback.findUnique({
      where: { packingSupplyOrderId: order.id },
    });

    return NextResponse.json({ exists: !!feedback });
  } catch (error) {
    console.error('Error checking packing supply feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 