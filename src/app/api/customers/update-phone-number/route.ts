/**
 * @fileoverview API endpoint to update customer phone number
 * @source boombox-10.0/src/app/api/updatephonenumber/route.ts
 * @refactor PHASE 4 - Customers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that updates a customer's phone number with validation and normalization.
 * Checks for phone number uniqueness and formats to E164 standard.
 * 
 * USED BY (boombox-10.0 files):
 * - Customer profile management pages
 * - Account settings interfaces
 * - User profile update workflows
 * - Phone verification systems
 * 
 * INTEGRATION NOTES:
 * - Requires userId and newPhoneNumber in request body
 * - Normalizes phone number to US format (+1XXXXXXXXXX)
 * - Validates phone number is 10 digits
 * - Checks for phone number uniqueness across users
 * - Marks phone as unverified after update
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, newPhoneNumber } = body;

    if (!userId || !newPhoneNumber) {
      return NextResponse.json({ error: 'User ID and new phone number are required.' }, { status: 400 });
    }

    // Normalize the phone number
    const normalizedPhoneNumber = newPhoneNumber.replace(/\D/g, '');
    if (normalizedPhoneNumber.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
    }

    const formattedPhoneNumber = `+1${normalizedPhoneNumber}`; // Assuming US numbers

    // Check if the phone number already exists for a different user
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
    });

    if (existingUser && existingUser.id !== userId) {
      // If the phone number exists but doesn't belong to the current user, throw an error
      return NextResponse.json({
        error: 'This phone number is already in use. Please use a different phone number.',
      }, { status: 400 });
    }

    // Update the user's phone number
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { phoneNumber: formattedPhoneNumber, verifiedPhoneNumber: false }, // Mark as not verified
    });

    return NextResponse.json({ message: 'Phone number updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error updating phone number:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 