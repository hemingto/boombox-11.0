/**
 * @fileoverview Driver invitation details lookup endpoint
 * @source boombox-10.0/src/app/api/drivers/invitation-details/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves driver invitation details using invitation token.
 * Returns moving partner name and invitation email for invitation acceptance forms.
 * Validates token existence, expiration, and usage status.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/driver-accept-invite/page.tsx (invitation details display)
 * - src/app/components/driver/InvitationDetailsCard.tsx (details rendering)
 *
 * INTEGRATION NOTES:
 * - Simple token-based lookup with validation
 * - Returns minimal data for security (no sensitive invitation details)
 * - Validates invitation hasn't expired or been used
 *
 * @refactor Moved to /api/drivers/invitation-details/ structure, extracted utilities to driverUtils
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  findDriverInvitation,
  validateInvitationStatus,
} from '@/lib/utils/driverUtils';
import { DriverInvitationDetailsRequestSchema, type DriverInvitationDetailsRequest } from '@/lib/validations/api.validations';
import { ApiResponse, ApiError, API_ERROR_CODES } from '@/types/api.types';

interface DriverInvitationDetailsResponse {
  movingPartnerName: string;
  email: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DriverInvitationDetailsResponse>>> {
  try {
    // Get the token from the URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Token is required',
        field: 'token'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Validate token format (optional step)
    const validationResult = DriverInvitationDetailsRequestSchema.safeParse({ token });
    if (!validationResult.success) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid token format',
        details: { validationErrors: validationResult.error.errors }
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Find the invitation with the moving partner details
    const invitation = await findDriverInvitation(token);

    if (!invitation) {
      const error: ApiError = {
        code: API_ERROR_CODES.NOT_FOUND,
        message: 'Invalid invitation token'
      };
      return NextResponse.json({ success: false, error }, { status: 404 });
    }

    // Validate invitation status
    const statusValidation = validateInvitationStatus(invitation);
    if (!statusValidation.isValid) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: statusValidation.error || 'Invalid invitation status'
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const responseData: DriverInvitationDetailsResponse = {
      movingPartnerName: invitation.movingPartner.name,
      email: invitation.email
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Error fetching invitation details:", error);
    const apiError: ApiError = {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: 'Failed to fetch invitation details'
    };
    return NextResponse.json({ success: false, error: apiError }, { status: 500 });
  }
} 