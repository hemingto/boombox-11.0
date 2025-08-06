/**
 * @fileoverview Appointment service for creating appointments with driver assignment
 * @source boombox-10.0/src/app/lib/appointments.ts
 * @refactor Extracted appointment creation and driver assignment logic into centralized service
 */

import { prisma } from '@/lib/database/prismaClient';
import { generateJobCode } from '@/lib/utils/formatUtils';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  stripeCustomerId?: string;
}

export interface CreateAppointmentData {
  movingPartnerId?: number | null;
  thirdPartyMovingPartnerId?: number | null;
  appointmentType: string;
  address: string;
  zipcode: string;
  appointmentDateTime: Date | string;
  numberOfUnits: number;
  planType: string;
  insuranceCoverage?: string;
  loadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  quotedPrice: number;
}

/**
 * Creates an appointment and triggers the driver assignment process
 * within a single transaction for reliability
 */
export async function createAppointmentWithDriverAssignment(
  userData: CreateUserData,
  appointmentData: CreateAppointmentData
) {
  // Parse appointment date
  const appointmentDate = new Date(appointmentData.appointmentDateTime);

  return await prisma.$transaction(async (tx) => {
    // Create the user
    const user = await tx.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.trim().toLowerCase(),
        phoneNumber: userData.phoneNumber,
        stripeCustomerId: userData.stripeCustomerId,
      },
    });

    // Create the appointment
    const appointment = await tx.appointment.create({
      data: {
        userId: user.id,
        movingPartnerId: appointmentData.movingPartnerId || null,
        thirdPartyMovingPartnerId: appointmentData.thirdPartyMovingPartnerId || null,
        appointmentType: appointmentData.appointmentType,
        address: appointmentData.address,
        zipcode: appointmentData.zipcode,
        date: appointmentDate,
        time: appointmentDate,
        numberOfUnits: appointmentData.numberOfUnits,
        planType: appointmentData.planType,
        insuranceCoverage: appointmentData.insuranceCoverage,
        loadingHelpPrice: appointmentData.loadingHelpPrice,
        monthlyStorageRate: appointmentData.monthlyStorageRate,
        monthlyInsuranceRate: appointmentData.monthlyInsuranceRate,
        quotedPrice: appointmentData.quotedPrice,
        status: 'Scheduled',
        jobCode: generateJobCode()
      },
      include: {
        user: true,
      }
    });

    // Create time slot booking if moving partner is selected
    if (appointmentData.movingPartnerId) {
      // Fix timezone issue - use UTC methods to get correct day of week
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getUTCDay()];

      // Calculate 3-hour window (1 hour before, appointment hour, 1 hour after)
      const bookingStart = new Date(appointmentDate.getTime() - (60 * 60 * 1000));
      const bookingEnd = new Date(appointmentDate.getTime() + (60 * 60 * 1000));

      const availabilitySlot = await tx.movingPartnerAvailability.findFirst({
        where: {
          movingPartnerId: appointmentData.movingPartnerId,
          dayOfWeek,
          startTime: { not: '' },
          endTime: { not: '' }
        }
      });

      if (availabilitySlot) {
        await tx.timeSlotBooking.create({
          data: {
            movingPartnerAvailabilityId: availabilitySlot.id,
            appointmentId: appointment.id,
            bookingDate: bookingStart,
            endDate: bookingEnd
          }
        });
      }
    }

    return { user, appointment };
  });
}

/**
 * Function to create Onfleet tasks and handle driver assignment
 * for a newly created appointment
 */
export async function processOnfleetAndAssignDriver(
  appointmentId: number, 
  userId: number,
  additionalData: any
) {
  
  try {
    // Fetch the complete appointment data first
    console.log(`PROCESS_ONFLEET: DEBUG - Fetching appointment details for Appointment ID: ${appointmentId}.`);
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        user: true,
        movingPartner: {
          select: {
            onfleetTeamId: true
          }
        }
      }
    });

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    console.log(`PROCESS_ONFLEET: DEBUG - Fetched appointment type: ${appointment.appointmentType} for Appointment ID: ${appointmentId}.`);

    const payload = {
      appointmentId,
      userId,
      selectedPlanName: appointment.planType,
      selectedLabor: appointment.planType === 'Full Service Plan' && appointment.movingPartner?.onfleetTeamId
        ? { onfleetTeamId: appointment.movingPartner.onfleetTeamId } 
        : null,
      firstName: appointment.user.firstName,
      lastName: appointment.user.lastName,
      phoneNumber: appointment.user.phoneNumber,
      address: appointment.address,
      zipCode: appointment.zipcode,
      storageUnitCount: appointment.numberOfUnits,
      parsedLoadingHelpPrice: appointment.loadingHelpPrice,
      monthlyStorageRate: appointment.monthlyStorageRate,
      monthlyInsuranceRate: appointment.monthlyInsuranceRate,
      selectedInsurance: { label: appointment.insuranceCoverage },

      appointmentDateTime: appointment.date.getTime(),
      ...additionalData
    };

    console.log(`PROCESS_ONFLEET: DEBUG - Payload for create-task:`, JSON.stringify(payload, null, 2));

    // Import and call the create-task logic directly instead of making HTTP request
    const { createLinkedOnfleetTasksDirectly } = await import('@/app/api/onfleet/create-task/route');
    
    console.log(`PROCESS_ONFLEET: DEBUG - Calling createLinkedOnfleetTasksDirectly for Appointment ID: ${appointmentId}.`);
    
    const taskResult = await createLinkedOnfleetTasksDirectly(payload);
    
    console.log(`PROCESS_ONFLEET: DEBUG - Successfully created Onfleet tasks for Appointment ID: ${appointmentId}. Result:`, taskResult);

    // Task creation successful, directly call handler function for driver assignment
    if (appointment.planType === 'Do It Yourself Plan' || appointment.planType === 'Full Service Plan') {
      // IMPORTANT: Refetch the appointment with onfleetTasks included
      // This ensures we have the latest data with the tasks we just created
      const refreshedAppointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          onfleetTasks: true,
          user: true,
        }
      });
      
      if (!refreshedAppointment) {
        throw new Error(`Could not refetch appointment with ID ${appointmentId}`);
      }
      
      // Import and call the driver assignment handler
      const { handleInitialAssignment } = await import('@/app/api/onfleet/driver-assign/route');
      
      // Pass the refreshed appointment with onfleetTasks to handleInitialAssignment
      await handleInitialAssignment(refreshedAppointment);
    }

    return { success: true, taskResult };
  } catch (error) {
    console.error(`PROCESS_ONFLEET: DEBUG - Error in processOnfleetAndAssignDriver for Appointment ID: ${appointmentId}:`, error);
    return { success: false, error };
  }
}