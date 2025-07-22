/**
 * @fileoverview Handle customer appointment cancellations with driver/mover notifications
 * @refactor New route for customer-initiated appointment cancellations
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that handles customer appointment cancellations.
 * Calculates cancellation fees, processes refunds, and notifies assigned drivers/movers via SMS.
 * 
 * INTEGRATION NOTES:
 * - Notifies assigned drivers and moving partners via SMS when customer cancels
 * - Calculates cancellation fees based on timing (24-hour rule)
 * - Updates Onfleet tasks and appointment status
 * - Records cancellation in database for tracking
 */

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/database/prismaClient';
import { getOnfleetClient } from '@/lib/integrations/onfleetClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { customerCancellationNotificationSms } from '@/lib/messaging/templates/sms/appointment';
import { 
  CustomerCancelAppointmentRequestSchema, 
  CustomerCancelAppointmentResponseSchema 
} from '@/lib/validations/api.validations';

// Cancellation fee configuration
const CANCELLATION_FEE = 65; // $65 fee for cancellations within 24 hours
const MINIMUM_NOTICE_HOURS = 24;

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

    // Validate request parameters
    const validationResult = CustomerCancelAppointmentRequestSchema.safeParse({
      appointmentId: appointmentIdFromParams,
      ...requestBody,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { cancellationReason, userId } = validationResult.data;
    const numericUserId = parseInt(String(userId), 10);

    // Fetch appointment with comprehensive related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        movingPartner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        onfleetTasks: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true
              }
            }
          }
        }
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify the appointment belongs to the requesting user
    if (appointment.userId !== numericUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - appointment does not belong to user' },
        { status: 403 }
      );
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'Canceled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Calculate cancellation fee based on timing
    const currentTime = new Date();
    const appointmentDateTime = new Date(appointment.date);
    const hoursUntilAppointment = (appointmentDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    const isWithinNoticeWindow = hoursUntilAppointment <= MINIMUM_NOTICE_HOURS && hoursUntilAppointment > 0;
    const cancellationFee = isWithinNoticeWindow ? CANCELLATION_FEE : 0;

    // Process the cancellation
    await processCancellation(appointment, cancellationReason, cancellationFee);

    // Notify assigned drivers and moving partners
    await notifyAssignedWorkersOfCancellation(appointment, cancellationReason);

    const response = {
      success: true,
      message: 'Appointment cancelled successfully',
      cancellationFee: cancellationFee,
      refundAmount: 0, // TODO: Calculate actual refund amount based on payments made
    };

    // Validate response format
    const responseValidation = CustomerCancelAppointmentResponseSchema.safeParse(response);
    if (!responseValidation.success) {
      console.error('Response validation failed:', responseValidation.error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

/**
 * Process the appointment cancellation
 */
async function processCancellation(
  appointment: any,
  cancellationReason: string,
  cancellationFee: number
): Promise<void> {
  // Update appointment status
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: 'Canceled',
    }
  });

  // Record the cancellation
  await prisma.appointmentCancellation.create({
    data: {
      appointmentId: appointment.id,
      cancellationFee: cancellationFee,
      cancellationReason: cancellationReason,
      cancellationDate: new Date(),
    }
  });

  // Update Onfleet tasks
  if (appointment.onfleetTasks && appointment.onfleetTasks.length > 0) {
    const onfleetClient = await getOnfleetClient();
    
    for (const task of appointment.onfleetTasks) {
      try {
        // Delete task from Onfleet
        await (onfleetClient as any).tasks.delete(task.taskId);
        console.log(`Deleted Onfleet task ${task.taskId} for cancelled appointment ${appointment.id}`);
      } catch (onfleetError) {
        console.error(`Error deleting Onfleet task ${task.taskId}:`, onfleetError);
      }

      // Update task status in database
      await prisma.onfleetTask.update({
        where: { id: task.id },
        data: {
          driverNotificationStatus: 'cancelled_by_customer',
        }
      });
    }
  }

  console.log(`Appointment ${appointment.id} cancelled by customer. Fee: $${cancellationFee}`);
}

/**
 * Notify assigned drivers and moving partners about the cancellation
 */
async function notifyAssignedWorkersOfCancellation(
  appointment: any,
  cancellationReason: string
): Promise<void> {
  const appointmentDate = new Date(appointment.date);
  const appointmentTime = new Date(appointment.time);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = appointmentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const notificationData = {
    appointmentId: appointment.id.toString(),
    appointmentDate: formattedDate,
    appointmentTime: formattedTime,
    address: appointment.address,
    cancellationReason: cancellationReason,
  };

  // Notify assigned drivers
  if (appointment.onfleetTasks && appointment.onfleetTasks.length > 0) {
    const notifiedDrivers = new Set<number>();
    
    for (const task of appointment.onfleetTasks) {
      if (task.driver && task.driver.phoneNumber && !notifiedDrivers.has(task.driver.id)) {
        try {
          await MessageService.sendSms(
            task.driver.phoneNumber,
            customerCancellationNotificationSms,
            notificationData
          );
          notifiedDrivers.add(task.driver.id);
          console.log(`Cancellation SMS sent to driver ${task.driver.firstName} ${task.driver.lastName} (${task.driver.phoneNumber})`);
        } catch (error) {
          console.error(`Error sending cancellation SMS to driver ${task.driver.id}:`, error);
        }
      }
    }
  }

  // Notify assigned moving partner
  if (appointment.movingPartner && appointment.movingPartner.phoneNumber) {
    try {
      await MessageService.sendSms(
        appointment.movingPartner.phoneNumber,
        customerCancellationNotificationSms,
        notificationData
      );
      console.log(`Cancellation SMS sent to moving partner ${appointment.movingPartner.name} (${appointment.movingPartner.phoneNumber})`);
    } catch (error) {
      console.error(`Error sending cancellation SMS to moving partner ${appointment.movingPartner.id}:`, error);
    }
  }

  if (!appointment.onfleetTasks?.length && !appointment.movingPartner) {
    console.log(`No drivers or moving partners to notify for cancelled appointment ${appointment.id}`);
  }
} 