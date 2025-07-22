/**
 * @fileoverview NextAuth authentication handler for all auth providers
 * @source boombox-10.0/src/app/api/auth/[...nextauth]/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET/POST endpoints that handle NextAuth.js authentication flows for all providers.
 * Supports login, logout, session management, and OAuth provider callbacks.
 *
 * USED BY (boombox-10.0 files):
 * - All authentication flows across the application
 * - Login components that redirect to NextAuth providers
 * - Session management throughout the app
 *
 * INTEGRATION NOTES:
 * - Uses centralized authOptions configuration from @/lib/auth
 * - Handles OAuth providers (Google, etc.) and credential authentication
 * - Critical for all user authentication - DO NOT modify auth logic
 *
 * @refactor Moved from /api/auth/[...nextauth]/ to /api/auth/nextauth/ structure
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthConfig";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 