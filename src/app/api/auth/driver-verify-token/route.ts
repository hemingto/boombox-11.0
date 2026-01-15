/**
 * @fileoverview Driver job token verification endpoint
 * @source boombox-10.0/src/app/api/driver/verify-token/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that verifies base64-encoded tokens for driver job acceptance.
 * Handles both regular job acceptance and reconfirmation tokens.
 *
 * USED BY (boombox-10.0 files):
 * - Driver job acceptance links sent via SMS/email
 * - Driver reconfirmation workflows
 * - Driver job assignment notifications
 * - Onfleet task assignment system
 *
 * INTEGRATION NOTES:
 * - Decodes base64 tokens with driver/appointment/unit data
 * - Validates token expiration (2 hour window)
 * - Checks OnfleetTask assignment status
 * - Handles reconfirmation vs regular acceptance flows
 *
 * @refactor Moved from /api/driver/verify-token/ to /api/auth/driver-verify-token/ for auth organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(req: NextRequest) {
  try {
    // Get the token from the query string
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Decode the token (base64)
    let decodedToken;
    try {
      const decoded = Buffer.from(token as string, 'base64').toString();
      decodedToken = JSON.parse(decoded);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
    
    // Validate the token structure
    if (!decodedToken.driverId || !decodedToken.appointmentId || !decodedToken.timestamp) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 400 });
    }
    
    // Check if the token is expired (2 hour window)
    const isExpired = decodedToken.timestamp < Date.now() - 2 * 60 * 60 * 1000;
    
    if (isExpired) {
      return NextResponse.json({ error: 'Token has expired', expired: true }, { status: 401 });
    }
    
    // Verify the driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: decodedToken.driverId }
    });
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    
    // Verify the appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id: decodedToken.appointmentId }
    });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Handle reconfirmation tokens differently from regular tokens
    if (decodedToken.action === 'reconfirm') {
      // For reconfirmation, look for tasks where:
      // - driverId matches this driver (they already have the job assigned)
      // - driverNotificationStatus is 'pending_reconfirmation'
      // NOTE: For reconfirmations, the driver ALREADY has the job assigned (driverId is set),
      // we're just asking them to confirm after a schedule change
      const reconfirmTasks = await prisma.onfleetTask.findMany({
        where: {
          appointmentId: decodedToken.appointmentId,
          driverId: decodedToken.driverId,  // Driver already has the job assigned
          driverNotificationStatus: 'pending_reconfirmation'
        }
      });
      
      console.log('DEBUG: Reconfirmation token verification for driver', decodedToken.driverId, 'appointment', decodedToken.appointmentId);
      console.log('DEBUG: Found reconfirmation tasks:', reconfirmTasks.length);
      
      if (reconfirmTasks.length === 0) {
        // Check if tasks are already accepted (driverId is set to this driver)
        const acceptedTasks = await prisma.onfleetTask.findMany({
          where: {
            appointmentId: decodedToken.appointmentId,
            driverId: decodedToken.driverId,  // After acceptance, driverId is set
            driverNotificationStatus: 'accepted'
          }
        });
        
        console.log('DEBUG: Found accepted tasks for this driver:', acceptedTasks.length);
        
        if (acceptedTasks.length > 0) {
          return NextResponse.json({ 
            error: 'You have already reconfirmed this job',
            alreadyAccepted: true,
            driverId: decodedToken.driverId,
            appointmentId: decodedToken.appointmentId,
            unitNumber: decodedToken.unitNumber,
            action: decodedToken.action,
            timestamp: decodedToken.timestamp,
            onfleetTaskId: acceptedTasks[0].taskId
          }, { status: 400 });
        }
        
        console.log('DEBUG: No pending or accepted tasks found - returning error');
        return NextResponse.json({ 
          error: 'No pending reconfirmation found for this job',
          expired: true 
        }, { status: 400 });
      }
      
      // Return the decoded token data for reconfirmation
      console.log('DEBUG: Returning valid reconfirmation token data');
      return NextResponse.json({
        driverId: decodedToken.driverId,
        appointmentId: decodedToken.appointmentId,
        unitNumber: decodedToken.unitNumber,
        action: decodedToken.action,
        timestamp: decodedToken.timestamp,
        onfleetTaskId: reconfirmTasks[0].taskId
      });
    } else {
      // Handle regular tokens (original logic)
      const tasks = await prisma.onfleetTask.findMany({
        where: {
          appointmentId: decodedToken.appointmentId,
          unitNumber: decodedToken.unitNumber,
          // Verify the task hasn't already been assigned to another driver
          driverId: null
        }
      });
      
      // If all tasks for this unit are already assigned, return error
      if (tasks.length === 0) {
        // Check if they're assigned to this driver
        const assignedToThisDriver = await prisma.onfleetTask.findFirst({
          where: {
            appointmentId: decodedToken.appointmentId,
            unitNumber: decodedToken.unitNumber,
            driverId: decodedToken.driverId
          }
        });
        
        if (assignedToThisDriver) {
          return NextResponse.json({ 
            error: 'You have already accepted this job',
            alreadyAccepted: true,
            driverId: decodedToken.driverId,
            appointmentId: decodedToken.appointmentId,
            unitNumber: decodedToken.unitNumber,
            action: decodedToken.action,
            timestamp: decodedToken.timestamp,
            onfleetTaskId: assignedToThisDriver.taskId
          }, { status: 400 });
        }
        
        return NextResponse.json({ 
          error: 'This job has already been assigned to another driver',
          alreadyAssigned: true 
        }, { status: 400 });
      }
      
      // Return the decoded token data
      return NextResponse.json({
        driverId: decodedToken.driverId,
        appointmentId: decodedToken.appointmentId,
        unitNumber: decodedToken.unitNumber,
        action: decodedToken.action,
        timestamp: decodedToken.timestamp,
        onfleetTaskId: tasks[0].taskId
      });
    }
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify token' },
      { status: 500 }
    );
  }
} 