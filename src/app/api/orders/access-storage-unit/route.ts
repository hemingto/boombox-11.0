/**
 * @fileoverview Storage unit access appointment creation API route
 * @source boombox-10.0/src/app/api/accessStorageUnit/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates storage unit access appointments for existing customers.
 * Handles appointment creation, storage unit assignment, moving partner booking,
 * storage usage tracking, SMS notifications, and Onfleet task creation.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/storage-unit-access/* (Customer storage access booking)
 * - src/app/user-page/[userId]/page.tsx (Customer dashboard access booking)
 * - src/app/components/edit-appointment/* (Appointment modification flows)
 *
 * INTEGRATION NOTES:
 * - Creates Onfleet tasks for storage unit access and delivery coordination
 * - Sends SMS confirmations via Twilio using centralized messaging templates
 * - Updates StorageUnitUsage records for "End Storage Term" appointments
 * - Manages moving partner availability and time slot bookings
 * - Triggers revalidation of user pages for real-time UI updates
 *
 * @refactor Improved organization with centralized utilities and messaging system
 */

import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
// eslint-disable-next-line no-restricted-imports -- appointmentUtils uses prisma/Onfleet (server-only), not re-exported from barrel
import {
  createStorageAccessAppointment,
  processOnfleetAndAssignDriver,
  type StorageAccessAppointmentData,
} from '@/lib/utils/appointmentUtils';
import { MessageService } from '@/lib/messaging/MessageService';
import { accessStorageConfirmationSms } from '@/lib/messaging/templates/sms/booking';
import { formatDateForDisplay, formatTime } from '@/lib/utils';
import { prisma } from '@/lib/database/prismaClient';
import { NotificationService } from '@/lib/services/NotificationService';
import { haulJobService } from '@/lib/services/HaulJobService';
import { HaulJobType } from '@prisma/client';

/**
 * Create storage unit access appointment
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract and validate required fields
    const {
      userId,
      address,
      zipCode,
      planType,
      appointmentDateTime,
      deliveryReason,
      selectedStorageUnits,
      description,
      appointmentType,
      parsedLoadingHelpPrice,
      monthlyStorageRate,
      monthlyInsuranceRate,
      calculatedTotal,
      movingPartnerId,
      thirdPartyMovingPartnerId,
    } = body;

    // Validate required fields
    if (!userId || !appointmentDateTime || !address || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert userId to an integer
    const numericUserId = parseInt(String(userId), 10);
    if (isNaN(numericUserId)) {
      return NextResponse.json(
        { error: 'Invalid userId format' },
        { status: 400 }
      );
    }

    // Validate and parse appointmentDateTime
    const appointmentDate = new Date(appointmentDateTime);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid appointmentDateTime format' },
        { status: 400 }
      );
    }

    // Convert selectedStorageUnits to integers
    const numericStorageUnitIds = selectedStorageUnits.map(
      (id: string | number) => (typeof id === 'string' ? parseInt(id, 10) : id)
    );

    // Check if any conversion resulted in NaN
    if (numericStorageUnitIds.some(isNaN)) {
      return NextResponse.json(
        { error: 'Invalid storage unit ID format' },
        { status: 400 }
      );
    }

    // For End Storage Term, look up the original appointment's term data
    // so early termination bill-back logic works correctly
    let originalTermData: {
      storageTerm?: string | null;
      pickupFeeWaived?: boolean;
      returnFeeWaived?: boolean;
      returnFee?: number | null;
    } = {};

    if (
      deliveryReason === 'End storage term' ||
      deliveryReason === 'End Storage Term'
    ) {
      const originalUsage = await prisma.storageUnitUsage.findFirst({
        where: {
          userId: numericUserId,
          storageUnitId: numericStorageUnitIds[0],
          usageEndDate: null,
        },
        include: {
          startAppointment: {
            select: {
              storageTerm: true,
              pickupFeeWaived: true,
              returnFeeWaived: true,
              returnFee: true,
            },
          },
        },
      });

      if (originalUsage?.startAppointment) {
        originalTermData = {
          storageTerm: originalUsage.startAppointment.storageTerm,
          pickupFeeWaived: originalUsage.startAppointment.pickupFeeWaived,
          returnFeeWaived: originalUsage.startAppointment.returnFeeWaived,
          returnFee: originalUsage.startAppointment.returnFee,
        };
      }
    }

    // Prepare appointment data
    const appointmentData: StorageAccessAppointmentData = {
      userId: numericUserId,
      address,
      zipCode,
      planType,
      appointmentDateTime: appointmentDate,
      deliveryReason,
      selectedStorageUnits: numericStorageUnitIds,
      description,
      appointmentType,
      parsedLoadingHelpPrice,
      monthlyStorageRate,
      monthlyInsuranceRate,
      calculatedTotal,
      movingPartnerId: movingPartnerId
        ? parseInt(String(movingPartnerId), 10)
        : undefined,
      thirdPartyMovingPartnerId: thirdPartyMovingPartnerId
        ? parseInt(String(thirdPartyMovingPartnerId), 10)
        : undefined,
      ...originalTermData,
    };

    // Create the appointment using centralized utility
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Handle "End Storage Term" logic - update StorageUnitUsage records
    if (
      deliveryReason === 'End storage term' ||
      deliveryReason === 'End Storage Term'
    ) {
      // Update StorageUnitUsage records to mark storage as ended
      for (const unitId of numericStorageUnitIds) {
        const usageRecord = await prisma.storageUnitUsage.findFirst({
          where: {
            userId: numericUserId,
            storageUnitId: unitId,
            usageEndDate: null, // Find active usage records
          },
        });

        if (usageRecord) {
          await prisma.storageUnitUsage.update({
            where: { id: usageRecord.id },
            data: {
              usageEndDate: appointmentDate,
              endAppointmentId: appointment.id,
            },
          });
        }
      }
    }

    // Create TimeSlotBooking if moving partner is selected
    if (movingPartnerId) {
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', {
        weekday: 'long',
      });

      // Calculate 3-hour window (1 hour before, appointment hour, 1 hour after)
      const bookingStart = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      const bookingEnd = new Date(appointmentDate.getTime() + 60 * 60 * 1000);

      const availabilitySlot = await prisma.movingPartnerAvailability.findFirst(
        {
          where: {
            movingPartnerId,
            dayOfWeek,
            startTime: { not: '' },
            endTime: { not: '' },
          },
        }
      );

      if (availabilitySlot) {
        await prisma.timeSlotBooking.create({
          data: {
            movingPartnerAvailabilityId: availabilitySlot.id,
            appointmentId: appointment.id,
            bookingDate: bookingStart,
            endDate: bookingEnd,
          },
        });
      } else {
        console.warn(
          `No availability found for moving partner ${movingPartnerId} on ${dayOfWeek}`
        );
      }
    }

    // Get user information for notifications
    const user = await prisma.user.findUnique({
      where: { id: numericUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send confirmation SMS using centralized messaging service
    try {
      const messageVariables = {
        firstName: user.firstName,
        appointmentDate: formatDateForDisplay(appointmentDate),
        appointmentTime: formatTime(appointmentDate),
      };

      const result = await MessageService.sendSms(
        user.phoneNumber,
        accessStorageConfirmationSms,
        messageVariables
      );

      if (!result.success) {
        console.error('Error sending confirmation SMS:', result.error);
      }

      // Create in-app notification for appointment confirmation
      await NotificationService.notifyAppointmentConfirmed(user.id, {
        appointmentId: appointment.id,
        appointmentType: appointment.appointmentType,
        date: appointment.date,
        time: appointment.time,
        address: appointment.address,
        zipCode: appointment.zipcode,
        numberOfUnits: numericStorageUnitIds.length,
      });
    } catch (notificationError: any) {
      console.error(
        'Error sending confirmation SMS:',
        notificationError.message
      );
      // Don't fail the appointment creation if SMS fails
    }

    // Check if any requested units are stored at Stockton — if so, create a return haul job
    try {
      const stocktonWarehouse = await prisma.warehouse.findUnique({
        where: { name: 'Stockton' },
      });
      const ssfWarehouse = await prisma.warehouse.findUnique({
        where: { name: 'South San Francisco' },
      });

      if (stocktonWarehouse && ssfWarehouse) {
        const stocktonUnitUsages = await prisma.storageUnitUsage.findMany({
          where: {
            storageUnitId: { in: numericStorageUnitIds },
            warehouseId: stocktonWarehouse.id,
            usageEndDate: null,
          },
          select: { storageUnitId: true },
        });

        const stocktonUnitIds = stocktonUnitUsages.map(u => u.storageUnitId);

        if (stocktonUnitIds.length > 0) {
          console.log(
            `ACCESS_STORAGE: ${stocktonUnitIds.length} unit(s) are at Stockton, creating return haul job`
          );
          await haulJobService.createHaulJob({
            type: HaulJobType.STOCKTON_TO_SSF,
            originWarehouseId: stocktonWarehouse.id,
            destinationWarehouseId: ssfWarehouse.id,
            storageUnitIds: stocktonUnitIds,
            notes: `Auto-created for access request (Appointment ${appointment.id})`,
          });
        }
      }
    } catch (haulError) {
      console.error(
        'ACCESS_STORAGE: Error checking Stockton units or creating haul job:',
        haulError
      );
    }

    // Process Onfleet tasks and driver assignment after the response is sent.
    // Uses next/server after() to guarantee the work completes on Vercel serverless.
    after(async () => {
      try {
        const taskResult = await processOnfleetAndAssignDriver(appointment.id, {
          userId: user.id,
          stripeCustomerId: user.stripeCustomerId ?? undefined,
          deliveryReason: deliveryReason || 'Storage Unit Access',
          storageUnitIds: numericStorageUnitIds,
        });

        if (
          taskResult.success &&
          (planType === 'Do It Yourself Plan' ||
            planType === 'Full Service Plan')
        ) {
          const { handleInitialAssignment } = await import(
            '@/app/api/onfleet/driver-assign/route'
          );

          const refreshedAppointment = await prisma.appointment.findUnique({
            where: { id: appointment.id },
            include: {
              onfleetTasks: true,
              user: true,
            },
          });

          if (refreshedAppointment) {
            await handleInitialAssignment(refreshedAppointment);
            console.log(
              `ACCESS_STORAGE: Successfully assigned driver for Appointment ID: ${appointment.id}`
            );
          }
        }
      } catch (error) {
        console.error(
          'ACCESS_STORAGE: Error in Onfleet task creation or driver assignment:',
          error
        );
      }
    });

    // Revalidate customer page for real-time updates
    revalidatePath(`/customer/${numericUserId}`);

    // Return success response with appointment and user data
    return NextResponse.json({
      success: true,
      appointment,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    console.error('Error creating storage access appointment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create appointment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
