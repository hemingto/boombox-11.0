/**
 * @fileoverview Session retrieval endpoint for NextAuth.js
 * @source boombox-10.0/src/app/api/auth/session/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns the current user session data from NextAuth.js.
 * Used for session validation and user information retrieval.
 *
 * USED BY (boombox-10.0 files):
 * - Session management hooks and utilities
 * - Protected route components that check authentication status
 * - User dashboard components that display session data
 * - Navigation components that show user information
 *
 * INTEGRATION NOTES:
 * - Uses NextAuth.js getServerSession with authOptions
 * - Critical for authentication state management
 * - Returns null if no active session exists
 *
 * @refactor Updated import path for authOptions, no other changes
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json(session);
} 