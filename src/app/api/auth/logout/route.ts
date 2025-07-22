/**
 * @fileoverview User logout endpoint with comprehensive cookie clearing
 * @source boombox-10.0/src/app/api/auth/logout/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles user logout by clearing all NextAuth.js session cookies.
 * Ensures complete session termination across all possible cookie variations.
 *
 * USED BY (boombox-10.0 files):
 * - Logout buttons in navigation components
 * - Session management utilities
 * - User dashboard logout functionality
 * - Admin panel logout functionality
 *
 * INTEGRATION NOTES:
 * - Clears all NextAuth.js cookie variations (session, CSRF, callback, etc.)
 * - Handles both secure and non-secure cookie variants
 * - Critical for security - ensures complete session termination
 * - Works with getServerSession for session verification
 *
 * @refactor Updated import path for authOptions, no other changes
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';

export async function POST() {
  try {
    // Get the current session before clearing it
    const session = await getServerSession(authOptions);
    
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Cookie options
    const cookieOptions = {
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
    };

    // Clear all possible NextAuth.js cookie variations
    const cookiesToClear = [
      // Session token
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      // CSRF token
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      // Callback URL
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      // Pkce
      'next-auth.pkce.code_verifier',
      '__Host-next-auth.pkce.code_verifier',
      // State
      'next-auth.state',
      '__Host-next-auth.state',
    ];

    // Clear all cookies
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions);
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to clear the cookies
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Clear cookies even if there was an error
    const cookieOptions = {
      expires: new Date(0),
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
    };

    ['next-auth.session-token', '__Secure-next-auth.session-token'].forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions);
    });

    return response;
  }
} 