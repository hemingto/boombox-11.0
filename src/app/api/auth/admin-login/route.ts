/**
 * @fileoverview Admin authentication endpoint with email/SMS verification
 * @source boombox-10.0/src/app/api/admin/login/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint to initiate admin login by sending verification code via email/SMS.
 * PUT endpoint to verify the code and complete admin authentication.
 *
 * USED BY (boombox-10.0 files):
 * - Admin login components in admin dashboard
 * - Admin authentication flows
 * - Admin verification forms
 *
 * INTEGRATION NOTES:
 * - Uses Twilio for SMS verification codes
 * - Uses email service for email verification codes
 * - Searches Admin table for authentication
 * - Updates lastLogin timestamp on successful verification
 *
 * @refactor Moved from /api/admin/login/ to /api/auth/admin-login/ for auth organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { twilioClient } from '@/lib/messaging/twilioClient';
import { generateVerificationCode } from '@/lib/utils/formatUtils';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { sendAdminVerificationEmail } from '@/lib/messaging/sendgridClient';
import { z } from 'zod';



const loginSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

export async function POST(req: Request) {
  try {
    const { email, phoneNumber } = await req.json();

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { message: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number if provided
    const formattedPhoneNumber = phoneNumber ? normalizePhoneNumberToE164(phoneNumber) : undefined;

    // Find admin by email or phone number
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: formattedPhoneNumber },
        ],
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin account not found' },
        { status: 404 }
      );
    }

    // Delete any existing verification codes for this contact
    await prisma.verificationCode.deleteMany({
      where: {
        contact: email || formattedPhoneNumber,
      },
    });

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store verification code
    await prisma.verificationCode.create({
      data: {
        contact: email || formattedPhoneNumber,
        code,
        expiresAt,
      },
    });

    // Send verification code via email if email is provided
    if (email) {
      try {
        await sendAdminVerificationEmail(email, code);
      } catch (error) {
        console.error('Error sending verification email:', error);
        // Don't fail the request if email fails, just log it
      }
    }

    // Send verification code via SMS if phone number is provided
    if (formattedPhoneNumber) {
      try {
        if (twilioClient) {
          await twilioClient.messages.create({
            body: `Your Boombox Storage admin verification code is: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhoneNumber,
          });
        } else {
          console.warn('Twilio client not initialized. SMS not sent.');
        }
      } catch (error) {
        console.error('Error sending verification SMS:', error);
        // Don't fail the request if SMS fails, just log it
      }
    }

    // In development, log the code for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Verification code:', code);
    }

    return NextResponse.json({
      message: 'Verification code sent',
      contact: email || formattedPhoneNumber,
    });
  } catch (error) {
    console.error('Error in admin login:', error);
    return NextResponse.json(
      { message: 'Failed to process login request' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { email, phoneNumber, code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Format phone number if provided
    const formattedPhoneNumber = phoneNumber ? normalizePhoneNumberToE164(phoneNumber) : undefined;

    // Find and verify the code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        contact: email || formattedPhoneNumber,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: formattedPhoneNumber },
        ],
      },
    });

    if (!admin) {
      return NextResponse.json(
        { message: 'Admin account not found' },
        { status: 404 }
      );
    }

    // Delete used verification code
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    // Update last login time
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error in admin login verification:', error);
    return NextResponse.json(
      { message: 'Failed to verify code' },
      { status: 500 }
    );
  }
} 