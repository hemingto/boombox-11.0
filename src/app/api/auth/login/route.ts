/**
 * @fileoverview Email-based login initiation endpoint
 * @source boombox-10.0/src/app/api/auth/login-email/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that initiates login process for users via email.
 * Verifies user exists and triggers magic link or OTP sending logic.
 *
 * USED BY (boombox-10.0 files):
 * - Customer login components that use email authentication
 * - Login forms that support email-based authentication
 * - Magic link authentication flows
 *
 * INTEGRATION NOTES:
 * - Looks up user in User table by email address
 * - Placeholder for magic link/OTP logic - integration point for email service
 * - Part of customer authentication flow (not driver/mover)
 *
 * @refactor Moved from /api/auth/login-email/ to /api/auth/login/ and renamed for clarity
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(req: Request) {
  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Logic to send a magic link or an OTP goes here

    return NextResponse.json({ message: 'Login initiated.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Email login failed.' }, { status: 500 });
  }
} 