/**
 * @fileoverview API endpoint to fetch customer profile information
 * @source boombox-10.0/src/app/api/users/[id]/route.ts
 * @refactor PHASE 4 - Customers Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns comprehensive customer profile data including contact information,
 * Stripe customer ID, and saved payment methods from Stripe. Used for customer identification, 
 * payment processing integration, and auto-populating forms with user data.
 * 
 * USED BY (boombox-11.0 files):
 * - src/app/(dashboard)/customer/[id]/packing-supplies/page.tsx (auto-populate contact info)
 * - Customer profile components
 * - Payment processing workflows
 * - Customer dashboard interfaces
 * - User identification systems
 * 
 * INTEGRATION NOTES:
 * - Requires customer ID path parameter
 * - Returns full profile data (firstName, lastName, email, phoneNumber, savedCards)
 * - Fetches saved payment methods from Stripe API (not database)
 * - Includes 404 handling for non-existent customers
 * - Used for auto-populating packing supplies checkout form
 * 
 * @refactor Enhanced to return complete profile data with Stripe payment methods
 */

import { NextResponse, NextRequest } from "next/server";
import { getUserProfileWithPaymentMethods } from "@/lib/utils/customerUtils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt((await params).id);

  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID." }, { status: 400 });
  }

  try {
    const userProfile = await getUserProfileWithPaymentMethods(userId);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
} 