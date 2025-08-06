/**
 * @fileoverview Admin Dashboard Data Aggregation API Route
 * @source boombox-10.0/src/app/api/admin/dashboard/route.ts
 * 
 * FUNCTIONALITY:
 * - Fetches comprehensive dashboard statistics for admin panel
 * - Aggregates today's appointment counts by status
 * - Retrieves pending approval counts (drivers, movers, vehicles)
 * - Calculates various task counts and metrics
 * 
 * ROUTE: GET /api/admin/dashboard
 * 
 * RESPONSE FORMAT:
 * - jobsToday: appointment counts grouped by status for today
 * - awaitingApprovals: counts of unapproved drivers, movers, vehicles
 * - taskCounts: various admin task metrics
 * 
 * MIGRATION NOTES:
 * - Extracted all dashboard logic into centralized utilities (adminTaskUtils.ts)
 * - Added proper TypeScript interfaces and validation schemas
 * - Preserved exact business logic and data structure from source
 * - Improved error handling and response formatting
 * 
 * @refactor Migrated from boombox-10.0 following API Route Migration Pattern
 */

import { NextResponse } from 'next/server';
import { aggregateDashboardData } from '@/lib/utils/adminTaskUtils';
import { AdminDashboardDataResponseSchema } from '@/lib/validations/api.validations';

/**
 * GET /api/admin/dashboard
 * 
 * Fetches comprehensive admin dashboard statistics including:
 * - Today's job counts by status
 * - Pending approval counts
 * - Various task metrics
 * 
 * @returns {Promise<NextResponse>} Dashboard data with statistics
 */
export async function GET() {
  try {
    // Aggregate all dashboard data using centralized utilities
    const dashboardData = await aggregateDashboardData();

    // Validate response structure
    const validatedData = AdminDashboardDataResponseSchema.parse(dashboardData);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Return structured error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}