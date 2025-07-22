/**
 * @fileoverview Verification code validation and authentication endpoint
 * @source boombox-10.0/src/app/api/auth/verify-code/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that validates verification codes and authenticates users.
 * Handles single and multiple account scenarios, sets authentication cookies.
 *
 * USED BY (boombox-10.0 files):
 * - Login verification components after code entry
 * - Customer, driver, and mover authentication flows
 * - Multi-account selection interfaces
 * - Phone number verification confirmations
 *
 * INTEGRATION NOTES:
 * - Validates codes stored by send-code endpoint
 * - Sets httpOnly authentication cookies for security
 * - Updates verifiedPhoneNumber status for customers
 * - Handles multiple account types (customer, driver, mover)
 *
 * @refactor Updated import paths, no logic changes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prismaClient";

const formatPhoneNumberToE164 = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+1${cleaned}`;
  }
  return cleaned;
};

export async function POST(req: Request) {
  try {
    const { phoneNumber, email, code, accountType, accountId } = await req.json();
    
    if ((!phoneNumber && !email) || !code) {
      return NextResponse.json(
        { message: "Phone number/email and verification code are required" },
        { status: 400 }
      );
    }

    const formattedPhoneNumber = phoneNumber ? formatPhoneNumberToE164(phoneNumber) : null;
    const contact = formattedPhoneNumber || email || '';

    // Verify the code
    const verificationRecord = await prisma.verificationCode.findUnique({
      where: { contact },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { message: "No verification code found for this contact" },
        { status: 404 }
      );
    }

    if (verificationRecord.code !== code) {
      return NextResponse.json(
        { message: "Invalid verification code" },
        { status: 400 }
      );
    }

    if (verificationRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Verification code has expired" },
        { status: 400 }
      );
    }

    // If accountId is provided, use it directly
    if (accountId) {
      // Find the account based on the provided ID and type
      const account = await findAccountById(accountId, accountType);
      
      if (!account) {
        return NextResponse.json(
          { message: "Account not found" },
          { status: 404 }
        );
      }

      // Update verifiedPhoneNumber if it's a customer account and phoneNumber is present
      if (accountType === 'customer' && phoneNumber) {
        await prisma.user.update({
          where: { id: parseInt(accountId) },
          data: { verifiedPhoneNumber: true },
        });
      }
      
      // Create response with JSON data
      const response = NextResponse.json({
        userId: account.id,
        userType: accountType,
        message: "Verification successful"
      });
      
      // Set authentication cookie
      response.cookies.set({
        name: 'auth_token',
        value: JSON.stringify({
          userId: account.id,
          userType: accountType
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });

      return response;
    }
    
    // If no accountId is provided, find all accounts and handle accordingly
    const accounts = await findAccounts(formattedPhoneNumber, email);
    console.log('[verify-code] Found accounts:', JSON.stringify(accounts, null, 2));

    if (accounts.length === 0) {
      return NextResponse.json(
        { message: "No account found with these credentials" },
        { status: 404 }
      );
    }

    // Attempt to find and update the customer account specifically
    const customerAccount = accounts.find(acc => acc.type === 'customer');
    if (customerAccount && phoneNumber) {
        console.log(`[verify-code] Attempting to update User ${customerAccount.id} verifiedPhoneNumber to true`);
        try {
            const updatedUser = await prisma.user.update({
                where: { id: parseInt(customerAccount.id) },
                data: { verifiedPhoneNumber: true },
            });
            console.log(`[verify-code] User ${customerAccount.id} updated. New verifiedPhoneNumber: ${updatedUser.verifiedPhoneNumber}`);
        } catch (e: any) {
            console.error(`[verify-code] Error updating User ${customerAccount.id}:`, e.message);
        }
    }
    
    if (accounts.length === 1) {
      // Single account found, return it directly
      const account = accounts[0];
      
      // The specific update for customer is now handled above.
      // This block remains for constructing the response.
      
      const response = NextResponse.json({
        userId: account.id,
        userType: account.type,
        message: "Verification successful"
      });
      
      // Set authentication cookie
      response.cookies.set({
        name: 'auth_token',
        value: JSON.stringify({
          userId: account.id,
          userType: account.type
        }),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });

      return response;
    } else {
      // Multiple accounts found, return them all
      // The customer account (if present) would have been updated by the logic above.
      // The response indicating multiple accounts is preserved.
      return NextResponse.json({
        multipleAccounts: true,
        accounts: accounts.map(account => ({
          id: account.id,
          type: account.type,
          name: account.name
        })),
        message: "Multiple accounts found, please select one"
      });
    }
    
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { message: "Failed to verify code" },
      { status: 500 }
    );
  }
}

// Find account by ID and type
async function findAccountById(id: string, type: string) {
  switch (type) {
    case 'customer':
      return await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: { id: true }
      });
    case 'driver':
      return await prisma.driver.findUnique({
        where: { id: parseInt(id) },
        select: { id: true }
      });
    case 'mover':
      return await prisma.movingPartner.findUnique({
        where: { id: parseInt(id) },
        select: { id: true }
      });
    default:
      return null;
  }
}

// Find accounts across all tables (same as in send-code)
async function findAccounts(phoneNumber: string | null, email: string | null) {
  const accounts = [];

  // Check user table
  if (phoneNumber) {
    const user = await prisma.user.findUnique({
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
  } else if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
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

  // Check driver table
  if (phoneNumber) {
    const driver = await prisma.driver.findUnique({
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
  } else if (email) {
    const driver = await prisma.driver.findUnique({
      where: { email },
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

  // Check moving partner table
  if (phoneNumber) {
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { phoneNumber },
      select: { id: true, name: true }
    });
    
    if (movingPartner) {
      accounts.push({
        id: movingPartner.id.toString(),
        type: 'mover',
        name: movingPartner.name
      });
    }
  } else if (email) {
    const movingPartner = await prisma.movingPartner.findUnique({
      where: { email },
      select: { id: true, name: true }
    });
    
    if (movingPartner) {
      accounts.push({
        id: movingPartner.id.toString(),
        type: 'mover',
        name: movingPartner.name
      });
    }
  }

  return accounts;
} 