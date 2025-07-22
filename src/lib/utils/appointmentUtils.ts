/**
 * @fileoverview Appointment utility functions for editing and managing appointments
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (various inline functions)
 * @refactor Consolidated appointment utilities from appointment edit route
 */

// Types and interfaces
export interface AppointmentChanges {
  planChanged: boolean;
  timeChanged: boolean;
  unitsAdded: number[];
  unitsRemoved: number[];
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
    timestamp: Date.now()
  };
  
  // Use base64 encoding for the token (same as driver-assign route)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Calculate what changes are being made to an appointment
 */
export function calculateAppointmentChanges(
  existingAppointment: any,
  updateData: any
): AppointmentChanges {
  const planChanged = updateData.planType && updateData.planType !== existingAppointment.planType;
  
  let timeChanged = false;
  if (updateData.appointmentDateTime) {
    const newDateTime = new Date(updateData.appointmentDateTime);
    timeChanged = existingAppointment.date.getTime() !== newDateTime.getTime();
  }

  // Calculate unit changes
  const existingUnitIds = existingAppointment.requestedStorageUnits?.map((unit: any) => unit.storageUnitId) || [];
  const newUnitIds = updateData.selectedStorageUnits || [];
  
  const unitsAdded = newUnitIds.filter((id: number) => !existingUnitIds.includes(id));
  const unitsRemoved = existingUnitIds.filter((id: number) => !newUnitIds.includes(id));

  const movingPartnerChanged = updateData.movingPartnerId !== existingAppointment.movingPartnerId;

  // Driver reassignment is required when:
  // 1. Plan changes between DIY and Full Service
  // 2. Moving partner changes
  // 3. Units are reduced (need to cancel some driver assignments)
  const driverReassignmentRequired = planChanged || movingPartnerChanged || unitsRemoved.length > 0;

  return {
    planChanged,
    timeChanged,
    unitsAdded,
    unitsRemoved,
    movingPartnerChanged,
    driverReassignmentRequired
  };
}

/**
 * Format date for SMS notifications (user-friendly format)
 */
export function formatAppointmentDateForSms(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long', 
    day: 'numeric'
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
    hour12: true 
  });
}

/**
 * Format time for regular appointments 
 */
export function formatAppointmentTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
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

  const appointmentMinutes = timeToMinutes(appointmentDate.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }));
  
  const startMinutes = timeToMinutes(availabilitySlot.startTime);
  const endMinutes = timeToMinutes(availabilitySlot.endTime);

  if (appointmentMinutes < startMinutes || appointmentMinutes > endMinutes) {
    return {
      isValid: false,
      error: `Time ${appointmentDate.toLocaleTimeString()} is outside available hours (${availabilitySlot.startTime}-${availabilitySlot.endTime})`
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
export function getUnitNumbersToRemove(currentUnitCount: number, newUnitCount: number): number[] {
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
export function validateAppointmentDateTime(dateTimeString: string): { isValid: boolean; date?: Date; error?: string } {
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.boomboxstorage.com';
  return `${baseUrl}/driver/offer/${token}`;
} 

// ===== DRIVER HELPER FUNCTIONS =====
// @source boombox-10.0/src/app/lib/driverHelpers.ts

import { prisma } from '@/lib/database/prismaClient';
import type { Driver, OnfleetTask } from '@prisma/client';

/**
 * Get all drivers assigned to an appointment through OnfleetTasks
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getDriversForAppointment)
 */
export async function getDriversForAppointment(appointmentId: number): Promise<Driver[]> {
  const onfleetTasks = await prisma.onfleetTask.findMany({
    where: { 
      appointmentId,
      driverId: { not: null }
    },
    include: {
      driver: true
    },
    distinct: ['driverId'],
  });
  
  return onfleetTasks.map((task: OnfleetTask & { driver: Driver | null }) => task.driver).filter(Boolean) as Driver[];
}

/**
 * Get the primary driver for an appointment (the first driver with the lowest unit number)
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getPrimaryDriverForAppointment)
 */
export async function getPrimaryDriverForAppointment(appointmentId: number): Promise<Driver | null> {
  const onfleetTask = await prisma.onfleetTask.findFirst({
    where: { 
      appointmentId,
      driverId: { not: null }
    },
    include: {
      driver: true
    },
    orderBy: {
      unitNumber: 'asc'
    }
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
    driver: formatDriverInfo(primaryDriver)
  };
}

/**
 * Include driver information with multiple appointments
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (includeDriversWithAppointments)
 */
export async function includeDriversWithAppointments(appointments: any[]): Promise<any[]> {
  const appointmentsWithDrivers = await Promise.all(
    appointments.map(async (appointment) => {
      return await includeDriversWithAppointment(appointment);
    })
  );
  
  return appointmentsWithDrivers;
}

/**
 * Get the driver for a specific unit number in an appointment
 * @source boombox-10.0/src/app/lib/driverHelpers.ts (getDriverForUnitNumber)
 */
export async function getDriverForUnitNumber(appointmentId: number, unitNumber: number): Promise<Driver | null> {
  const onfleetTask = await prisma.onfleetTask.findFirst({
    where: { 
      appointmentId,
      unitNumber,
      driverId: { not: null }
    },
    include: {
      driver: true
    }
  });
  
  return onfleetTask?.driver || null;
} 