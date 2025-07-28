/**
 * @fileoverview Onfleet route plan creation testing utility
 * @source boombox-10.0/src/app/api/test-onfleet/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that tests Onfleet route plan creation functionality.
 * Creates a test route plan with empty tasks array to validate API integration.
 * Used for development, testing, and troubleshooting route planning features.
 *
 * USED BY (boombox-10.0 files):
 * - Development testing tools
 * - Route planning system validation
 * - Onfleet integration health checks
 *
 * INTEGRATION NOTES:
 * - Development/testing tool - safe to modify for better diagnostics
 * - Tests createRoutePlan service functionality
 * - Creates minimal test route with configurable parameters
 * - Returns detailed success/error information for debugging
 *
 * @refactor Moved from /api/test-onfleet/ to /api/onfleet/test-route-plan/ for better organization
 */

import { NextRequest, NextResponse } from 'next/server';

// Placeholder implementation - will be replaced with actual import once file is copied from boombox-10.0
interface RoutePlanParams {
  name: string;
  startTime: number;
  tasks: string[];
  color?: string;
  vehicleType?: string;
  startAt?: string;
  timezone?: string;
}

const createRoutePlan = async (params: RoutePlanParams): Promise<any> => {
  // Placeholder implementation - needs actual Onfleet Route Plan service
  return {
    id: `test_route_${Date.now()}`,
    name: params.name,
    startTime: params.startTime,
    tasks: params.tasks,
    created: true
  };
};

/**
 * GET /api/onfleet/test-route-plan
 * Test Onfleet Route Plan creation
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Onfleet Route Plan creation...');
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log(`Test route plan parameters:
      - Start time: ${startTime.toISOString()}
      - Unix timestamp: ${Math.floor(startTime.getTime() / 1000)}`);
    
    const routePlan = await createRoutePlan({
      name: 'TEST_ROUTE_' + Date.now(),
      startTime: Math.floor(startTime.getTime() / 1000),
      tasks: [], // Empty tasks array
      color: '#28a745',
      vehicleType: 'CAR',
      startAt: 'HUB',
      timezone: 'America/Los_Angeles',
    });
    
    console.log('Route Plan created successfully:', routePlan);
    
    return NextResponse.json({
      success: true,
      message: 'Onfleet Route Plan test successful',
      routePlan: routePlan,
      testDetails: {
        createdAt: now.toISOString(),
        startTime: startTime.toISOString(),
        unixTimestamp: Math.floor(startTime.getTime() / 1000),
        routeName: 'TEST_ROUTE_' + Date.now(),
      },
    });
    
  } catch (error: any) {
    console.error('Onfleet Route Plan test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack,
    }, { status: 500 });
  }
} 