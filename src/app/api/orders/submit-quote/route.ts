/**
 * @fileoverview Submit quote API - Create new customer with appointment booking
 * @source boombox-10.0/src/app/api/submitQuote/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * POST endpoint that creates a new customer and schedules their first appointment.
 * Handles appointment booking, user creation, payment setup, and welcome notifications.
 * Triggers Onfleet task creation and driver assignment asynchronously.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/getquote/getquoteform.tsx (line 480: Customer quote submission and account creation)
 *
 * INTEGRATION NOTES:
 * - Creates database transaction for user and appointment creation
 * - Sends welcome email and SMS notifications using centralized templates
 * - Triggers async Onfleet task creation for driver assignment
 * - Validates unique email and phone number constraints
 * - Handles Stripe customer ID association for payment processing
 *
 * @refactor Moved from /api/submitQuote/ to /api/orders/submit-quote/ structure,
 *           replaced inline messaging with centralized template system,
 *           added comprehensive validation with Zod schema
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { 
  createAppointmentWithDriverAssignment, 
  processOnfleetAndAssignDriver 
} from '@/lib/utils/appointmentUtils';
import { normalizePhoneNumberToE164 } from '@/lib/utils/phoneUtils';
import { MessageService } from '@/lib/messaging/MessageService';
import { welcomeEmailNewCustomer } from '@/lib/messaging/templates/email/booking';
import { welcomeSmsNewCustomer } from '@/lib/messaging/templates/sms/booking';
import { CreateSubmitQuoteRequestSchema } from '@/lib/validations/api.validations';

/**
 * Send welcome email using centralized template system
 */
async function sendWelcomeEmailNotification(
  userEmail: string,
  userData: { firstName: string },
  appointmentData: {
    appointmentType: string;
    appointmentDate: string;
    appointmentTime: string;
    address: string;
    zipcode: string;
    numberOfUnits: number;
    planType: string;
  }
) {
  try {
    const result = await MessageService.sendEmail(
      userEmail,
      welcomeEmailNewCustomer,
      {
        firstName: userData.firstName,
        appointmentType: appointmentData.appointmentType,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        address: appointmentData.address,
        zipcode: appointmentData.zipcode,
        numberOfUnits: appointmentData.numberOfUnits.toString(),
        planType: appointmentData.planType,
      }
    );

    if (result.success) {
      console.log(`Welcome email sent to ${userEmail}`);
    } else {
      console.error('Failed to send welcome email:', result.error);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending welcome email:', errorMessage);
  }
}

/**
 * Send welcome SMS using centralized template system
 */
async function sendWelcomeSmsNotification(
  userPhoneNumber: string,
  userData: { firstName: string },
  appointmentData: {
    appointmentType: string;
    appointmentDate: string;
    appointmentTime: string;
    address: string;
  }
) {
  try {
    const result = await MessageService.sendSms(
      userPhoneNumber,
      welcomeSmsNewCustomer,
      {
        firstName: userData.firstName,
        appointmentType: appointmentData.appointmentType,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        address: appointmentData.address,
      }
    );

    if (result.success) {
      console.log(`Welcome SMS sent to ${userPhoneNumber}`);
    } else {
      console.error('Failed to send welcome SMS:', result.error);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending welcome SMS:', errorMessage);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Submit Quote Request body:", body);

    // Validate request body with Zod schema
    const validatedData = CreateSubmitQuoteRequestSchema.parse(body);

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      stripeCustomerId, 
      address,
      zipCode,
      storageUnitCount,
      selectedInsurance,
      appointmentDateTime,
      planType,
      calculatedTotal,
      parsedLoadingHelpPrice,
      monthlyStorageRate,
      monthlyInsuranceRate,
      appointmentType,
      movingPartnerId,
      thirdPartyMovingPartnerId,
    } = validatedData;

    const normalizedEmail = email.trim().toLowerCase();
    const formattedPhoneNumber = normalizePhoneNumberToE164(phoneNumber);

    // Validate and parse appointmentDateTime
    const appointmentDate = new Date(appointmentDateTime);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ error: 'Invalid appointmentDateTime format' }, { status: 400 });
    }

    // Check for duplicate phone number
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
    });

    const existingUserByEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    console.log("Normalized email:", normalizedEmail);
    console.log("Existing user by email:", existingUserByEmail);

    // Collect validation errors
    const errors: { field: string; message: string }[] = [];

    if (existingUserByPhone) {
      errors.push({ 
        field: 'phoneNumber', 
        message: 'This phone number is already in use. Please enter different phone number.' 
      });
    }

    if (existingUserByEmail) {
      errors.push({ 
        field: 'email', 
        message: 'A user with this email already exists. Please enter different email.' 
      });
    }

    // If any errors, return them
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Create appointment and user in a single transaction
    const { user, appointment } = await createAppointmentWithDriverAssignment(
      {
        firstName,
        lastName,
        email: normalizedEmail,
        phoneNumber: formattedPhoneNumber,
        stripeCustomerId
      },
      {
        movingPartnerId: movingPartnerId ? parseInt(String(movingPartnerId), 10) : null,
        thirdPartyMovingPartnerId: thirdPartyMovingPartnerId ? parseInt(String(thirdPartyMovingPartnerId), 10) : null,
        appointmentType,
        address,
        zipcode: String(zipCode),
        appointmentDateTime,
        numberOfUnits: parseInt(String(storageUnitCount), 10),
        planType,
        insuranceCoverage: selectedInsurance?.label,
        loadingHelpPrice: parsedLoadingHelpPrice,
        monthlyStorageRate,
        monthlyInsuranceRate,
        quotedPrice: calculatedTotal
      }
    );
    
    // Send Welcome Notifications using centralized templates
    try {
      // Format dates for display
      const appointmentDisplayDate = new Date(appointment.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const appointmentDisplayTime = new Date(appointment.time).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      const appointmentShortDate = new Date(appointment.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });

             // Send welcome email
       await sendWelcomeEmailNotification(
         user.email,
         { firstName: user.firstName },
         {
           appointmentType: appointment.appointmentType,
           appointmentDate: appointmentDisplayDate,
           appointmentTime: appointmentDisplayTime,
           address: appointment.address,
           zipcode: appointment.zipcode,
           numberOfUnits: appointment.numberOfUnits || 1,
           planType: appointment.planType || 'Standard',
         }
       );

      // Send welcome SMS
      await sendWelcomeSmsNotification(
        user.phoneNumber,
        { firstName: user.firstName },
        {
          appointmentType: appointment.appointmentType,
          appointmentDate: appointmentShortDate,
          appointmentTime: appointmentDisplayTime,
          address: appointment.address,
        }
      );
    } catch (notificationError: unknown) {
      // Log notification errors but do not fail the main API response
      const errorMessage = notificationError instanceof Error ? notificationError.message : 'Unknown error';
      console.error('Error sending welcome notifications:', errorMessage);
    }

    console.log(`SUBMIT_QUOTE: DEBUG - Appointment ID: ${appointment.id}, User ID: ${user.id} - Before calling processOnfleetAndAssignDriver.`);

    // Create Onfleet tasks and assign drivers asynchronously to avoid blocking the response
    // This is no longer part of the transaction to prevent long-running transactions
    processOnfleetAndAssignDriver(
      appointment.id, 
      user.id,
      {
        selectedInsurance,
        stripeCustomerId,
        deliveryReason: appointmentType === 'Initial Pickup' ? 'Initial Storage' : 
                      appointmentType === 'Additional Storage' ? 'Additional Storage' : 
                      appointmentType === 'Storage Unit Access' ? 'Access Storage' : 'End Storage Term'
      }
    ).catch(error => {
      console.error('SUBMIT_QUOTE: DEBUG - Error in processOnfleetAndAssignDriver promise:', error);
      // We don't want to fail the response even if this part fails
    });

    console.log(`SUBMIT_QUOTE: DEBUG - Appointment ID: ${appointment.id} - After calling processOnfleetAndAssignDriver (call is async).`);

    return NextResponse.json({
      message: 'Appointment scheduled successfully',
      userId: user.id,
      appointment: appointment
    });
  } catch (error: unknown) {
    console.error('Error in Submit Quote API:', error);
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any; // ZodError type
      const zodErrors = zodError.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return NextResponse.json({ errors: zodErrors }, { status: 400 });
    }
    
    // Check for Prisma unique constraint violation specifically if it's not caught before
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const prismaError = error as any; // Prisma error type
        let field = 'unknown';
        if (prismaError.meta?.target?.includes('email')) field = 'email';
        if (prismaError.meta?.target?.includes('phoneNumber')) field = 'phoneNumber';
        return NextResponse.json({ 
          errors: [{ field, message: `This ${field} is already in use.` }] 
        }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ 
      error: errorMessage
    }, { status: 500 });
  }
} 