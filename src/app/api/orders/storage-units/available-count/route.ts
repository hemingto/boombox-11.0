/**
 * @fileoverview Storage unit available count API endpoint
 * @source boombox-10.0/src/app/api/storage-units/available-count/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that calculates and returns the number of available storage units.
 * Accounts for empty units minus units reserved for upcoming appointments.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/reusablecomponents/storageunitcounter.tsx (line 29: fetches available units for quote form)
 * - Storage unit selection components throughout customer booking flow
 * - Quote generation system for capacity validation
 *
 * INTEGRATION NOTES:
 * - Calculates: (empty units) - (units reserved for future pickups)
 * - Considers 'Initial Pickup' and 'Additional Storage' appointments
 * - Only counts scheduled appointments with numberOfUnits > 0
 * - Returns minimum of 0 to prevent negative counts
 *
 * @refactor Moved from /api/storage-units/ to /api/orders/storage-units/ structure, extracted business logic to utilities
 */

import { NextResponse } from 'next/server';
import { getStorageUnitAvailability } from '@/lib/utils/storageUtils';
import { StorageUnitAvailableCountResponseSchema } from '@/lib/validations/api.validations';

export async function GET() {
  try {
    // Get available storage unit count using centralized utility
    const result = await getStorageUnitAvailability();
    
    // Validate response structure
    const validatedResult = StorageUnitAvailableCountResponseSchema.parse(result);
    
    return NextResponse.json(validatedResult);
  } catch (error) {
    console.error('Error fetching available storage unit count:', error);
    
    // Ensure a valid JSON response even in case of error
    return NextResponse.json(
      { 
        error: 'Failed to retrieve available unit count.', 
        availableCount: 0 
      }, 
      { status: 500 }
    );
  }
} 