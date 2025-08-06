/**
 * @fileoverview Driver application completion API route - mark driver application as complete
 * @source boombox-10.0/src/app/api/drivers/[driverId]/application-complete/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that marks a driver's application as complete by setting
 * applicationComplete: true. This indicates the driver has submitted all
 * required information and documents for their application.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/driver/ApplicationSubmissionForm.tsx (final step in driver onboarding)
 * - src/app/driver-account-page/[driverId]/page.tsx (driver dashboard completion status)
 * - src/app/components/admin/drivers/ApplicationStatusUpdate.tsx (admin can mark complete)
 * - src/app/api/drivers/approve/route.ts (checks applicationComplete before approval)
 *
 * INTEGRATION NOTES:
 * - Simple database update operation with no external service integrations
 * - Sets applicationComplete: true flag in driver record
 * - Part of driver onboarding workflow - typically last step before admin approval
 * - Required field checked during driver approval process
 * - No rollback functionality - application completion is permanent once set
 *
 * @refactor Moved from /api/drivers/[driverId]/application-complete/ to /api/drivers/[id]/application-complete/ structure.
 * Added proper validation schemas, improved error handling, and existence check before update.
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import {
  ApplicationCompleteRequestSchema,
  ApplicationCompleteResponseSchema
} from '@/lib/validations/api.validations';

/**
 * PATCH /api/drivers/[id]/application-complete
 * Mark driver application as complete
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driverIdNum = parseInt(id);

    if (isNaN(driverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid driver ID' },
        { status: 400 }
      );
    }

    // Validate request body (empty object expected)
    const body = await request.json().catch(() => ({}));
    const validationResult = ApplicationCompleteRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    // Check if driver exists before updating
    const existingDriver = await prisma.driver.findUnique({
      where: { id: driverIdNum },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        applicationComplete: true
      }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Update driver application completion status
    const updatedDriver = await prisma.driver.update({
      where: {
        id: driverIdNum,
      },
      data: {
        applicationComplete: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        applicationComplete: true
      }
    });

    // Validate response data against schema
    const validatedResponse = ApplicationCompleteResponseSchema.parse(updatedDriver);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error updating application complete status:', error);
    return NextResponse.json(
      { error: 'Failed to update application complete status' },
      { status: 500 }
    );
  }
} 