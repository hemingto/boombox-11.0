/**
 * @fileoverview Admin endpoint for fetching unassigned requested storage units for an appointment
 * @source boombox-10.0/src/app/api/admin/appointments/[id]/requested-storage-units/route.ts
 * @refactor Migrated to use centralized AssignRequestedUnitService
 * 
 * GET /api/admin/appointments/[id]/requested-storage-units
 * 
 * Returns requested storage units for an appointment that have not yet been assigned to Onfleet tasks.
 * Used by admin interface for managing storage unit assignments.
 * 
 * ## URL Parameters
 * - `id`: Appointment ID (number)
 * 
 * ## Response
 * - 200: Array of requested storage units with storage unit details
 * - 400: Invalid appointment ID
 * - 404: Appointment not found
 * - 500: Server error
 * 
 * ## Response Format
 * ```json
 * [
 *   {
 *     "id": number,
 *     "appointmentId": number,
 *     "storageUnitId": number,
 *     "storageUnit": {
 *       "id": number,
 *       "storageUnitNumber": string,
 *       "status": string
 *     }
 *   }
 * ]
 * ```
 * 
 * ## Business Logic
 * 1. Finds appointment and associated Onfleet tasks
 * 2. Identifies storage units already assigned to tasks
 * 3. Returns requested units not yet assigned to Onfleet
 * 4. Orders by storage unit number (ascending)
 * 
 * ## Dependencies
 * - AssignRequestedUnitService.getUnassignedRequestedUnits()
 */

import { NextResponse, NextRequest } from 'next/server';
import { AssignRequestedUnitService } from '@/lib/services/admin/AssignRequestedUnitService'; 

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const appointmentId = parseInt((await params).id);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    // Use centralized service to get unassigned requested units
    const assignRequestedUnitService = new AssignRequestedUnitService();
    const unassignedRequestedUnits = await assignRequestedUnitService.getUnassignedRequestedUnits(appointmentId);
    
    return NextResponse.json(unassignedRequestedUnits);
  } catch (error) {
    console.error('Error fetching requested storage units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requested storage units' },
      { status: 500 }
    );
  }
}