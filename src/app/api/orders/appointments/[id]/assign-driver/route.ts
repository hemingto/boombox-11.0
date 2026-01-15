/**
 * @fileoverview Handle driver assignment by moving partners for appointments
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that allows moving partners to assign drivers to appointments.
 * Updates OnfleetTask records with driver information and syncs with Onfleet API.
 * Sends SMS notification to assigned driver and creates internal notifications.
 * 
 * INTEGRATION NOTES:
 * - Updates OnfleetTask.driverId for all tasks associated with the appointment
 * - Calls Onfleet API to assign worker to task containers
 * - Sends SMS notification via MessageService
 * - Creates internal notifications via NotificationService
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { NotificationService } from '@/lib/services/NotificationService';
import { driverAssignedByMoverSms } from '@/lib/messaging/templates/sms/booking';
import { format } from 'date-fns';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { z } from 'zod';

// Request validation schema
const AssignDriverRequestSchema = z.object({
  driverId: z.number().positive('Driver ID must be a positive number'),
  movingPartnerId: z.number().positive('Moving Partner ID must be a positive number'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appointmentIdFromParams = (await params).id;
    if (!appointmentIdFromParams) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const appointmentId = parseInt(appointmentIdFromParams, 10);
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID format' },
        { status: 400 }
      );
    }

    const requestBody = await request.json();

    // Validate request body
    const validationResult = AssignDriverRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { driverId, movingPartnerId } = validationResult.data;

    // Fetch the appointment with related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: true,
        movingPartner: true,
        user: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify the moving partner owns this appointment
    if (appointment.movingPartnerId !== movingPartnerId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to assign drivers to this appointment' },
        { status: 403 }
      );
    }

    // Verify the driver belongs to the moving partner
    const driverAssociation = await prisma.movingPartnerDriver.findFirst({
      where: {
        movingPartnerId,
        driverId,
        isActive: true,
      },
      include: {
        driver: true,
      },
    });

    if (!driverAssociation) {
      return NextResponse.json(
        { error: 'Driver not found or not associated with your moving partner account' },
        { status: 404 }
      );
    }

    const driver = driverAssociation.driver;

    // Verify driver is approved
    if (!driver.isApproved) {
      return NextResponse.json(
        { error: 'Driver is not approved. Please approve the driver first.' },
        { status: 400 }
      );
    }

    // Verify driver has Onfleet worker ID
    if (!driver.onfleetWorkerId) {
      return NextResponse.json(
        { error: 'Driver does not have an Onfleet worker ID. Please ensure the driver is properly set up.' },
        { status: 400 }
      );
    }

    // Get Onfleet client
    let onfleetClient;
    try {
      onfleetClient = await getOnfleetClient();
    } catch (error) {
      console.error('Failed to initialize Onfleet client:', error);
      return NextResponse.json(
        { error: 'Onfleet integration not available' },
        { status: 500 }
      );
    }

    // Update OnfleetTask records and Onfleet tasks
    const updateResults = [];
    for (const task of appointment.onfleetTasks) {
      try {
        // Update Onfleet task with worker assignment
        await (onfleetClient as any).tasks.update(task.taskId, {
          container: {
            type: 'WORKER',
            worker: driver.onfleetWorkerId,
          },
        });

        // Update database record
        await prisma.onfleetTask.update({
          where: { id: task.id },
          data: {
            driverId: driver.id,
            driverVerified: false, // Will be verified when driver accepts
            workerType: 'moving_partner'
          },
        });

        updateResults.push({ taskId: task.taskId, success: true });
      } catch (taskError) {
        console.error(`Failed to update task ${task.taskId}:`, taskError);
        updateResults.push({ taskId: task.taskId, success: false, error: taskError });
      }
    }

    // Check if any updates failed
    const failedUpdates = updateResults.filter(r => !r.success);
    if (failedUpdates.length === updateResults.length) {
      return NextResponse.json(
        { error: 'Failed to assign driver to all tasks' },
        { status: 500 }
      );
    }

    // Format date and time for SMS
    const formattedDate = format(new Date(appointment.date), 'MMMM do, yyyy');
    const formattedTime = format(new Date(appointment.time), 'h:mm a');

    // Send SMS notification to driver if they have a phone number
    if (driver.phoneNumber) {
      try {
        const normalizedPhone = normalizePhoneNumberToE164(driver.phoneNumber);
        await MessageService.sendSms(normalizedPhone, driverAssignedByMoverSms, {
          appointmentType: appointment.appointmentType,
          formattedDate,
          formattedTime,
          address: appointment.address,
        });
        console.log(`SMS sent to driver ${driver.id} for appointment ${appointmentId}`);
      } catch (smsError) {
        console.error('Failed to send SMS to driver:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    // Create internal notification for driver
    try {
      await NotificationService.notifyJobAssigned(driver.id, {
        appointmentId,
        jobType: appointment.appointmentType,
        date: appointment.date,
        time: appointment.time,
        address: appointment.address,
      });
      console.log(`Internal notification sent to driver ${driver.id}`);
    } catch (notifError) {
      console.error('Failed to create driver notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Create internal notification for moving partner
    try {
      await NotificationService.createNotification({
        recipientId: movingPartnerId,
        recipientType: 'MOVER',
        type: 'JOB_ASSIGNED',
        data: {
          appointmentId,
          jobType: appointment.appointmentType,
          date: appointment.date,
          time: appointment.time,
          address: appointment.address,
          driverName: `${driver.firstName} ${driver.lastName}`,
        },
        appointmentId,
        movingPartnerId,
        driverId: driver.id,
      });
      console.log(`Internal notification sent to moving partner ${movingPartnerId}`);
    } catch (notifError) {
      console.error('Failed to create moving partner notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Driver assigned successfully',
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
      },
      tasksUpdated: updateResults.filter(r => r.success).length,
      tasksFailed: failedUpdates.length,
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
