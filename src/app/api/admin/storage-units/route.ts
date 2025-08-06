/**
 * @fileoverview Admin Storage Units Management API Route
 * @source boombox-10.0/src/app/api/admin/storage-units/route.ts
 * 
 * FUNCTIONALITY:
 * - GET: List storage units with filtering, sorting, and related data
 * - PATCH: Update storage unit status or warehouse information
 * 
 * FEATURES:
 * - Admin authentication and authorization
 * - Storage unit filtering by status
 * - Sorting by various fields (storageUnitNumber, status, etc.)
 * - Include related usage and access request data
 * - Warehouse information updates with usage tracking
 * - Status updates with admin logging
 * 
 * ROUTE: GET/PATCH /api/admin/storage-units
 * 
 * MIGRATION NOTES:
 * - Extracted all business logic into centralized storageUtils.ts
 * - Added proper TypeScript interfaces and validation schemas
 * - Preserved exact functionality from source route
 * - Improved error handling and response formatting
 * - Added comprehensive admin logging for audit trail
 * 
 * @refactor Migrated from boombox-10.0 following API Route Migration Pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { 
  getStorageUnitsWithRelations,
  updateWarehouseInfo,
  updateStorageUnitStatus,
  createStorageUnitAdminLog,
  type StorageUnitQueryParams,
  type StorageUnitUpdateRequest
} from '@/lib/utils/storageUtils';
import { 
  StorageUnitsListRequestSchema,
  StorageUnitUpdateRequestSchema 
} from '@/lib/validations/api.validations';
import { prisma } from '@/lib/database/prismaClient';

/**
 * GET /api/admin/storage-units
 * 
 * Fetches storage units with optional filtering and sorting.
 * Includes related usage and access request data.
 * 
 * Query Parameters:
 * - status: Filter by storage unit status
 * - sortBy: Field to sort by (default: storageUnitNumber)
 * - sortOrder: Sort direction (asc/desc, default: asc)
 * 
 * @param request - Next.js request object with query parameters
 * @returns {Promise<NextResponse>} Array of storage units with related data
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, email: true, role: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: StorageUnitQueryParams = {
      status: searchParams.get('status') || undefined,
      sortBy: searchParams.get('sortBy') || 'storageUnitNumber',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    };

    // Validate query parameters
    const validatedParams = StorageUnitsListRequestSchema.parse(queryParams);

    // Fetch storage units using centralized utility
    const storageUnits = await getStorageUnitsWithRelations(validatedParams);

    return NextResponse.json(storageUnits);
  } catch (error) {
    console.error('Error fetching storage units:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch storage units' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/storage-units
 * 
 * Updates storage unit status or warehouse information.
 * Creates admin log entries for audit trail.
 * 
 * Request Body:
 * - id: Storage unit ID (required)
 * - status: New status (optional)
 * - usageId: Storage unit usage ID for warehouse updates (optional)
 * - warehouseLocation: New warehouse location (optional)
 * - warehouseName: New warehouse name (optional)
 * 
 * @param request - Next.js request object with update data
 * @returns {Promise<NextResponse>} Updated storage unit or usage data
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, email: true, role: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData: StorageUnitUpdateRequest = StorageUnitUpdateRequestSchema.parse(body);
    
    const { id, status, usageId, warehouseLocation, warehouseName } = validatedData;

    // Handle warehouse information update
    if (usageId && (warehouseLocation !== undefined || warehouseName !== undefined)) {
      try {
        const { updatedUsage, currentUsage } = await updateWarehouseInfo(
          usageId, 
          warehouseLocation, 
          warehouseName
        );

        // Create admin log
        await createStorageUnitAdminLog(
          admin.id,
          `UPDATE_WAREHOUSE_INFO: Updated warehouse information for unit ${currentUsage.storageUnit.storageUnitNumber}`,
          id.toString()
        );

        return NextResponse.json(updatedUsage);
      } catch (error) {
        if (error instanceof Error && error.message === 'Storage unit usage not found') {
          return NextResponse.json(
            { error: 'Storage unit usage not found' },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    // Handle status update
    if (status) {
      const updatedUnit = await updateStorageUnitStatus(id, status);

      // Create admin log
      await createStorageUnitAdminLog(
        admin.id,
        `UPDATE_STORAGE_UNIT_STATUS: Updated unit ${updatedUnit.storageUnitNumber} to ${status}`,
        id.toString()
      );

      return NextResponse.json(updatedUnit);
    }

    return NextResponse.json(
      { error: 'No valid update operation specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating storage unit:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('ZodError')) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update storage unit' },
      { status: 500 }
    );
  }
}