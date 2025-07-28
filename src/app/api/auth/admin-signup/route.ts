/**
 * @fileoverview Admin account creation endpoint with invite token validation
 * @source boombox-10.0/src/app/api/admin/signup/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates new admin accounts using invite tokens.
 * Validates HCaptcha, verifies invite tokens, and creates admin records.
 *
 * USED BY (boombox-10.0 files):
 * - Admin signup forms accessed via invite links
 * - Admin invitation workflow components
 * - Admin onboarding process
 *
 * INTEGRATION NOTES:
 * - Uses HCaptcha for spam protection
 * - Validates AdminInvite tokens with expiration
 * - Creates Admin records and logs actions
 * - Deletes used invite tokens after successful signup
 *
 * @refactor Moved from /api/admin/signup/ to /api/auth/admin-signup/ for auth organization
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { verify } from 'hcaptcha';



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phoneNumber, name, token, captchaToken } = body;

    // Validate required fields
    if (!email || !phoneNumber || !name) {
      return NextResponse.json(
        { message: 'Email, phone number, and name are required' },
        { status: 400 }
      );
    }

    // Verify HCaptcha
    try {
      const captchaResponse = await verify(
        process.env.HCAPTCHA_SECRET_KEY || '',
        captchaToken
      );

      if (!captchaResponse.success) {
        return NextResponse.json(
          { message: 'Invalid CAPTCHA verification' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('HCaptcha verification error:', error);
      return NextResponse.json(
        { message: 'Failed to verify CAPTCHA' },
        { status: 400 }
      );
    }

    // Validate invite token
    const invite = await prisma.adminInvite.findUnique({
      where: { token },
      include: { invitedBy: true },
    });

    if (!invite) {
      return NextResponse.json(
        { message: 'Invalid or expired invite token' },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'Invite token has expired' },
        { status: 400 }
      );
    }

    // Check if email matches invite
    if (invite.email !== email) {
      return NextResponse.json(
        { message: 'Email does not match invite' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhoneNumber = normalizePhoneNumberToE164(phoneNumber);

    try {
      // Create admin account
      const admin = await prisma.admin.create({
        data: {
          email,
          phoneNumber: formattedPhoneNumber,
          name,
          role: invite.role,
        },
      });

      // Delete used invite
      await prisma.adminInvite.delete({
        where: { id: invite.id },
      });

      // Log admin creation
      await prisma.adminLog.create({
        data: {
          adminId: invite.invitedBy.id, // Log the inviter as the admin performing the action
          action: 'CREATE',
          targetType: 'Admin',
          targetId: admin.id.toString(),
        },
      });

      return NextResponse.json({
        message: 'Admin account created successfully',
        admin,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.[0];
          if (field === 'email') {
            return NextResponse.json(
              { message: 'This email is already registered' },
              { status: 400 }
            );
          }
          if (field === 'phoneNumber') {
            return NextResponse.json(
              { message: 'This phone number is already registered' },
              { status: 400 }
            );
          }
        }
      }
      throw error; // Re-throw other errors to be caught by outer catch block
    }
  } catch (error) {
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    );
  }
} 