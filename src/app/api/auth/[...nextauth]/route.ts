/**
 * @fileoverview NextAuth.js API route handler for authentication
 * @source boombox-10.0/src/app/api/auth/[...nextauth]/route.ts
 * @refactor PHASE 4 - Authentication Domain
 * 
 * Standard NextAuth.js handler that provides authentication endpoints:
 * - POST /api/auth/signin - Sign in with credentials
 * - POST /api/auth/signout - Sign out current user
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - POST /api/auth/providers - Get available providers
 * 
 * No business logic changes - direct port from boombox-10.0
 * Uses centralized auth configuration from @/lib/auth/nextAuthConfig
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 