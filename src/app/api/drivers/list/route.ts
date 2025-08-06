/**
 * @fileoverview Driver registration and creation endpoint
 * @source boombox-10.0/src/app/api/drivers/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates new driver records in the database with Onfleet team assignments.
 * Handles both direct driver registrations and moving partner driver invitations.
 * Sets authentication cookies and creates default availability schedules.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/driver-signup/DriverSignupForm.tsx (driver registration)
 * - src/app/components/moving-partners/InviteDriverForm.tsx (moving partner driver invitations)
 * - src/app/driver-signup/page.tsx (direct driver signup flow)
 *
 * INTEGRATION NOTES:
 * - Creates Onfleet team assignments based on selected services
 * - Validates phone number and email uniqueness across system
 * - Sets HTTP-only authentication cookies for immediate login
 * - Creates blocked default availability schedule for new drivers
 *
 * @refactor Moved from /api/drivers/ to /api/drivers/list/ structure, extracted utilities to driverUtils
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { 
  getDriverTeamIds, 
  createDefaultDriverAvailability, 
  validateDriverUniqueness,
  DRIVER_STATUSES,
} from '@/lib/utils/driverUtils';
import { CreateDriverRequestSchema, type CreateDriverRequest } from '@/lib/validations/api.validations';
import { ApiResponse, ApiError, API_ERROR_CODES } from '@/types/api.types';

interface DriverCreationResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  assignedTeams: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DriverCreationResponse>>> {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = CreateDriverRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request data',
        details: { validationErrors: validationResult.error.errors }
      };
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const data: CreateDriverRequest = validationResult.data;
    const { createDefaultAvailability, ...driverData } = data;
    
    // Normalize the phone number
    let normalizedPhoneNumber: string;
    try {
      normalizedPhoneNumber = normalizePhoneNumberToE164(driverData.phoneNumber);
    } catch (error) {
      const apiError: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid phone number format',
        field: 'phoneNumber'
      };
      return NextResponse.json({ success: false, error: apiError }, { status: 400 });
    }
    
    // Validate driver uniqueness
    const uniquenessCheck = await validateDriverUniqueness(driverData.email, normalizedPhoneNumber);
    if (!uniquenessCheck.isUnique) {
      const error: ApiError = {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: uniquenessCheck.error || 'Driver already exists'
      };
      return NextResponse.json({ success: false, error }, { status: 409 });
    }
    
    // Determine team IDs based on services
    const teamIds = driverData.invitationToken 
      ? [] // Moving partner drivers will get team ID when invitation is accepted
      : getDriverTeamIds(driverData.services);
    
    // Create driver in database
    const driver = await prisma.driver.create({
      data: {
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        email: driverData.email,
        phoneNumber: normalizedPhoneNumber,
        phoneProvider: driverData.phoneProvider,
        location: driverData.location,
        services: driverData.services,
        vehicleType: driverData.vehicleType,
        hasTrailerHitch: driverData.hasTrailerHitch,
        consentToBackgroundCheck: driverData.consentToBackgroundCheck,
        status: DRIVER_STATUSES.PENDING,
        isApproved: false,
        onfleetTeamIds: teamIds,
      },
    });
    
    // Set a session cookie for the new driver
    const cookieStore = await cookies();
    cookieStore.set('auth_token', JSON.stringify({
      userId: driver.id,
      userType: 'driver'
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    
    // Create default availability if requested
    if (createDefaultAvailability) {
      await createDefaultDriverAvailability(driver.id);
    }
    
    const responseData: DriverCreationResponse = {
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      assignedTeams: teamIds
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error creating driver:', error);
    const apiError: ApiError = {
      code: API_ERROR_CODES.INTERNAL_ERROR,
      message: 'Failed to create driver'
    };
    return NextResponse.json({ success: false, error: apiError }, { status: 500 });
  }
} 