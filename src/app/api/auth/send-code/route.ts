/**
 * @fileoverview SMS/Email verification code sending endpoint
 * @source boombox-10.0/src/app/api/auth/send-code/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that sends verification codes via SMS or email for authentication.
 * Finds accounts across all user types and sends appropriate verification codes.
 *
 * USED BY (boombox-10.0 files):
 * - Login components that require phone/email verification
 * - Customer signup flows
 * - Driver and mover authentication flows
 * - Password reset functionality
 *
 * INTEGRATION NOTES:
 * - Uses Twilio for SMS sending - critical integration, DO NOT modify
 * - Implements rate limiting to prevent code spam
 * - Searches across User, Driver, MovingPartner tables
 * - Stores verification codes in VerificationCode table
 *
 * @refactor Updated import paths, no logic changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { twilioClient } from '@/lib/messaging/twilioClient';

// Simple in-memory rate limiting to prevent sending multiple codes in quick succession
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

const formatPhoneNumberToE164 = (phone: string): string => {
  // Remove all non-numeric characters except '+'
  const cleaned = phone.replace(/[^0-9+]/g, '');
  // Add country code if missing
  if (!cleaned.startsWith('+')) {
    return `+1${cleaned}`; // Default to +1 for US numbers
  }
  return cleaned;
};

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, email } = await req.json();
    
    // Validate that at least one contact method is provided
    if (!phoneNumber && !email) {
      return NextResponse.json(
        { message: "Either phone number or email is required" },
        { status: 400 }
      );
    }

    // Format phone number if provided
    const formattedPhoneNumber = phoneNumber ? formatPhoneNumberToE164(phoneNumber) : null;
    
    // Rate limiting check for phone verification
    if (formattedPhoneNumber) {
      const lastSentTime = rateLimitMap.get(formattedPhoneNumber);
      const currentTime = Date.now();
      
      if (lastSentTime && currentTime - lastSentTime < RATE_LIMIT_WINDOW) {
        console.log(`Rate limited verification code for ${formattedPhoneNumber}`);
        return NextResponse.json(
          { message: "Please wait before requesting another code" },
          { status: 429 }
        );
      }
      
      // Update the last sent time
      rateLimitMap.set(formattedPhoneNumber, currentTime);
      
      // Clean up old entries from the rate limit map
      Array.from(rateLimitMap.entries()).forEach(([phone, time]) => {
        if (currentTime - time > RATE_LIMIT_WINDOW) {
          rateLimitMap.delete(phone);
        }
      });
    }

    // Find accounts across all tables
    const accounts = await findAccounts(formattedPhoneNumber, email);
    
    if (accounts.length === 0) {
      return NextResponse.json(
        { message: "No account found with these credentials" },
        { status: 404 }
      );
    }

    // Generate a random 4-digit code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store the verification code in the database
    await storeVerificationCode(formattedPhoneNumber, email, verificationCode);
    
    // Send the verification code via SMS or email
    if (formattedPhoneNumber) {
      await sendSmsVerificationCode(formattedPhoneNumber, verificationCode);
    } else if (email) {
      await sendEmailVerificationCode(email, verificationCode);
    }

    // Return the accounts found (either single or multiple)
    return NextResponse.json({
      message: "Verification code sent successfully",
      multipleAccounts: accounts.length > 1,
      accounts: accounts.map(account => ({
        id: account.id,
        type: account.type,
        name: account.name
      }))
    });
    
  } catch (error) {
    console.error("Error sending verification code:", error);
    return NextResponse.json(
      { message: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

// Find accounts across all tables
async function findAccounts(phoneNumber: string | null, email: string | null) {
  const accounts = [];

  // Check user table
  if (phoneNumber) {
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (user) {
      accounts.push({
        id: user.id.toString(),
        type: 'customer',
        name: `${user.firstName} ${user.lastName}`
      });
    }
  }
  
  if (email) {
    const userByEmail = await prisma.user.findFirst({
      where: { email },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (userByEmail) {
      accounts.push({
        id: userByEmail.id.toString(),
        type: 'customer',
        name: `${userByEmail.firstName} ${userByEmail.lastName}`
      });
    }
  }

  // Check driver table
  if (phoneNumber) {
    const driver = await prisma.driver.findFirst({
      where: { phoneNumber },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (driver) {
      accounts.push({
        id: driver.id.toString(),
        type: 'driver',
        name: `${driver.firstName} ${driver.lastName}`
      });
    }
  }
  
  if (email) {
    const driverByEmail = await prisma.driver.findFirst({
      where: { email },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (driverByEmail) {
      accounts.push({
        id: driverByEmail.id.toString(),
        type: 'driver',
        name: `${driverByEmail.firstName} ${driverByEmail.lastName}`
      });
    }
  }

  // Check moving partner table
  if (phoneNumber) {
    const mover = await prisma.movingPartner.findFirst({
      where: { phoneNumber },
      select: { id: true, name: true }
    });
    
    if (mover) {
      accounts.push({
        id: mover.id.toString(),
        type: 'mover',
        name: mover.name
      });
    }
  }
  
  if (email) {
    const moverByEmail = await prisma.movingPartner.findFirst({
      where: { email },
      select: { id: true, name: true }
    });
    
    if (moverByEmail) {
      accounts.push({
        id: moverByEmail.id.toString(),
        type: 'mover',
        name: moverByEmail.name
      });
    }
  }

  return accounts;
}

// Store verification code in the database
async function storeVerificationCode(phoneNumber: string | null, email: string | null, code: string) {
  // Create or update verification code record
  await prisma.verificationCode.upsert({
    where: {
      contact: phoneNumber || email || '',
    },
    update: {
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
    },
    create: {
      contact: phoneNumber || email || '',
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiration
    },
  });
}

// Send SMS verification code using Twilio
async function sendSmsVerificationCode(phoneNumber: string, code: string) {
  try {
    await twilioClient.messages.create({
      body: `Your Boombox Storage verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw new Error("Failed to send SMS verification code");
  }
}

// Send email verification code
async function sendEmailVerificationCode(email: string, code: string) {
  // Implement email sending logic here
  console.log(`Sending email to ${email} with code ${code}`);
  // This would typically use a service like SendGrid, AWS SES, etc.
} 