/**
 * @fileoverview Admin API endpoint to fetch available (empty) storage units
 * @source boombox-10.0/src/app/api/admin/storage-units/available/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all storage units with 'Empty' status, ordered by unit number.
 * Used by admin interface to see which units are available for assignment.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin storage unit management dashboard
 * - Storage unit assignment workflows
 * - Inventory management systems
 * 
 * INTEGRATION NOTES:
 * - Direct Prisma query with no additional business logic
 * - Simple database read operation with basic error handling
 * - No authentication required (admin route assumes auth middleware)
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    const availableUnits = await prisma.storageUnit.findMany({
      where: {
        status: 'Empty'
      },
      orderBy: {
        storageUnitNumber: 'asc'
      }
    });

    return NextResponse.json(availableUnits);
  } catch (error) {
    console.error('Error fetching available storage units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available storage units' },
      { status: 500 }
    );
  }
} 