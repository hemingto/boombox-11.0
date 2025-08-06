/**
 * @fileoverview Driver Packing Supply Routes API Route - Fetch driver's packing supply delivery routes
 * @source boombox-10.0/src/app/api/drivers/[driverId]/packing-supply-routes/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage GET /api/drivers/[id]/packing-supply-routes - Fetch driver's packing supply routes
 * 
 * @functionality
 * - Fetches packing supply routes assigned to driver from last 30 days
 * - Filters for in_progress and completed routes
 * - Calculates route metrics (stops, miles, duration, payout estimates)
 * - Includes detailed order information and product details
 * - Transforms data for component compatibility
 * 
 * @dependencies
 * - @/lib/utils/packingSupplyUtils.getDriverPackingSupplyRoutes
 * - @/lib/validations/api.validations.DriverPackingSupplyRoutesRequestSchema
 * 
 * @migration_notes
 * - Extracted complex route fetching and transformation logic to packingSupplyUtils
 * - Added request validation with Zod schemas
 * - Preserved exact business logic including payout calculations and metrics
 * - Maintained compatibility with route display components
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverPackingSupplyRoutesRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { getDriverPackingSupplyRoutes } from '@/lib/utils/packingSupplyUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters
    const { id } = await params;
    const validation = validateApiRequest(DriverPackingSupplyRoutesRequestSchema, { driverId: id });

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid driver ID', details: errors },
        { status: 400 }
      );
    }

    const { driverId } = validation.data;

    // Fetch driver packing supply routes using centralized utility
    const routes = await getDriverPackingSupplyRoutes(Number(driverId));

    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching packing supply routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packing supply routes' },
      { status: 500 }
    );
  }
} 