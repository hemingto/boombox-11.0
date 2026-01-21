/**
 * @fileoverview Appointment utility functions for editing and managing appointments
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (various inline functions)
 * @source boombox-10.0/src/app/api/drivers/[driverId]/appointments/route.ts (driver appointments fetching)
 * @refactor Consolidated appointment utilities from appointment edit route and driver appointments route
 */

// Types and interfaces
export interface AppointmentChanges {
  planChanged: boolean;
  timeChanged: boolean;
  unitsAdded: number[];
  unitsRemoved: number[];
  /**
   * For Additional Storage / Initial Pickup appointments:
   * Number of new units to create (count-based, not specific unit IDs)
   * These appointments use numberOfUnits count rather than selectedStorageUnits array
   */
  additionalUnitsToCreate: number;
  /**
   * For Additional Storage / Initial Pickup appointments:
   * Number of units to remove (count-based, not specific unit IDs)
   * Tasks with unitNumber > newCount will be deleted
   */
  unitsToRemoveByCount: number;
  movingPartnerChanged: boolean;
  driverReassignmentRequired: boolean;
}

export interface DriverReconfirmToken {
  driverId: number;
  appointmentId: number;
  unitNumber: number;
  action: 'reconfirm';
  timestamp: number;
}

export interface AppointmentComparisonData {
  existingAppointment: any;
  updateData: any;
}

export interface StorageAccessAppointmentData {
  userId: number;
  address: string;
  zipCode: string;
  planType: string;
  appointmentDateTime: Date;
  deliveryReason: string;
  selectedStorageUnits: number[];
  description?: string;
  appointmentType: string;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  movingPartnerId?: number;
  thirdPartyMovingPartnerId?: number;
}

export interface AdditionalStorageAppointmentData {
  userId: number;
  address: string;
  zipCode: string;
  storageUnitCount: number;
  selectedInsurance: string | { label: string; [key: string]: any } | null;
  appointmentDateTime: Date;
  planType: string;
  parsedLoadingHelpPrice: number;
  monthlyStorageRate: number;
  monthlyInsuranceRate: number;
  calculatedTotal: number;
  appointmentType: string;
  movingPartnerId?: number;
  description?: string;
  thirdPartyMovingPartnerId?: number;
}

/**
 * Generate a token for driver reconfirmation (same format as driver-assign route)
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 60)
 */
export function generateDriverReconfirmToken(
  driverId: number,
  appointmentId: number,
  unitNumber: number
): string {
  const payload: DriverReconfirmToken = {
    driverId,
    appointmentId,
    unitNumber,
    action: 'reconfirm',
    timestamp: Date.now(),
  };

  // Use base64 encoding for the token (same as driver-assign route)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Calculate what changes are being made to an appointment
 * 
 * Handles two different appointment types:
 * - Access Storage (Storage Unit Access, End Storage Term): Uses selectedStorageUnits (specific unit IDs)
 * - Additional Storage / Initial Pickup: Uses numberOfUnits (count-based)
 */
export function calculateAppointmentChanges(
  existingAppointment: any,
  updateData: any
): AppointmentChanges {
  const planChanged =
    updateData.planType && updateData.planType !== existingAppointment.planType;

  let timeChanged = false;
  if (updateData.appointmentDateTime) {
    const newDateTime = new Date(updateData.appointmentDateTime);
    timeChanged = existingAppointment.date.getTime() !== newDateTime.getTime();
  }

  // Calculate unit changes for Access Storage appointments (uses specific storage unit IDs)
  const existingUnitIds =
    existingAppointment.requestedStorageUnits?.map(
      (unit: any) => unit.storageUnitId
    ) || [];
  const newUnitIds = updateData.selectedStorageUnits || [];

  const unitsAdded = newUnitIds.filter(
    (id: number) => !existingUnitIds.includes(id)
  );
  const unitsRemoved = existingUnitIds.filter(
    (id: number) => !newUnitIds.includes(id)
  );

  // Calculate unit changes for Additional Storage / Initial Pickup appointments (count-based)
  // These appointments don't use requestedStorageUnits - they just specify a numberOfUnits count
  let additionalUnitsToCreate = 0;
  let unitsToRemoveByCount = 0;
  const isCountBasedAppointment = 
    existingAppointment.appointmentType === 'Additional Storage' ||
    existingAppointment.appointmentType === 'Initial Pickup';
  
  if (isCountBasedAppointment && updateData.numberOfUnits !== undefined) {
    const existingCount = existingAppointment.numberOfUnits || 0;
    const newCount = updateData.numberOfUnits;
    if (newCount > existingCount) {
      additionalUnitsToCreate = newCount - existingCount;
    } else if (newCount < existingCount) {
      unitsToRemoveByCount = existingCount - newCount;
    }
  }

  const movingPartnerChanged =
    updateData.movingPartnerId !== existingAppointment.movingPartnerId;

  // Driver reassignment is required when:
  // 1. Plan changes between DIY and Full Service
  // 2. Moving partner changes
  // 3. Units are reduced (need to cancel some driver assignments)
  const driverReassignmentRequired =
    planChanged || movingPartnerChanged || unitsRemoved.length > 0 || unitsToRemoveByCount > 0;

  return {
    planChanged,
    timeChanged,
    unitsAdded,
    unitsRemoved,
    additionalUnitsToCreate,
    unitsToRemoveByCount,
    movingPartnerChanged,
    driverReassignmentRequired,
  };
}

/**
 * Format date for SMS notifications (user-friendly format)
 */
export function formatAppointmentDateForSms(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time minus one hour for moving partners (they arrive 1 hour early)
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 671)
 */
export function formatTimeMinusOneHour(date: Date): string {
  const newDate = new Date(date.getTime() - 60 * 60 * 1000);
  return newDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time for regular appointments
 */
export function formatAppointmentTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Validate moving partner availability for appointment time
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 1067)
 */
export function validateMovingPartnerAvailability(
  appointmentDate: Date,
  availabilitySlot: any
): { isValid: boolean; error?: string } {
  if (!availabilitySlot) {
    return { isValid: false, error: 'No availability slot provided' };
  }

  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.replace(/^0/, '').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const appointmentMinutes = timeToMinutes(
    appointmentDate.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  const startMinutes = timeToMinutes(availabilitySlot.startTime);
  const endMinutes = timeToMinutes(availabilitySlot.endTime);

  if (appointmentMinutes < startMinutes || appointmentMinutes > endMinutes) {
    return {
      isValid: false,
      error: `Time ${appointmentDate.toLocaleTimeString()} is outside available hours (${availabilitySlot.startTime}-${availabilitySlot.endTime})`,
    };
  }

  return { isValid: true };
}

/**
 * Get day of week for moving partner availability lookup
 */
export function getDayOfWeekForAvailability(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Calculate final unit count for appointment
 */
export function calculateFinalUnitCount(
  originalCount: number,
  newUnits: number[],
  additionalUnitsCount?: number
): number {
  if (additionalUnitsCount && additionalUnitsCount > 0) {
    return originalCount + additionalUnitsCount;
  }
  return newUnits.length;
}

/**
 * Determine which unit numbers need to be removed when reducing unit count
 */
export function getUnitNumbersToRemove(
  currentUnitCount: number,
  newUnitCount: number
): number[] {
  if (newUnitCount >= currentUnitCount) {
    return [];
  }

  const unitNumbersToRemove = [];
  for (let i = newUnitCount + 1; i <= currentUnitCount; i++) {
    unitNumbersToRemove.push(i);
  }
  return unitNumbersToRemove;
}

/**
 * Parse loading help price from string format
 */
export function parseLoadingHelpPrice(priceString: string): number {
  if (!priceString) return 0;
  return parseFloat(priceString.replace(/[^\d.]/g, '')) || 0;
}

/**
 * Validate appointment date time format
 */
export function validateAppointmentDateTimeFormat(dateTimeString: string): {
  isValid: boolean;
  date?: Date;
  error?: string;
} {
  if (!dateTimeString) {
    return { isValid: false, error: 'Appointment date time is required' };
  }

  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid appointment date time format' };
  }

  return { isValid: true, date };
}

/**
 * Generate web view URL for driver tokens
 */
export function generateDriverWebViewUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  return `${baseUrl}/service-provider/driver/offer/${token}`;
}

// ===== DRIVER HELPER FUNCTIONS =====
// @source boombox-10.0/src/app/lib/driverHelpers.ts

import { prisma } from '@/lib/database/prismaClient';
import type { Driver, OnfleetTask } from '@prisma/client';

/**
 * Get all drivers assigned to an appointment through OnfleetTasks
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getDriversForAppointment)
 */
export async function getDriversForAppointment(
  appointmentId: number
): Promise<Driver[]> {
  const onfleetTasks = await prisma.onfleetTask.findMany({
    where: {
      appointmentId,
      driverId: { not: null },
    },
    include: {
      driver: true,
    },
    distinct: ['driverId'],
  });

  return onfleetTasks
    .map((task: OnfleetTask & { driver: Driver | null }) => task.driver)
    .filter(Boolean) as Driver[];
}

/**
 * Get the primary driver for an appointment (the first driver with the lowest unit number)
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getPrimaryDriverForAppointment)
 */
export async function getPrimaryDriverForAppointment(
  appointmentId: number
): Promise<Driver | null> {
  const onfleetTask = await prisma.onfleetTask.findFirst({
    where: {
      appointmentId,
      driverId: { not: null },
    },
    include: {
      driver: true,
    },
    orderBy: {
      unitNumber: 'asc',
    },
  });

  return onfleetTask?.driver || null;
}

/**
 * Format driver information for API responses
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (formatDriverInfo)
 */
export function formatDriverInfo(driver: Driver | null) {
  if (!driver) return null;

  return {
    firstName: driver.firstName,
    lastName: driver.lastName,
    phoneNumber: driver.phoneNumber || undefined,
    profilePicture: driver.profilePicture || undefined,
  };
}

/**
 * Include driver information with appointment data
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (includeDriversWithAppointment)
 */
export async function includeDriversWithAppointment(appointment: any) {
  // Get the primary driver
  const primaryDriver = await getPrimaryDriverForAppointment(appointment.id);

  // Add the driver info to the appointment
  return {
    ...appointment,
    driver: formatDriverInfo(primaryDriver),
  };
}

/**
 * Include driver information with multiple appointments
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (includeDriversWithAppointments)
 */
export async function includeDriversWithAppointments(
  appointments: any[]
): Promise<any[]> {
  const appointmentsWithDrivers = await Promise.all(
    appointments.map(async appointment => {
      return await includeDriversWithAppointment(appointment);
    })
  );

  return appointmentsWithDrivers;
}

/**
 * Get the driver for a specific unit number in an appointment
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getDriverForUnitNumber)
 */
export async function getDriverForUnitNumber(
  appointmentId: number,
  unitNumber: number
): Promise<Driver | null> {
  const onfleetTask = await prisma.onfleetTask.findFirst({
    where: {
      appointmentId,
      unitNumber,
      driverId: { not: null },
    },
    include: {
      driver: true,
    },
  });

  return onfleetTask?.driver || null;
}

/**
 * Fetch all appointments for a specific driver
 * @source boombox-10.0/src/app/api/drivers/[driverId]/appointments/route.ts
 * @param driverId - The ID of the driver
 * @returns Array of appointments with user, driver, and storage unit information
 */
export async function getDriverAppointments(driverId: number) {
  // First get the driver's time slot bookings
  const timeSlotBookings = await prisma.driverTimeSlotBooking.findMany({
    where: {
      driverAvailability: {
        driverId: driverId,
      },
    },
    include: {
      appointment: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
          onfleetTasks: {
            where: {
              driverId: { not: null },
            },
            include: {
              driver: {
                select: {
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                  profilePicture: true,
                },
              },
            },
            orderBy: {
              unitNumber: 'asc',
            },
            take: 1,
          },
          movingPartner: {
            select: {
              name: true,
            },
          },
          additionalInfo: true,
          requestedStorageUnits: {
            include: {
              storageUnit: true,
            },
          },
        },
      },
    },
    orderBy: {
      bookingDate: 'asc',
    },
  });

  // Also get appointments where this driver is assigned through OnfleetTask
  const onfleetTaskAppointments = await prisma.appointment.findMany({
    where: {
      onfleetTasks: {
        some: {
          driverId: driverId,
        },
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      onfleetTasks: {
        where: {
          driverId: driverId,
        },
        include: {
          driver: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profilePicture: true,
            },
          },
        },
        orderBy: {
          unitNumber: 'asc',
        },
      },
      movingPartner: {
        select: {
          name: true,
        },
      },
      additionalInfo: true,
      requestedStorageUnits: {
        include: {
          storageUnit: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Extract and format the appointments from time slot bookings
  const timeSlotAppointments = timeSlotBookings.map(booking => {
    // Get primary driver from first OnfleetTask
    const primaryDriver =
      booking.appointment.onfleetTasks.length > 0
        ? booking.appointment.onfleetTasks[0].driver
        : null;

    return {
      ...booking.appointment,
      bookingDate: booking.bookingDate,
      // Add driver property for backward compatibility
      driver: primaryDriver,
    };
  });

  // Format the OnfleetTask appointments
  const formattedOnfleetAppointments = onfleetTaskAppointments.map(
    appointment => {
      // Get primary driver from first OnfleetTask
      const primaryDriver =
        appointment.onfleetTasks.length > 0
          ? appointment.onfleetTasks[0].driver
          : null;

      return {
        ...appointment,
        bookingDate: appointment.date, // Use appointment date as booking date
        // Add driver property for backward compatibility
        driver: primaryDriver,
      };
    }
  );

  // Combine and deduplicate appointments by ID
  const allAppointments = [
    ...timeSlotAppointments,
    ...formattedOnfleetAppointments,
  ];
  const uniqueAppointments = allAppointments.filter(
    (appointment, index, arr) =>
      arr.findIndex(a => a.id === appointment.id) === index
  );

  // Sort by date
  uniqueAppointments.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return uniqueAppointments;
}

/**
 * Verify JWT tracking token and extract appointment ID
 * @source boombox-10.0/src/app/api/tracking/[token]/route.ts (JWT verification logic)
 */
export function verifyTrackingToken(token: string): {
  valid: boolean;
  appointmentId?: number;
  error?: string;
} {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as any;

    if (!decoded.appointmentId) {
      return { valid: false, error: 'Invalid token - no appointment ID' };
    }

    return { valid: true, appointmentId: decoded.appointmentId };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Update appointment additional details
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/addDetails/route.ts
 * @refactor Uses AdditionalAppointmentInfo model with upsert operation
 */
export async function updateAppointmentAdditionalDetails(
  appointmentId: number,
  details: {
    itemsOver100lbs?: boolean;
    storageTerm?: string;
    storageAccessFrequency?: string;
    moveDescription?: string;
    conditionsDescription?: string;
  }
) {
  const { prisma } = await import('@/lib/database/prismaClient');

  // First verify the appointment exists
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Upsert the additional appointment info
  return await prisma.additionalAppointmentInfo.upsert({
    where: { appointmentId: appointmentId },
    update: {
      itemsOver100lbs: details.itemsOver100lbs ?? false,
      storageTerm: details.storageTerm || null,
      storageAccessFrequency: details.storageAccessFrequency || null,
      moveDescription: details.moveDescription || null,
      conditionsDescription: details.conditionsDescription || null,
    },
    create: {
      appointmentId: appointmentId,
      itemsOver100lbs: details.itemsOver100lbs ?? false,
      storageTerm: details.storageTerm || null,
      storageAccessFrequency: details.storageAccessFrequency || null,
      moveDescription: details.moveDescription || null,
      conditionsDescription: details.conditionsDescription || null,
    },
  });
}

/**
 * Fetch appointment data for customer tracking
 * @source boombox-10.0/src/app/api/tracking/[token]/route.ts (appointment query with relations)
 */
export async function getAppointmentForTracking(appointmentId: number) {
  const { prisma } = await import('@/lib/database/prismaClient');

  return await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: {
          phoneNumber: true,
        },
      },
      movingPartner: {
        select: {
          name: true,
        },
      },
      // Add any other relations needed for tracking
    },
  });
}

/**
 * Create storage access appointment
 * @source boombox-10.0 (legacy storage access logic)
 * @refactor Added function for creating storage access appointments
 */
export async function createStorageAccessAppointment(data: StorageAccessAppointmentData) {
  const { prisma } = await import('@/lib/database/prismaClient');
  const { generateJobCode } = await import('@/lib/utils/formatUtils');
  const { accessStorageUnitPricing } = await import('@/data/accessStorageUnitPricing');

  const appointmentDate = data.appointmentDateTime;
  
  // Calculate quoted price: access storage unit pricing * number of units
  const numberOfUnits = data.selectedStorageUnits.length;
  const calculatedQuotedPrice = data.calculatedTotal || (accessStorageUnitPricing * numberOfUnits);

  return await prisma.appointment.create({
    data: {
      userId: data.userId,
      movingPartnerId: data.movingPartnerId || null,
      thirdPartyMovingPartnerId: data.thirdPartyMovingPartnerId || null,
      appointmentType: data.appointmentType || 'Storage Unit Access',
      address: data.address,
      zipcode: data.zipCode,  // Map zipCode → zipcode for Prisma schema
      date: appointmentDate,
      time: appointmentDate,
      planType: data.planType || null,
      deliveryReason: data.deliveryReason || null,
      loadingHelpPrice: data.parsedLoadingHelpPrice,
      monthlyStorageRate: data.monthlyStorageRate,
      monthlyInsuranceRate: data.monthlyInsuranceRate,
      quotedPrice: calculatedQuotedPrice,
      status: 'Scheduled',
      description: data.description || 'No added info',
      jobCode: generateJobCode(),
      // Create RequestedAccessStorageUnit records
      requestedStorageUnits: {
        create: data.selectedStorageUnits.map((unitId: number) => ({
          storageUnit: { connect: { id: unitId } }
        }))
      }
    },
    // Include the created records in response
    include: {
      requestedStorageUnits: {
        include: {
          storageUnit: true
        }
      }
    }
  });
}

/**
 * Create additional storage appointment
 * @source boombox-10.0 (legacy additional storage logic)
 * @refactor Added function for creating additional storage appointments
 */
export async function createAdditionalStorageAppointment(data: AdditionalStorageAppointmentData) {
  const { prisma } = await import('@/lib/database/prismaClient');
  const { generateJobCode } = await import('@/lib/utils/formatUtils');
  
  const appointmentDate = data.appointmentDateTime;
  
  // Extract insurance label string from insurance object (Prisma expects String, not Object)
  const insuranceCoverageValue = data.selectedInsurance
    ? (typeof data.selectedInsurance === 'string' 
        ? data.selectedInsurance 
        : data.selectedInsurance.label || null)
    : null;
  
  return await prisma.appointment.create({
    data: {
      userId: data.userId,
      movingPartnerId: data.movingPartnerId || null,
      thirdPartyMovingPartnerId: data.thirdPartyMovingPartnerId || null,
      appointmentType: data.appointmentType || 'Additional Storage',
      address: data.address,
      zipcode: data.zipCode,  // Map zipCode → zipcode for Prisma schema
      date: appointmentDate,
      time: appointmentDate,
      numberOfUnits: data.storageUnitCount || 1,
      planType: data.planType || null,
      insuranceCoverage: insuranceCoverageValue,
      loadingHelpPrice: data.parsedLoadingHelpPrice,
      monthlyStorageRate: data.monthlyStorageRate,
      monthlyInsuranceRate: data.monthlyInsuranceRate,
      quotedPrice: data.calculatedTotal || 0,
      status: 'Scheduled',
      description: data.description || 'No added info',
      jobCode: generateJobCode()
    },
  });
}

/**
 * Create Onfleet tasks for appointment
 * @source boombox-10.0 (legacy onfleet processing logic)
 * @refactor Simplified to only handle Onfleet task creation (driver assignment happens in API routes)
 * @note Driver assignment is handled separately in the API route to avoid importing server-only code
 */
export async function createOnfleetTasksForAppointment(
  appointmentId: number,
  data: {
    userId: number;
    selectedInsurance?: any;
    stripeCustomerId?: string;
    deliveryReason?: string;
    storageUnitIds?: number[];
  }
) {
  const { prisma } = await import('@/lib/database/prismaClient');
  
  console.log(`Creating Onfleet tasks for Appointment ID: ${appointmentId}`);
  
  try {
    // Fetch complete appointment data with relations
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        user: true,
        movingPartner: {
          select: { onfleetTeamId: true }
        }
      }
    });

    if (!appointment) {
      throw new Error(`Appointment with ID ${appointmentId} not found`);
    }

    // Build payload for Onfleet task creation
    const payload = {
      appointmentId,
      userId: data.userId,
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
      selectedInsurance: data.selectedInsurance || { label: appointment.insuranceCoverage },
      appointmentType: appointment.appointmentType,
      appointmentDateTime: appointment.date.getTime(),
      stripeCustomerId: data.stripeCustomerId,
      deliveryReason: data.deliveryReason,
      storageUnitIds: data.storageUnitIds // Pass through storage unit IDs for access storage appointments
    };

    // Call Onfleet task creation service
    const { createOnfleetTasksWithDatabaseSave } = await import('@/lib/services/appointmentOnfleetService');
    const taskResult = await createOnfleetTasksWithDatabaseSave(payload);
    
    console.log(`Successfully created Onfleet tasks for Appointment ID: ${appointmentId}`);

    return { success: true, taskResult, appointmentId };
  } catch (error) {
    console.error(`Error creating Onfleet tasks for Appointment ID: ${appointmentId}:`, error);
    return { success: false, error };
  }
}

/**
 * Legacy function name kept for backward compatibility
 * @deprecated Use createOnfleetTasksForAppointment instead
 */
export const processOnfleetAndAssignDriver = createOnfleetTasksForAppointment;
