/**
 * @fileoverview Admin API endpoint to fetch Onfleet task photo for storage unit
 * @source boombox-10.0/src/app/api/storage-units/[id]/onfleet-photo/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches the most recent Onfleet task completion photo for a storage unit.
 * Used by admin interface to view photos taken during pickup/dropoff tasks.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin storage unit detail views
 * - Task completion verification workflows
 * - Photo documentation systems
 * 
 * INTEGRATION NOTES:
 * - Queries OnfleetTask database for task ID associated with storage unit
 * - Calls Onfleet API to fetch task completion photos
 * - Returns first photo URL or null if no photos available
 * - Includes ID validation for numeric storage unit IDs
 * 
 * @refactor Uses centralized Onfleet photo utilities from @/lib/integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchOnfleetTaskPhotoForStorageUnit } from '@/lib/integrations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const storageUnitId = parseInt((await params).id);
    
    if (isNaN(storageUnitId)) {
      return NextResponse.json(
        { error: 'Invalid storage unit ID' },
        { status: 400 }
      );
    }

    const photoUrl = await fetchOnfleetTaskPhotoForStorageUnit(storageUnitId);
    
    return NextResponse.json({ photoUrl });
  } catch (error) {
    console.error('Error fetching Onfleet photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Onfleet photo' },
      { status: 500 }
    );
  }
} 