/**
 * @fileoverview Next.js Middleware for route protection and authentication
 * @source boombox-10.0/src/middleware.ts (adapted for new route structure)
 * 
 * MIDDLEWARE FUNCTIONALITY:
 * - Protects authenticated routes from unauthenticated access
 * - Enforces user-specific access control (users can only access their own routes)
 * - Redirects logged-in users away from login pages
 * - Runs on Edge for fast authentication checks before page render
 * - Works alongside SessionExpirationModal for smooth re-authentication UX
 * 
 * ROUTE PROTECTION:
 * - /customer/[id]/* - Customer dashboard routes
 * - /service-provider/driver/[id]/* - Driver dashboard routes
 * - /service-provider/mover/[id]/* - Mover dashboard routes
 * - /admin/* - Admin dashboard routes
 * 
 * @refactor Updated from boombox-10.0 route structure to boombox-11.0 route groups
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Get the NextAuth.js token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  console.log('[middleware] Request path:', req.nextUrl.pathname, 'Token:', token ? `${token.accountType} (${token.id})` : 'null');
  
  // Redirect logged-in users away from login page to their appropriate dashboard
  if (token && req.nextUrl.pathname === '/login') {
    const accountType = (token.accountType as string)?.toLowerCase();
    const userId = token.id as string;
    
    console.log('[middleware] Logged-in user accessing /login, redirecting based on accountType:', accountType);
    
    if (accountType === 'customer' || accountType === 'user') {
      return NextResponse.redirect(new URL(`/customer/${userId}`, req.url));
    } else if (accountType === 'driver') {
      return NextResponse.redirect(new URL(`/service-provider/driver/${userId}`, req.url));
    } else if (accountType === 'mover') {
      return NextResponse.redirect(new URL(`/service-provider/mover/${userId}`, req.url));
    }
  }

  // Protect customer routes
  if (req.nextUrl.pathname.startsWith('/customer')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if the user is a customer (case-insensitive)
    // Note: 'USER' is the database value for customers
    const customerAccountType = (token.accountType as string)?.toUpperCase();
    if (customerAccountType !== 'CUSTOMER' && customerAccountType !== 'USER') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Extract customer ID from URL and ensure user can only access their own page
      const urlParts = req.nextUrl.pathname.split('/');
      const requestedUserId = urlParts[2]; // Gets the ID from /customer/:id
      
      // Check if the user is trying to access their own page
      if (requestedUserId && token.id !== requestedUserId) {
        // Redirect to their own customer page if they try to access another user's page
        return NextResponse.redirect(new URL(`/customer/${token.id}`, req.url));
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      // If there's an error parsing the token, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect driver routes (except offer pages which use token-based auth in the URL)
  if (req.nextUrl.pathname.startsWith('/service-provider/driver') && 
      !req.nextUrl.pathname.startsWith('/service-provider/driver/offer')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if the user is a driver (case-insensitive)
    if ((token.accountType as string)?.toUpperCase() !== 'DRIVER') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Extract driver ID from URL
      const urlParts = req.nextUrl.pathname.split('/');
      const requestedDriverId = urlParts[3]; // Gets the ID from /service-provider/driver/:id
      
      // Check if the user is trying to access their own page
      if (requestedDriverId && token.id !== requestedDriverId) {
        // Redirect to their own driver page if they try to access another driver's page
        return NextResponse.redirect(new URL(`/service-provider/driver/${token.id}`, req.url));
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      // If there's an error parsing the token, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect mover routes
  if (req.nextUrl.pathname.startsWith('/service-provider/mover')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if the user is a mover (case-insensitive)
    if ((token.accountType as string)?.toUpperCase() !== 'MOVER') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Extract mover ID from URL
      const urlParts = req.nextUrl.pathname.split('/');
      const requestedMoverId = urlParts[3]; // Gets the ID from /service-provider/mover/:id
      
      // Check if the user is trying to access their own page
      if (requestedMoverId && token.id !== requestedMoverId) {
        // Redirect to their own mover page if they try to access another mover's page
        return NextResponse.redirect(new URL(`/service-provider/mover/${token.id}`, req.url));
      }
    } catch (error) {
      console.error("Error parsing token:", error);
      // If there's an error parsing the token, redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    console.log('[middleware] Admin route access:', req.nextUrl.pathname, 'Token accountType:', token?.accountType);
    
    // Allow access to login and signup pages without authentication
    if (req.nextUrl.pathname === '/admin/login' || req.nextUrl.pathname === '/admin/signup') {
      const accountType = typeof token?.accountType === 'string' ? token.accountType.toUpperCase() : '';
      if (accountType === 'ADMIN') {
        // Redirect to admin dashboard if already logged in as admin
        console.log('[middleware] Already logged in as admin, redirecting to /admin');
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    // Require authentication for all other admin routes
    if (!token) {
      console.log('[middleware] No token, redirecting to /admin/login');
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Check if user is an admin (case-insensitive check)
    const accountType = (token.accountType as string)?.toUpperCase();
    if (accountType !== 'ADMIN') {
      console.log('[middleware] User is not admin (accountType:', token.accountType, '), redirecting to /');
      return NextResponse.redirect(new URL('/', req.url));
    }

    console.log('[middleware] Admin access granted for:', req.nextUrl.pathname);

    // Protect /admin/invites for SUPERADMIN only
    if (req.nextUrl.pathname === '/admin/invites' && token.role !== 'SUPERADMIN') {
      console.log('[middleware] User role:', token.role, 'not SUPERADMIN, redirecting to /admin');
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/customer/:path*',
    '/service-provider/driver/:path*',
    '/service-provider/mover/:path*',
    '/admin/:path*',
  ]
};

