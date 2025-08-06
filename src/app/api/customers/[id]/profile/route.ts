/**
 * @fileoverview API endpoint to fetch customer profile information
 * @source boombox-10.0/src/app/api/users/[id]/route.ts
 * @refactor PHASE 4 - Customers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns essential customer profile data including name and Stripe customer ID.
 * Used for customer identification and payment processing integration.
 * 
 * USED BY (boombox-10.0 files):
 * - Customer profile components
 * - Payment processing workflows
 * - Customer dashboard interfaces
 * - User identification systems
 * 
 * INTEGRATION NOTES:
 * - Requires customer ID path parameter
 * - Returns minimal profile data (firstName, stripeCustomerId)
 * - Includes 404 handling for non-existent customers
 * - Used primarily for Stripe payment integration
 * 
 * @refactor Removed manual Prisma disconnect (handled by connection pooling)
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/database/prismaClient";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt((await params).id);

  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true, // Only return necessary fields
        stripeCustomerId: true, // Fetch the Stripe Customer ID
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
} 