/**
 * @fileoverview Additional storage appointment creation API route
 * @source boombox-10.0/src/app/api/addAdditionalStorage/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates additional storage appointments for existing customers.
 * Handles appointment creation with storage unit count, insurance options, moving partner 
 * booking, SMS notifications, and Onfleet task creation.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/additional-storage/* (Customer additional storage booking)
 * - src/app/user-page/[userId]/page.tsx (Customer dashboard additional storage booking)
 * - src/app/components/edit-appointment/* (Appointment modification flows)
 *
 * INTEGRATION NOTES:
 * - Creates Onfleet tasks for additional storage delivery coordination
 * - Sends SMS confirmations via Twilio using centralized messaging templates
 * - Manages moving partner availability and booking conflicts
 * - Processes insurance options and pricing calculations
 * - Triggers revalidation of user pages for real-time UI updates
 *
 * @refactor Improved organization with centralized utilities and messaging system
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { 
  createAdditionalStorageAppointment, 
  processOnfleetAndAssignDriver,
  type AdditionalStorageAppointmentData 
} from '@/lib/utils/appointmentUtils';
import { MessageService } from '@/lib/messaging/MessageService';
import { additionalStorageConfirmationSms } from '@/lib/messaging/templates/sms/booking';
import { formatDateForDisplay, formatTime } from '@/lib/utils/dateUtils';
import { prisma } from '@/lib/database/prismaClient';

/**
 * Create additional storage appointment
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract and validate required fields
    const {
      userId,
      address,
      zipCode,
      storageUnitCount,
      selectedInsurance,
      appointmentDateTime,
      planType,
      parsedLoadingHelpPrice,
      monthlyStorageRate,
      monthlyInsuranceRate,
      calculatedTotal,
      appointmentType,
      movingPartnerId,
      description,
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

    // Prepare appointment data
    const appointmentData: AdditionalStorageAppointmentData = {
      userId: numericUserId,
      address,
      zipCode,
      storageUnitCount,
      selectedInsurance,
      appointmentDateTime: appointmentDate,
      planType,
      parsedLoadingHelpPrice,
      monthlyStorageRate,
      monthlyInsuranceRate,
      calculatedTotal,
      appointmentType,
      movingPartnerId: movingPartnerId ? parseInt(String(movingPartnerId), 10) : undefined,
      description,
      thirdPartyMovingPartnerId: thirdPartyMovingPartnerId ? parseInt(String(thirdPartyMovingPartnerId), 10) : undefined,
    };

    // Create the appointment using centralized utility
    const appointment = await createAdditionalStorageAppointment(appointmentData);

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
        additionalStorageConfirmationSms,
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
      user.id,
      {
        selectedInsurance,
        stripeCustomerId: user.stripeCustomerId,
        deliveryReason: 'Additional Storage'
      }
    ).catch(error => {
      console.error('ADD_STORAGE: DEBUG - Error in processOnfleetAndAssignDriver promise:', error);
      // Continue without failing the response - this is asynchronous processing
    });

    // Revalidate user page for real-time updates
    revalidatePath(`/user-page/${numericUserId}`);

    // Return success response with appointment and user data
    return NextResponse.json({
      message: 'Appointment added successfully',
      appointment,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });

  } catch (error: any) {
    console.error('Error creating additional storage appointment:', error);
    
    // Handle Prisma unique constraint violations (booking conflicts)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A booking conflict occurred.' }, { status: 409 });
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
} 