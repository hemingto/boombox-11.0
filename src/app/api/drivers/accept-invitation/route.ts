/**
 * @fileoverview Driver invitation acceptance endpoint for moving partner drivers
 * @source boombox-10.0/src/app/api/drivers/accept-invitation/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that processes driver invitation acceptances from moving partners.
 * Creates driver records, associates them with moving partners, and updates invitation status.
 * Handles phone number normalization and validates invitation tokens.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/driver-accept-invite/page.tsx (invitation acceptance form)
 * - src/app/components/driver/AcceptInvitationForm.tsx (form submission)
 *
 * INTEGRATION NOTES:
 * - Creates moving partner driver associations in database
 * - Validates invitation tokens and expiration dates
 * - Handles phone number normalization and validation
 * - Updates invitation status to 'accepted'
 *
 * @refactor Moved to /api/drivers/accept-invitation/ structure, extracted utilities to driverUtils
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { 
  findDriverInvitation,
  validateInvitationStatus,
  validateDriverUniqueness,
  DEFAULT_DRIVER_SERVICES,
  DEFAULT_MOVING_PARTNER_VEHICLE_TYPE,
  DRIVER_STATUSES,
} from '@/lib/utils/driverUtils';
import { AcceptDriverInvitationRequestSchema, type AcceptDriverInvitationRequest } from '@/lib/validations/api.validations';
import { ApiResponse, ApiError, API_ERROR_CODES } from '@/types/api.types';

interface DriverInvitationAcceptanceResponse {
  driver: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DriverInvitationAcceptanceResponse>>> {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = AcceptDriverInvitationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: { validationErrors: validationResult.error.errors }
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      phoneProvider,
      location,
      backgroundCheckConsent,
      token
    }: AcceptDriverInvitationRequest = validationResult.data;

    // Normalize the phone number if provided
    let normalizedPhoneNumber: string | null = null;
    if (phoneNumber) {
      try {
        normalizedPhoneNumber = normalizePhoneNumberToE164(phoneNumber);
      } catch (error) {
        const apiError: ApiError = {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid phone number format',
          field: 'phoneNumber'
        };
        return NextResponse.json({ success: false, error: apiError }, { status: 400 });
      }
    }

    // Find and validate the invitation
    const invitation = await findDriverInvitation(token);
    const validationResult2 = validateInvitationStatus(invitation);
    
    if (!validationResult2.isValid) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: validationResult2.error || 'Invalid invitation'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Validate driver uniqueness
    const uniquenessCheck = await validateDriverUniqueness(email, normalizedPhoneNumber || '');
    if (!uniquenessCheck.isUnique) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: uniquenessCheck.error || 'Driver already exists'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Create the driver
    const driver = await prisma.driver.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber: normalizedPhoneNumber,
        phoneProvider,
        location,
        services: DEFAULT_DRIVER_SERVICES,
        vehicleType: DEFAULT_MOVING_PARTNER_VEHICLE_TYPE,
        hasTrailerHitch: false,
        consentToBackgroundCheck: backgroundCheckConsent === 'Yes',
        status: DRIVER_STATUSES.PENDING,
        isApproved: false,
        onfleetTeamIds: invitation!.movingPartner.onfleetTeamId ? [invitation!.movingPartner.onfleetTeamId] : []
      }
    });

    // Create the moving partner driver association
    await prisma.movingPartnerDriver.create({
      data: {
        movingPartnerId: invitation!.movingPartnerId,
        driverId: driver.id,
        isActive: true
      }
    });

    // Update the invitation status
    await prisma.driverInvitation.update({
      where: { id: invitation!.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    const responseData: DriverInvitationAcceptanceResponse = {
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email
      },
      message: 'Driver invitation accepted successfully'
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error accepting driver invitation:', error);
    
    // Check for Prisma unique constraint violations
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      let message = 'A driver with this information already exists';
      
      if (field === 'phoneNumber') {
        message = 'A driver with this phone number already exists';
      } else if (field === 'email') {
        message = 'A driver with this email already exists';
      }
      
      const apiError: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message,
        field
      };
      return NextResponse.json({ success: false, error: apiError }, { status: 409 });
    }
    
    const apiError: ApiError = {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: 'Failed to process invitation'
    };
    return NextResponse.json({ success: false, error: apiError }, { status: 500 });
  }
} 