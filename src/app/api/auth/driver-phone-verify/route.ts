/**
 * @fileoverview Driver and mover phone number verification endpoint
 * @source boombox-10.0/src/app/api/auth/driver-phone-number-verify/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that marks a driver or mover's phone number as verified in the database.
 * Updates verifiedPhoneNumber field to true for the specified user type.
 *
 * USED BY (boombox-10.0 files):
 * - Driver signup flow components after SMS verification
 * - Mover signup flow components after SMS verification
 * - Phone verification confirmation pages
 *
 * INTEGRATION NOTES:
 * - Updates Driver or MovingPartner table based on userType parameter
 * - Critical for driver/mover approval workflow - must maintain exact logic
 * - Works in conjunction with SMS verification system
 *
 * @refactor Moved from /api/auth/driver-phone-number-verify/ to /api/auth/driver-phone-verify/
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(req: NextRequest) {
  try {
    const { userId, userType } = await req.json();
    
    // Log the incoming payload
    console.log('Received payload:', { userId, userType });

    if (!userId || !userType) {
      return NextResponse.json({ message: 'User ID and user type are required' }, { status: 400 });
    }

    // Convert userId to an integer
    const userIdInt = parseInt(userId, 10);

    if (isNaN(userIdInt)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }

    let updatedUser;
    if (userType === 'driver') {
      updatedUser = await prisma.driver.update({
        where: { id: userIdInt },
        data: { verifiedPhoneNumber: true },
      });
    } else if (userType === 'mover') {
      updatedUser = await prisma.movingPartner.update({
        where: { id: userIdInt },
        data: { verifiedPhoneNumber: true },
      });
    } else {
      return NextResponse.json({ message: 'Invalid user type' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Phone number verified successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating verified status:', error);
    return NextResponse.json({ message: 'Failed to update verified status' }, { status: 500 });
  }
} 