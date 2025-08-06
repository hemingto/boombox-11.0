/**
 * @fileoverview Driver Services API Route - Update driver services with Onfleet team sync
 * @source boombox-10.0/src/app/api/drivers/[driverId]/services/route.ts
 * @refactor Migrated to centralized architecture with validation and utilities
 * @usage PATCH /api/drivers/[id]/services - Update driver's service offerings
 * 
 * @functionality
 * - Updates driver's service array (e.g., Storage Unit Delivery, Packing Supply Delivery)
 * - Validates driver exists and isn't linked to moving partner
 * - Syncs driver with appropriate Onfleet teams based on services
 * - Updates database and returns updated driver data
 * 
 * @dependencies
 * - @/lib/utils/driverUtils.updateDriverServices
 * - @/lib/validations/api.validations.DriverServicesRequestSchema
 * - Onfleet API integration for team synchronization
 * 
 * @migration_notes
 * - Extracted complex service update and Onfleet sync logic to driverUtils
 * - Added comprehensive request validation with Zod schemas
 * - Preserved exact business logic including moving partner restrictions
 * - Maintained Onfleet team mapping and synchronization behavior
 */

import { NextResponse, NextRequest } from 'next/server';
import { 
  DriverServicesRequestSchema,
  validateApiRequest,
  formatValidationErrors 
} from '@/lib/validations/api.validations';
import { updateDriverServices } from '@/lib/utils/driverUtils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Parse and validate request parameters and body
    const { id } = await params;
    const body = await request.json();
    
    const requestData = { ...body, driverId: id };
    const validation = validateApiRequest(DriverServicesRequestSchema, requestData);

    if (!validation.success) {
      const errors = formatValidationErrors(validation.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    const { driverId, services } = validation.data;

    // Update driver services using centralized utility
    const result = await updateDriverServices(Number(driverId), services);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating driver services:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Driver not found') {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }
      
      if (error.message === 'Cannot update services for drivers linked to moving partners') {
        return NextResponse.json(
          { error: 'Cannot update services for drivers linked to moving partners' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update driver services' },
      { status: 500 }
    );
  }
} 