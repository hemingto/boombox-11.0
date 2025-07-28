/**
 * @fileoverview Onfleet API connection testing and configuration validation
 * @source boombox-10.0/src/app/api/onfleet/test-connection/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that tests basic Onfleet API connection and validates configuration.
 * POST endpoint that tests specific team auto-dispatch capability and retrieves team info.
 * Used for development, monitoring, and troubleshooting Onfleet integration.
 *
 * USED BY (boombox-10.0 files):
 * - Admin development tools
 * - System monitoring and health checks
 * - Onfleet configuration validation
 *
 * INTEGRATION NOTES:
 * - Development/monitoring tool - safe to modify for better diagnostics
 * - Tests team configuration and hub setup
 * - Validates PACKING_SUPPLY_CONFIG settings
 * - Returns detailed error information for debugging
 *
 * @refactor Moved to /api/onfleet/ structure, added validation and improved error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  testOnfleetConnection, 
  getOnfleetTeamByName, 
  getOnfleetHubByName, 
  PACKING_SUPPLY_CONFIG, 
  OnfleetApiError 
} from '@/lib/integrations/onfleetClient';
import {
  OnfleetTestConnectionRequestSchema,
  type OnfleetTestConnectionRequest
} from '@/lib/validations/api.validations';

/**
 * Test Onfleet API connection
 * GET /api/onfleet/test-connection
 */
export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const connectionTest = await testOnfleetConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Onfleet connection failed',
        error: connectionTest.error,
      }, { status: 500 });
    }
    
    // Test packing supply team configuration
    const packingTeam = await getOnfleetTeamByName(PACKING_SUPPLY_CONFIG.teamName);
    
    // Test warehouse hub configuration
    const warehouseHub = await getOnfleetHubByName(PACKING_SUPPLY_CONFIG.hubName);
    
    return NextResponse.json({
      success: true,
      message: 'Onfleet connection successful',
      data: {
        organization: connectionTest.organization,
        packingTeam: packingTeam ? {
          id: packingTeam.id,
          name: packingTeam.name,
          workers: packingTeam.workers?.length || 0,
          hub: packingTeam.hub,
          found: true,
        } : {
          found: false,
          error: `Team "${PACKING_SUPPLY_CONFIG.teamName}" not found`,
        },
        warehouseHub: warehouseHub ? {
          id: warehouseHub.id,
          name: warehouseHub.name,
          location: warehouseHub.location,
          found: true,
        } : {
          found: false,
          error: `Hub "${PACKING_SUPPLY_CONFIG.hubName}" not found`,
        },
        config: PACKING_SUPPLY_CONFIG,
      },
    });
    
  } catch (error: any) {
    console.error('Onfleet connection test failed:', error);
    
    if (error instanceof OnfleetApiError) {
      return NextResponse.json({
        success: false,
        message: 'Onfleet API error',
        error: {
          statusCode: error.status || 500,
          message: error.message,
          isAuthError: error.status === 401,
          isRateLimitError: error.status === 429,
        },
      }, { status: (error.status && error.status >= 400 && error.status < 500) ? error.status : 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Test Onfleet team auto-dispatch capability
 * POST /api/onfleet/test-connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const validatedData = OnfleetTestConnectionRequestSchema.parse(body);
    
    const teamName = validatedData.teamName || PACKING_SUPPLY_CONFIG.teamName;
    
    // Get the specified team
    const team = await getOnfleetTeamByName(teamName);
    
    if (!team) {
      return NextResponse.json({
        success: false,
        message: `Team "${teamName}" not found`,
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team info retrieved successfully',
      data: {
        team: {
          id: team.id,
          name: team.name,
          workersCount: team.workers?.length || 0,
          hub: team.hub,
          autoDispatch: team.autoDispatch,
        },
        workers: (team.workers || []).map((worker: any) => ({
          id: worker.id,
          name: worker.name,
          onDuty: worker.onDuty,
          activeTask: worker.activeTask,
          tasksCount: worker.tasks?.length || 0,
          capacity: worker.capacity,
          additionalCapacities: worker.additionalCapacities,
        })),
      },
    });
    
  } catch (error: any) {
    console.error('Team info retrieval failed:', error);
    
    if (error instanceof OnfleetApiError) {
      return NextResponse.json({
        success: false,
        message: 'Onfleet API error',
        error: {
          statusCode: error.status || 500,
          message: error.message,
        },
      }, { status: (error.status && error.status >= 400 && error.status < 500) ? error.status : 500 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Unknown error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 