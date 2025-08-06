/**
 * @fileoverview Driver Jobs API Route - Fetch completed job history for a driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/jobs/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/jobs - Fetch completed job history for a driver
 * 
 * @functionality
 * - Fetches appointments assigned to driver through OnfleetTasks
 * - Filters to only show completed appointments
 * - Transforms data to match JobHistory component format
 * - Includes user info, feedback, storage units, and driver details
 * - Orders by date descending (most recent first)
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.getDriverJobs
 * - @/lib/validations/api.validations.DriverJobsRequestSchema
 * 
 * @migration_notes
 * - Extracted job fetching and transformation logic to driverUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic and data transformation
 * - Maintained JobHistory component compatibility
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverJobsRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverJobs } from '@/lib/utils/driverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverJobsRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Fetch driver jobs using centralized utility
    const jobs = await getDriverJobs(Number(driverId));

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching driver jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 