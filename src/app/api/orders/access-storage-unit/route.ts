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

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { 
  createStorageAccessAppointment, 
  processOnfleetAndAssignDriver,
  type StorageAccessAppointmentData 
} from '@/lib/utils/appointmentUtils';
import { MessageService } from '@/lib/messaging/MessageService';
import { accessStorageConfirmationSms } from '@/lib/messaging/templates/sms/booking';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';
import { prisma } from '@/lib/database/prismaClient';

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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert userId to an integer
    const numericUserId = parseInt(String(userId), 10);
    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    // Validate and parse appointmentDateTime
    const appointmentDate = new Date(appointmentDateTime);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid appointmentDateTime format' }, { status: 400 });
    }

    // Convert selectedStorageUnits to integers
    const numericStorageUnitIds = selectedStorageUnits.map((id: string | number) => 
      typeof id === 'string' ? parseInt(id, 10) : id
    );
    
    // Check if any conversion resulted in NaN
    if (numericStorageUnitIds.some(isNaN)) {
      return NextResponse.json({ error: 'Invalid storage unit ID format' }, { status: 400 });
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
      movingPartnerId: movingPartnerId ? parseInt(String(movingPartnerId), 10) : undefined,
      thirdPartyMovingPartnerId: thirdPartyMovingPartnerId ? parseInt(String(thirdPartyMovingPartnerId), 10) : undefined,
    };

    // Create the appointment using centralized utility
    const appointment = await createStorageAccessAppointment(appointmentData);

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
        appointmentTime: formatTime(appointmentDate)
      };

      const result = await MessageService.sendSms(
        user.phoneNumber,
        accessStorageConfirmationSms,
        messageVariables
      );

      if (!result.success) {
        console.error('Error sending confirmation SMS:', result.error);
      }
    } catch (notificationError: any) {
      console.error('Error sending confirmation SMS:', notificationError.message);
      // Don't fail the appointment creation if SMS fails
    }

    // Process Onfleet tasks and driver assignment asynchronously
    processOnfleetAndAssignDriver(
      appointment.id,
      {
        userId: user.id,
        stripeCustomerId: user.stripeCustomerId,
        deliveryReason: deliveryReason || 'Storage Unit Access',
        storageUnitIds: numericStorageUnitIds
      }
    ).catch(error => {
      console.error('ACCESS_STORAGE: DEBUG - Error in processOnfleetAndAssignDriver promise:', error);
      // Continue without failing the response - this is asynchronous processing
    });

    // Revalidate user page for real-time updates
    revalidatePath(`/user-page/${numericUserId}`);

    // Return success response with appointment and user data
    return NextResponse.json({ 
      success: true, 
      appointment,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error) {
    console.error('Error creating storage access appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create appointment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 