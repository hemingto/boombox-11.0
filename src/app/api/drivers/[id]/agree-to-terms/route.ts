/**
 * @fileoverview Driver terms agreement API route - mark driver as having agreed to terms
 * @source boombox-10.0/src/app/api/drivers/[driverId]/agree-to-terms/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that updates a driver's terms agreement status to true and records
 * the timestamp when they agreed to terms and conditions.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/driver/TermsAgreementForm.tsx (driver onboarding flow)
 * - src/app/driver-signup/page.tsx (driver registration process)
 * - src/app/components/admin/drivers/DriverStatusUpdate.tsx (admin can mark terms agreed)
 *
 * INTEGRATION NOTES:
 * - Simple database update operation with no external service integrations
 * - Sets agreedToTerms: true and agreedToTermsAt: current timestamp
 * - Part of driver onboarding workflow - required before driver approval
 * - No rollback functionality - terms agreement is permanent once set
 *
 * @refactor Moved from /api/drivers/[driverId]/agree-to-terms/ to /api/drivers/[id]/agree-to-terms/ structure.
 * Added proper validation schemas and improved error handling.
 */

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import {
  AgreeToTermsRequestSchema,
  AgreeToTermsResponseSchema
} from '@/lib/validations/api.validations';

/**
 * POST /api/drivers/[id]/agree-to-terms
 * Mark driver as having agreed to terms and conditions
 */
export async function POST(
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
    const validationResult = AgreeToTermsRequestSchema.safeParse(body);

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
      where: { id: driverIdNum }
    });

    if (!existingDriver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Update driver terms agreement
    const updatedDriver = await prisma.driver.update({
      where: {
        id: driverIdNum,
      },
      data: {
        agreedToTerms: true,
        agreedToTermsAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        agreedToTerms: true,
        agreedToTermsAt: true
      }
    });

    // Validate response data against schema
    const validatedResponse = AgreeToTermsResponseSchema.parse(updatedDriver);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error updating terms agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update terms agreement' },
      { status: 500 }
    );
  }
} 