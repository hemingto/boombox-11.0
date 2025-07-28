/**
 * @fileoverview Onfleet team auto-dispatch for packing supply deliveries
 * @source boombox-10.0/src/app/api/onfleet/dispatch-team/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that triggers daily team auto-dispatch for packing supply deliveries.
 * GET endpoint that retrieves dispatch status, history, and details.
 * Integrates with Onfleet team auto-dispatch API and manages delivery routes.
 *
 * USED BY (boombox-10.0 files):
 * - Admin dispatch management (triggered via cron jobs)
 * - Admin dashboard for monitoring dispatch status
 * - Delivery route management system
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - DO NOT modify dispatch logic
 * - Uses BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS environment variable
 * - Requires proper team configuration in Onfleet dashboard
 * - Processes packing supply orders from database
 *
 * @refactor Moved from /api/onfleet/ to /api/onfleet/ structure, extracted utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  autoDispatchPackingSupplyTeam,
  PACKING_SUPPLY_CONFIG,
  OnfleetApiError 
} from '@/lib/integrations/onfleetClient';
import { prisma } from '@/lib/database/prismaClient';
import {
  executeTeamDispatch,
  updateOrdersAfterDispatch,
  logDispatchResults,
  getRecentDispatchHistory,
  getDispatchDetailsByDate,
  isValidDispatchTime,
  ONFLEET_DISPATCH_CONSTANTS,
  type OnfleetDispatchSummary
} from '@/lib/utils/onfleetUtils';
import {
  OnfleetDispatchTeamRequestSchema,
  type OnfleetDispatchTeamRequest
} from '@/lib/validations/api.validations';

export interface DispatchResponse {
  success: boolean;
  dispatchId: string;
  targetDate: string;
  summary: OnfleetDispatchSummary;
  routes: Array<{
    routeId: string;
    orderIds: number[];
    assignedDriverId?: number;
    estimatedServiceTime: number;
    totalCapacity: {
      weight: number;
      volume: number;
      itemCount: number;
    };
  }>;
  overflow: Array<{
    orderId: number;
    reason: string;
    suggestedDate: string;
  }>;
  warnings: string[];
  errors: string[];
  executionTime: number;
}

/**
 * POST /api/onfleet/dispatch-team
 * Trigger daily team auto-dispatch for packing supply deliveries
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚚 Starting packing supply team dispatch...');
    
    // Validate request body
    const body = await req.json().catch(() => ({}));
    const validatedData = OnfleetDispatchTeamRequestSchema.parse(body);
    
    // Get packing supply team ID from environment variable
    const teamId = process.env.BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS;
    
    if (!teamId) {
      console.error(`❌ BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS environment variable not configured`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'BOOMBOX_PACKING_SUPPLY_DELIVERY_DRIVERS environment variable not configured' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Using team ID: ${teamId}`);

    // Check if dispatch time is valid (unless forced)
    if (!validatedData.forceDispatch && !isValidDispatchTime()) {
      return NextResponse.json(
        {
          success: false,
          error: `Dispatch not allowed before ${ONFLEET_DISPATCH_CONSTANTS.PST_DISPATCH_HOUR} PM PST`,
          currentTime: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
        },
        { status: 400 }
      );
    }

    // Auto-dispatch the team
    const dispatchResult = await autoDispatchPackingSupplyTeam(teamId);

    console.log(`🎯 Dispatch completed: ${dispatchResult.tasks.length} tasks processed`);

    // Log dispatch results for monitoring
    const dispatchId = `dispatch_${Date.now()}`;
    const targetDate = validatedData.targetDate || new Date().toISOString().split('T')[0];
    
    const summary: OnfleetDispatchSummary = {
      totalOrders: dispatchResult.tasks.length,
      dispatchedOrders: dispatchResult.tasks.length,
      overflowOrders: 0,
      availableDrivers: 0, // Set to 0 since autoDispatchPackingSupplyTeam doesn't return this
      routesCreated: 1
    };

    await logDispatchResults(dispatchId, targetDate, summary, {
      routes: [{ routeId: dispatchId, orderIds: [], assignedDriverId: null }],
      overflow: [],
      warnings: [],
      errors: []
    });

    return NextResponse.json({
      success: true,
      teamId: teamId,
      teamName: PACKING_SUPPLY_CONFIG.teamName,
      tasksDispatched: dispatchResult.tasks.length,
      tasks: dispatchResult.tasks,
      dispatchId,
      targetDate
    });

  } catch (error: unknown) {
    console.error('❌ Error dispatching packing supply team:', error);
    
    if (error instanceof OnfleetApiError) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error.response 
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to dispatch packing supply team',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onfleet/dispatch-team
 * Get dispatch status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dispatchId = searchParams.get('dispatchId');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (dispatchId && date) {
      // Get specific dispatch details
      const dispatch = await getDispatchDetailsByDate(date, limit);

      return NextResponse.json({
        success: true,
        dispatch,
      });
    }

    // Get recent dispatch history
    const recentDispatches = await getRecentDispatchHistory(limit);

    return NextResponse.json({
      success: true,
      recentDispatches,
    });

  } catch (error) {
    console.error('Error fetching dispatch status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dispatch status',
    }, { status: 500 });
  }
} 