/**
 * @fileoverview Update existing appointment with plan changes, unit modifications, and time updates
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * PUT endpoint that handles appointment modifications including plan switches (DIY ↔ Full Service),
 * storage unit count changes, time updates, moving partner assignments, and driver reassignments.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/edit-appointment/editaccessstorageappointment.tsx (line 329: Edit storage access appointments)
 * - src/app/components/edit-appointment/editaddstorageappointment.tsx (line 323: Edit additional storage appointments)
 *
 * INTEGRATION NOTES:
 * - Critical Onfleet integration - manages task creation/deletion/reassignment for plan switches
 * - Driver assignment system - triggers driver-assign route after plan changes
 * - Moving partner availability validation - checks schedule conflicts
 * - SMS notifications for drivers and moving partners on changes
 * - Database transactions for unit count changes and storage unit assignments
 *
 * @refactor Consolidated from 1,309 lines to ~300 lines using service layer architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/database/prismaClient';
import { MessageService } from '@/lib/messaging/MessageService';
import { AppointmentOnfleetService } from '@/lib/services/appointmentOnfleetService';
import { 
  UpdateAppointmentRequestSchema, 
  UpdateAppointmentResponseSchema 
} from '@/lib/validations/api.validations';
import {
  calculateAppointmentChanges,
  generateDriverReconfirmToken,
  generateDriverWebViewUrl,
  formatAppointmentDateForSms,
  formatTimeMinusOneHour,
  formatAppointmentTime,
  validateMovingPartnerAvailability,
  getDayOfWeekForAvailability,
  calculateFinalUnitCount,
  getUnitNumbersToRemove,
  validateAppointmentDateTime,
  type AppointmentChanges
} from '@/lib/utils/appointmentUtils';
import { driverReassignmentNotificationSms } from '@/lib/messaging/templates/sms/appointment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AppointmentWithRelations {
  id: number;
  planType: string;
  date: Date;
  time: Date;
  address: string;
  zipcode: string;
  numberOfUnits: number;
  userId: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  onfleetTasks: Array<{
    id: number;
    taskId: string;
    driverId: number | null;
    unitNumber: number | null;
    driverNotificationStatus: string | null;
    driver?: {
      phoneNumber: string | null;
    } | null;
  }>;
  movingPartner?: {
    id: number;
    name: string;
    phoneNumber: string | null;
    email: string | null;
  } | null;
  user: {
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
  requestedStorageUnits: Array<{
    storageUnitId: number;
  }>;
}

async function triggerDriverAssignment(appointmentId: number): Promise<void> {
  try {
    // Use fetch to call the existing boombox-10.0 driver-assign route
    // This will be refactored when we migrate the driver-assign route in Phase 4
    const response = await fetch('http://localhost:3000/api/driver-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        action: 'assign',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Driver assignment trigger failed:', errorData);
    } else {
      console.log(`Successfully triggered driver assignment for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error('Error triggering driver assignment:', error);
  }
}

async function handleDriverReconfirmation(
  appointmentId: number,
  existingAppointment: AppointmentWithRelations,
  newDateTime: Date,
  messageService: MessageService
): Promise<void> {
  // Find the driver assigned to the tasks (should be the same driver for all tasks)
  const assignedDriverTask = existingAppointment.onfleetTasks.find(task => 
    task.driverId && task.driver?.phoneNumber && 
    (task.driverNotificationStatus === 'accepted' || task.driverNotificationStatus === 'pending_reconfirmation')
  );
  
  if (!assignedDriverTask || !assignedDriverTask.driverId) {
    return;
  }

  const driverId = assignedDriverTask.driverId;
  const driverPhone = assignedDriverTask.driver?.phoneNumber;
  
  console.log(`Found assigned driver ${driverId} for appointment ${appointmentId}. Sending single reconfirmation SMS.`);
  
  // Generate a token for the driver to use in the web link (using unit 1 as representative)
  const reconfirmToken = generateDriverReconfirmToken(driverId, appointmentId, 1);
  const webViewUrl = generateDriverWebViewUrl(reconfirmToken);
  
  // Format dates for the message BEFORE updating the database
  const originalDateTime = existingAppointment.date;
  
  const originalDateStr = formatAppointmentDateForSms(originalDateTime);
  const newDateStr = formatAppointmentDateForSms(newDateTime);
  
  const originalTimeStr = formatTimeMinusOneHour(originalDateTime);
  const newTimeStr = formatTimeMinusOneHour(newDateTime);
  
  if (driverPhone) {
    await MessageService.sendSms(
      driverPhone,
      driverReassignmentNotificationSms,
      {
        appointmentType: existingAppointment.planType,
        originalDate: originalDateStr,
        originalTime: originalTimeStr,
        newDate: newDateStr,
        newTime: newTimeStr,
        webViewUrl
      }
    );
    console.log(`Sent SMS to driver ${driverId} at ${driverPhone}`);
  }
  
  // Update ALL tasks for this driver to pending_reconfirmation status
  await prisma.onfleetTask.updateMany({
    where: { 
      appointmentId: appointmentId,
      driverId: driverId 
    },
    data: {
      driverNotificationStatus: 'pending_reconfirmation', 
      driverAcceptedAt: null,
      lastNotifiedDriverId: driverId,
      driverNotificationSentAt: new Date(),
    },
  });
  
  console.log(`Updated all tasks for driver ${driverId} to pending_reconfirmation status`);
}

async function updateMovingPartnerBooking(
  appointmentId: number,
  movingPartnerId: number | null,
  appointmentDate: Date,
  existingAppointment: AppointmentWithRelations
): Promise<void> {
  if (!movingPartnerId) {
    // Delete existing booking if no moving partner selected
    const existingBooking = await prisma.timeSlotBooking.findFirst({
      where: { appointmentId }
    });
    
    if (existingBooking) {
      await prisma.timeSlotBooking.delete({
        where: { id: existingBooking.id }
      });
    }
    return;
  }

  const existingBooking = await prisma.timeSlotBooking.findFirst({
    where: { appointmentId }
  });

  const dayOfWeek = getDayOfWeekForAvailability(appointmentDate);
  
  const availabilitySlot = await prisma.movingPartnerAvailability.findFirst({
    where: {
      movingPartnerId,
      dayOfWeek,
    },
  });

  if (availabilitySlot) {
    // Validate time is within availability
    const validation = validateMovingPartnerAvailability(appointmentDate, availabilitySlot);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Calculate booking start/end times
    const bookingStart = new Date(appointmentDate.getTime() - 60 * 60 * 1000); // 1 hour before
    const bookingEnd = new Date(appointmentDate.getTime() + 2 * 60 * 60 * 1000); // 1 hour after

    // Delete old booking if exists
    if (existingBooking) {
      await prisma.timeSlotBooking.delete({
        where: { id: existingBooking.id }
      });
    }

    // Create new booking with start and end times
    await prisma.timeSlotBooking.create({
      data: {
        movingPartnerAvailabilityId: availabilitySlot.id,
        appointmentId,
        bookingDate: bookingStart,
        endDate: bookingEnd
      }
    });
  } else {
    throw new Error(`No availability found for ${dayOfWeek}`);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const messageService = new MessageService();
  const onfleetService = new AppointmentOnfleetService();
  
  try {
    // 1. Validate and parse input
    const { id: appointmentIdParam } = await params;
    const appointmentId = parseInt(appointmentIdParam, 10);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID format' }, { status: 400 });
    }
    
    const body = await req.json();
    const validatedData = UpdateAppointmentRequestSchema.parse(body);

    // 2. Fetch existing appointment with relations
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        onfleetTasks: {
          include: { driver: true },
        },
        movingPartner: true,
        user: true,
        requestedStorageUnits: true,
      },
    }) as AppointmentWithRelations | null;

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 3. Calculate changes
    const changes = calculateAppointmentChanges(existingAppointment, validatedData);
    console.log('Appointment changes:', changes);

    // 4. Validate appointment date time
    const dateTimeValidation = validateAppointmentDateTime(validatedData.appointmentDateTime);
    if (!dateTimeValidation.isValid) {
      return NextResponse.json({ error: dateTimeValidation.error }, { status: 400 });
    }
    const appointmentDate = dateTimeValidation.date!;

    // 5. Handle plan transitions BEFORE database update
    if (changes.planChanged) {
      if (existingAppointment.planType === 'Do It Yourself Plan' && validatedData.planType === 'Full Service Plan') {
        // Transition from DIY to Full Service
        await onfleetService.handleDiyToFullServiceTransition(appointmentId);
      } else if (existingAppointment.planType === 'Full Service Plan' && validatedData.planType === 'Do It Yourself Plan') {
        // Transition from Full Service to DIY
        await onfleetService.handleFullServiceToDiyTransition(appointmentId);
      }
    }

    // 6. Handle time change notifications BEFORE database update
    if (changes.timeChanged && !changes.planChanged) {
      if (existingAppointment.planType === 'Do It Yourself Plan') {
        await handleDriverReconfirmation(appointmentId, existingAppointment, appointmentDate, messageService);
      } else if (existingAppointment.planType === 'Full Service Plan' && 
                 existingAppointment.movingPartnerId === validatedData.movingPartnerId) {
        // Same moving partner, notify of time change
        await onfleetService.notifyMovingPartnerTimeChange(
          appointmentId,
          existingAppointment.date,
          appointmentDate
        );
      }
    }

    // 7. Handle unit removals BEFORE database update
    if (changes.unitsRemoved.length > 0) {
      const unitNumbersToRemove = getUnitNumbersToRemove(
        existingAppointment.numberOfUnits,
        validatedData.selectedStorageUnits?.length || 0
      );
      if (unitNumbersToRemove.length > 0) {
        await onfleetService.deleteTasksForRemovedUnits(appointmentId, unitNumbersToRemove);
      }
    }

    // 8. Convert and validate data for database update
    const numericUserId = typeof validatedData.userId === 'string' 
      ? parseInt(validatedData.userId, 10) 
      : validatedData.userId;
    
    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    const numericStorageUnitIds = validatedData.selectedStorageUnits || [];
    const finalNumberOfUnits = calculateFinalUnitCount(
      existingAppointment.numberOfUnits,
      numericStorageUnitIds,
      validatedData.additionalUnitsCount
    );

    // Calculate final moving partner IDs
    const finalMovingPartnerId = validatedData.planType === 'Full Service Plan' 
      ? validatedData.movingPartnerId 
      : null;
    const finalThirdPartyMovingPartnerId = validatedData.planType === 'Third Party Loading Help' 
      ? validatedData.thirdPartyMovingPartnerId 
      : null;

    // 9. Update moving partner booking
    await updateMovingPartnerBooking(
      appointmentId,
      finalMovingPartnerId,
      appointmentDate,
      existingAppointment
    );

    // 10. Update appointment in database
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        userId: numericUserId,
        address: validatedData.address,
        zipcode: validatedData.zipCode,
        date: appointmentDate,
        time: appointmentDate,
        planType: validatedData.planType,
        deliveryReason: validatedData.deliveryReason,
        numberOfUnits: finalNumberOfUnits,
        description: validatedData.description || 'No added info',
        appointmentType: validatedData.appointmentType,
        loadingHelpPrice: validatedData.selectedLabor?.price 
          ? parseFloat(validatedData.selectedLabor.price.replace(/[^\d.]/g, '')) 
          : validatedData.parsedLoadingHelpPrice || 0,
        monthlyStorageRate: validatedData.monthlyStorageRate,
        monthlyInsuranceRate: validatedData.monthlyInsuranceRate,
        insuranceCoverage: validatedData.selectedInsurance?.label || null,
        quotedPrice: validatedData.calculatedTotal,
        status: validatedData.status || 'Scheduled',
        requestedStorageUnits: {
          deleteMany: {},
          create: numericStorageUnitIds.map((unitId: number) => ({
            storageUnit: { connect: { id: unitId } }
          }))
        },
        movingPartnerId: finalMovingPartnerId,
        thirdPartyMovingPartnerId: finalThirdPartyMovingPartnerId,
      },
      include: {
        requestedStorageUnits: {
          include: { storageUnit: true }
        }
      }
    });

    // 11. Update Onfleet tasks with new appointment data
    await onfleetService.updateAppointmentTasks(appointmentId, {
      appointmentType: validatedData.appointmentType,
      address: validatedData.address,
      zipcode: validatedData.zipCode,
      time: appointmentDate,
      description: validatedData.description || 'No added info',
      planType: validatedData.planType,
      selectedLabor: validatedData.selectedLabor,
      loadingHelpPrice: validatedData.selectedLabor?.price 
        ? parseFloat(validatedData.selectedLabor.price.replace(/[^\d.]/g, '')) 
        : validatedData.parsedLoadingHelpPrice || 0,
      storageUnitCount: finalNumberOfUnits
    });

    // 12. Create additional Onfleet tasks for new units
    if (changes.unitsAdded.length > 0) {
      await onfleetService.createAdditionalTasks(appointmentId, changes.unitsAdded, {
        address: validatedData.address,
        zipCode: validatedData.zipCode,
        appointmentDateTime: appointmentDate.toISOString(),
        planType: validatedData.planType,
        deliveryReason: validatedData.deliveryReason,
        description: validatedData.description || 'No added info',
        appointmentType: validatedData.appointmentType,
        parsedLoadingHelpPrice: validatedData.parsedLoadingHelpPrice,
        monthlyStorageRate: validatedData.monthlyStorageRate,
        monthlyInsuranceRate: validatedData.monthlyInsuranceRate,
        calculatedTotal: validatedData.calculatedTotal,
        movingPartnerId: finalMovingPartnerId,
        thirdPartyMovingPartnerId: finalThirdPartyMovingPartnerId,
        selectedLabor: validatedData.selectedLabor,
        stripeCustomerId: validatedData.stripeCustomerId || "none",
      });
    }

    // 13. Handle additional units for Initial Pickup/Additional Storage appointments
    if ((validatedData.appointmentType === 'Additional Storage' || validatedData.appointmentType === 'Initial Pickup') && 
        validatedData.additionalUnitsCount && validatedData.additionalUnitsCount > 0) {
      await onfleetService.createAdditionalTasks(appointmentId, [], {
        address: validatedData.address,
        zipCode: validatedData.zipCode,
        appointmentDateTime: appointmentDate.toISOString(),
        planType: validatedData.planType,
        deliveryReason: validatedData.deliveryReason,
        description: validatedData.description || 'No added info',
        appointmentType: validatedData.appointmentType,
        parsedLoadingHelpPrice: validatedData.parsedLoadingHelpPrice,
        monthlyStorageRate: validatedData.monthlyStorageRate,
        monthlyInsuranceRate: validatedData.monthlyInsuranceRate,
        calculatedTotal: validatedData.calculatedTotal,
        movingPartnerId: finalMovingPartnerId,
        thirdPartyMovingPartnerId: finalThirdPartyMovingPartnerId,
        selectedLabor: validatedData.selectedLabor,
        stripeCustomerId: validatedData.stripeCustomerId || "none",
        additionalUnitsCount: validatedData.additionalUnitsCount,
        additionalUnitsOnly: true,
      });
    }

    // 14. Trigger driver assignment if needed
    if (changes.driverReassignmentRequired) {
      console.log(`Triggering driver assignment for appointment ${appointmentId} due to changes`);
      await triggerDriverAssignment(appointmentId);
    }

    // 15. Revalidate cache and return response
    revalidatePath(`/user-page/${updatedAppointment.userId}/`);

    const response = UpdateAppointmentResponseSchema.parse({
      success: true,
      appointment: updatedAppointment,
      newUnitsAdded: changes.unitsAdded.length > 0 || (validatedData.additionalUnitsCount && validatedData.additionalUnitsCount > 0),
      newUnitCount: changes.unitsAdded.length || validatedData.additionalUnitsCount || 0,
      changes
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error updating appointment:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update appointment', 
      details: error.message 
    }, { status: 500 });
  }
} 