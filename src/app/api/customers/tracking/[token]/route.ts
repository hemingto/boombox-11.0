/**
 * @fileoverview Customer appointment tracking endpoint using JWT tokens
 * @source boombox-10.0/src/app/api/tracking/[token]/route.ts
 * @refactor Migrated to use centralized JWT verification and appointment utilities
 * 
 * GET /api/customers/tracking/[token]
 * 
 * Verifies a JWT tracking token and returns appointment data for customer tracking.
 * Used by customer-facing tracking interfaces to display appointment status and details.
 * 
 * ## URL Parameters
 * - `token`: JWT token containing encoded appointment ID
 * 
 * ## Response
 * - 200: Appointment data with user and moving partner information
 * - 400: Invalid token format or missing appointment ID
 * - 404: Appointment not found
 * - 500: Server error
 * 
 * ## Response Format
 * ```json
 * {
 *   "id": number,
 *   "date": string,
 *   "status": string,
 *   "user": {
 *     "phoneNumber": string
 *   },
 *   "movingPartner": {
 *     "name": string
 *   }
 *   // ... other appointment fields
 * }
 * ```
 * 
 * ## Business Logic
 * 1. Verifies JWT token and extracts appointment ID
 * 2. Fetches appointment with user and moving partner relations
 * 3. Returns full appointment data for customer tracking interface
 * 
 * ## Security
 * - JWT token verification with configurable secret
 * - Token expiration handling
 * - Appointment-specific access control via token
 * 
 * ## Dependencies
 * - appointmentUtils.verifyTrackingToken()
 * - appointmentUtils.getAppointmentForTracking()
 */

import { NextResponse, NextRequest } from 'next/server';
import { verifyTrackingToken, getAppointmentForTracking } from '@/lib/utils/appointmentUtils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const token = (await params).token;
    
    // Verify the token and extract appointmentId using centralized utility
    const tokenResult = verifyTrackingToken(token);
    
    if (!tokenResult.valid || !tokenResult.appointmentId) {
      return NextResponse.json(
        { error: tokenResult.error || 'Invalid token' }, 
        { status: 400 }
      );
    }
    
    // Fetch appointment data using centralized utility
    const appointment = await getAppointmentForTracking(tokenResult.appointmentId);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment tracking data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment data' }, 
      { status: 500 }
    );
  }
}