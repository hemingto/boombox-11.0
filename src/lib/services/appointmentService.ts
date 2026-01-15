/**
 * @fileoverview Appointment service for creating, fetching, and editing appointments
 * @source boombox-10.0/src/app/lib/appointments.ts
 * @source boombox-10.0/src/app/components/edit-appointment/editaccessstorageappointment.tsx (fetchAppointmentDetails)
 * 
 * SERVICE FUNCTIONALITY:
 * - Create appointments with driver assignment
 * - Fetch appointment details for editing
 * - Update existing appointments
 * - Handle appointment data transformation
 * 
 * API ROUTES SUPPORTED:
 * - POST /api/orders/submit-quote (appointment creation)
 * - GET /api/orders/appointments/[id]/details (appointment fetching)
 * - PUT /api/orders/appointments/[id]/edit (appointment updating)
 * 
 * @refactor Extended with appointment data fetching and editing capabilities
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

// ===== APPOINTMENT DATA FETCHING INTERFACES =====

export interface AppointmentDetailsData {
  id: number;
  userId: number;
  address: string;
  zipcode: string;
  appointmentType: string;
  planType: string | null;
  deliveryReason: string | null;
  description: string;
  date: Date | null;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  movingPartnerId: number | null;
  thirdPartyMovingPartnerId: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    stripeCustomerId: string | null;
  } | null;
  movingPartner: {
    id: number;
    name: string;
    hourlyRate: number;
    onfleetTeamId: string | null;
  } | null;
  thirdPartyMovingPartner: {
    id: number;
    name: string;
  } | null;
  requestedStorageUnits: Array<{
    storageUnitId: number;
    storageUnit: {
      id: number;
      unitNumber: string;
      size: string;
      location: string;
    };
  }>;
  additionalInfo: {
    stripeCustomerId?: string;
    [key: string]: any;
  } | null;
}

export interface UpdateAppointmentData {
  address?: string;
  zipcode?: string;
  appointmentDateTime?: Date | string;
  deliveryReason?: string;
  planType?: string;
  description?: string;
  parsedLoadingHelpPrice?: number;
  monthlyStorageRate?: number;
  monthlyInsuranceRate?: number;
  calculatedTotal?: number;
  movingPartnerId?: number | null;
  thirdPartyMovingPartnerId?: number | null;
  selectedStorageUnits?: number[];
  appointmentType?: string;
}

export interface AppointmentServiceOptions {
  timeout?: number;
  retries?: number;
  includeRelations?: boolean;
}

export interface AppointmentServiceError extends Error {
  code: 'NOT_FOUND' | 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'SERVER_ERROR';
  details?: string;
}

// ===== SERVICE RESULT INTERFACES =====

export interface FetchAppointmentResult {
  success: boolean;
  data?: AppointmentDetailsData;
  error?: string;
}

export interface UpdateAppointmentResult {
  success: boolean;
  data?: { appointmentId: number; updatedAt: Date };
  error?: string;
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

    // Use the createOnfleetTasksWithDatabaseSave function for task creation
    const { createOnfleetTasksWithDatabaseSave } = await import('@/lib/services/appointmentOnfleetService');
    
    console.log(`PROCESS_ONFLEET: DEBUG - Calling createOnfleetTasksWithDatabaseSave for Appointment ID: ${appointmentId}.`);
    
    // Create Onfleet tasks and save to database
    const taskResult = await createOnfleetTasksWithDatabaseSave(payload);
    
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

// ===== APPOINTMENT DATA FETCHING FUNCTIONS =====

/**
 * Fetches appointment details with all related data for editing
 * @param appointmentId - The ID of the appointment to fetch
 * @param options - Service options for timeout, retries, etc.
 * @returns Promise with appointment data or error
 */
export async function fetchAppointmentDetails(
  appointmentId: number,
  options: AppointmentServiceOptions = {}
): Promise<FetchAppointmentResult> {
  const {
    timeout = 10000,
    retries = 3,
    includeRelations = true
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: includeRelations ? {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              stripeCustomerId: true
            }
          },
          movingPartner: {
            select: {
              id: true,
              name: true,
              hourlyRate: true,
              onfleetTeamId: true
            }
          },
          thirdPartyMovingPartner: {
            select: {
              id: true,
              title: true
            }
          },
          requestedStorageUnits: {
            include: {
              storageUnit: {
                select: {
                  id: true,
                  storageUnitNumber: true,
                  status: true,
                  barcode: true
                }
              }
            }
          },
          additionalInfo: true
        } : undefined
      });

      clearTimeout(timeoutId);

      if (!appointment) {
        const error: AppointmentServiceError = new Error(`Appointment with ID ${appointmentId} not found`) as AppointmentServiceError;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Transform the data to match our interface
      const appointmentData: AppointmentDetailsData = {
        id: appointment.id,
        userId: appointment.userId,
        address: appointment.address,
        zipcode: appointment.zipcode,
        appointmentType: appointment.appointmentType,
        planType: appointment.planType,
        deliveryReason: appointment.deliveryReason || null,
        description: appointment.description || '',
        date: appointment.date,
        parsedLoadingHelpPrice: appointment.loadingHelpPrice || 0,
        monthlyStorageRate: appointment.monthlyStorageRate || 0,
        monthlyInsuranceRate: appointment.monthlyInsuranceRate || 0,
        calculatedTotal: appointment.quotedPrice || 0,
        movingPartnerId: appointment.movingPartnerId,
        thirdPartyMovingPartnerId: appointment.thirdPartyMovingPartnerId,
        status: appointment.status,
        // Add placeholder timestamps since they're not in the base Appointment model
        createdAt: new Date(), // Placeholder - actual creation time not available
        updatedAt: new Date(), // Placeholder - actual update time not available
        user: (appointment as any).user,
        movingPartner: (appointment as any).movingPartner,
        thirdPartyMovingPartner: (appointment as any).thirdPartyMovingPartner ? {
          ...(appointment as any).thirdPartyMovingPartner,
          name: (appointment as any).thirdPartyMovingPartner.title // Map title to name for consistency
        } : null,
        requestedStorageUnits: (appointment as any).requestedStorageUnits || [],
        additionalInfo: (appointment as any).additionalInfo
      };

      return {
        success: true,
        data: appointmentData
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      // Don't retry for certain error types
      if (error instanceof Error && (error as AppointmentServiceError).code === 'NOT_FOUND') {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to fetch appointment details'
  };
}

/**
 * Updates an existing appointment with new data
 * @param appointmentId - The ID of the appointment to update
 * @param updateData - The data to update
 * @param options - Service options for timeout, retries, etc.
 * @returns Promise with update result or error
 */
export async function updateAppointmentDetails(
  appointmentId: number,
  updateData: UpdateAppointmentData,
  options: AppointmentServiceOptions = {}
): Promise<UpdateAppointmentResult> {
  const {
    timeout = 10000,
    retries = 3
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Prepare update data
      const { selectedStorageUnits, ...appointmentUpdateData } = updateData;

      // Parse appointment date if provided
      if (appointmentUpdateData.appointmentDateTime) {
        appointmentUpdateData.appointmentDateTime = new Date(appointmentUpdateData.appointmentDateTime);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update the appointment
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            ...appointmentUpdateData,
            date: appointmentUpdateData.appointmentDateTime as Date | undefined,
            loadingHelpPrice: appointmentUpdateData.parsedLoadingHelpPrice,
            quotedPrice: appointmentUpdateData.calculatedTotal,
            // Note: updatedAt is handled automatically by Prisma @updatedAt directive
          }
        });

        // Update storage units if provided
        if (selectedStorageUnits && selectedStorageUnits.length > 0) {
          // Remove existing storage unit assignments
          await tx.requestedAccessStorageUnit.deleteMany({
            where: { appointmentId }
          });

          // Add new storage unit assignments
          await tx.requestedAccessStorageUnit.createMany({
            data: selectedStorageUnits.map(storageUnitId => ({
              appointmentId,
              storageUnitId
            }))
          });
        }

        return updatedAppointment;
      });

      clearTimeout(timeoutId);

      return {
        success: true,
        data: {
          appointmentId: result.id,
          updatedAt: new Date() // Provide current timestamp since Prisma handles this automatically
        }
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      // Don't retry for certain error types
      if (error instanceof Error && error.message.includes('not found')) {
        const serviceError: AppointmentServiceError = error as AppointmentServiceError;
        serviceError.code = 'NOT_FOUND';
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Failed to update appointment'
  };
}

/**
 * Validates appointment data before update
 * @param updateData - The data to validate
 * @returns Validation error message or null if valid
 */
export function validateAppointmentUpdateData(updateData: UpdateAppointmentData): string | null {
  // Check required fields if provided
  if (updateData.address !== undefined && !updateData.address.trim()) {
    return 'Address is required';
  }

  if (updateData.zipcode !== undefined && !updateData.zipcode.trim()) {
    return 'Zip code is required';
  }

  if (updateData.appointmentDateTime !== undefined) {
    const appointmentDate = new Date(updateData.appointmentDateTime);
    if (isNaN(appointmentDate.getTime())) {
      return 'Invalid appointment date';
    }
    
    // Check if appointment is in the future
    if (appointmentDate <= new Date()) {
      return 'Appointment date must be in the future';
    }
  }

  if (updateData.selectedStorageUnits !== undefined && updateData.selectedStorageUnits.length === 0) {
    return 'At least one storage unit must be selected';
  }

  // Validate numeric fields
  if (updateData.parsedLoadingHelpPrice !== undefined && updateData.parsedLoadingHelpPrice < 0) {
    return 'Loading help price cannot be negative';
  }

  if (updateData.monthlyStorageRate !== undefined && updateData.monthlyStorageRate < 0) {
    return 'Monthly storage rate cannot be negative';
  }

  if (updateData.monthlyInsuranceRate !== undefined && updateData.monthlyInsuranceRate < 0) {
    return 'Monthly insurance rate cannot be negative';
  }

  if (updateData.calculatedTotal !== undefined && updateData.calculatedTotal < 0) {
    return 'Calculated total cannot be negative';
  }

  return null;
}

/**
 * Transforms appointment data for form population
 * @param appointmentData - Raw appointment data from database
 * @returns Transformed data suitable for form state
 */
export function transformAppointmentDataForForm(appointmentData: AppointmentDetailsData) {
  return {
    // Basic info
    address: appointmentData.address,
    zipCode: appointmentData.zipcode,
    description: appointmentData.description,
    deliveryReason: appointmentData.deliveryReason,
    appointmentType: appointmentData.appointmentType,
    
    // Date and time
    scheduledDate: appointmentData.date,
    
    // Plan and pricing
    planType: appointmentData.planType,
    parsedLoadingHelpPrice: appointmentData.parsedLoadingHelpPrice,
    monthlyStorageRate: appointmentData.monthlyStorageRate,
    monthlyInsuranceRate: appointmentData.monthlyInsuranceRate,
    calculatedTotal: appointmentData.calculatedTotal,
    
    // Partners
    movingPartnerId: appointmentData.movingPartnerId,
    thirdPartyMovingPartnerId: appointmentData.thirdPartyMovingPartnerId,
    
    // Storage units
    selectedStorageUnits: appointmentData.requestedStorageUnits.map(unit => unit.storageUnitId.toString()),
    
    // User info
    stripeCustomerId: appointmentData.user?.stripeCustomerId || appointmentData.additionalInfo?.stripeCustomerId || null
  };
}