/**
 * @fileoverview Admin drivers list API endpoint
 * @source boombox-10.0/src/app/api/admin/drivers/route.ts
 * @target api/admin/drivers/route.ts
 * @refactor Migrated with centralized utilities and comprehensive documentation
 * 
 * API Routes:
 * - GET: Fetch comprehensive list of all drivers for admin dashboard
 * 
 * Business Logic:
 * - Returns detailed driver information including:
 *   - Basic driver details (name, email, phone, verification status)
 *   - Service assignments and approval status
 *   - Onfleet integration details (worker ID, team assignments)
 *   - License photos and profile pictures
 *   - Moving partner associations with team details
 *   - Vehicle information with approval status
 *   - Availability schedules with capacity
 *   - Job cancellation history
 *   - Current task assignments with appointment details
 * 
 * Dependencies:
 * - @/lib/utils/driverUtils: getAdminDriversList
 * - @/lib/validations/api.validations: validation schemas
 * - @/lib/database/prismaClient: database access
 */

import { NextResponse } from 'next/server';
import { getAdminDriversList } from '@/lib/utils/driverUtils';

export async function GET() {
  try {
    const drivers = await getAdminDriversList();

    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
} 