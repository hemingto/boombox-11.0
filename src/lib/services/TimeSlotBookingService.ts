/**
 * @fileoverview Time slot booking service for managing moving partner availability bookings
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (lines 1043-1109)
 * @refactor Extracted time slot booking logic into dedicated service
 */

import { prisma } from '@/lib/database/prismaClient';
import { formatTime24Hour } from '@/lib/utils/dateUtils';

/**
 * Result of a time slot booking operation
 */
export interface TimeSlotBookingResult {
  success: boolean;
  bookingId?: number;
  error?: string;
}

/**
 * TimeSlotBookingService - Manages moving partner time slot bookings for appointments
 */
export class TimeSlotBookingService {
  /**
   * Update time slot booking for an appointment
   * Handles creation, update, and deletion based on moving partner changes
   * 
   * @param appointmentId - The appointment ID
   * @param appointmentDate - The appointment date/time
   * @param movingPartnerId - New moving partner ID (null if removed)
   * @param existingMovingPartnerId - Current moving partner ID (null if none)
   */
  static async updateBookingForAppointment(
    appointmentId: number,
    appointmentDate: Date,
    movingPartnerId: number | null,
    existingMovingPartnerId: number | null
  ): Promise<TimeSlotBookingResult> {
    try {
      console.log(`📅 Updating time slot booking for appointment ${appointmentId}`);
      console.log(`   Moving partner: ${existingMovingPartnerId} → ${movingPartnerId}`);

      // Find existing booking
      const existingBooking = await prisma.timeSlotBooking.findUnique({
        where: { appointmentId }
      });

      // Case 1: Moving partner removed - delete existing booking
      if (!movingPartnerId && existingBooking) {
        await this.deleteBooking(appointmentId);
        return { success: true };
      }

      // Case 2: No moving partner and no existing booking - nothing to do
      if (!movingPartnerId && !existingBooking) {
        return { success: true };
      }

      // Case 3: Moving partner assigned - create or update booking
      if (movingPartnerId) {
        // Delete existing booking first if it exists
        if (existingBooking) {
          await prisma.timeSlotBooking.delete({
            where: { id: existingBooking.id }
          });
        }

        // Create new booking
        return await this.createBooking(appointmentId, movingPartnerId, appointmentDate);
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Error updating time slot booking for appointment ${appointmentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete time slot booking for an appointment
   * 
   * @param appointmentId - The appointment ID
   */
  static async deleteBooking(appointmentId: number): Promise<TimeSlotBookingResult> {
    try {
      console.log(`🗑️  Deleting time slot booking for appointment ${appointmentId}`);

      const existingBooking = await prisma.timeSlotBooking.findUnique({
        where: { appointmentId }
      });

      if (existingBooking) {
        await prisma.timeSlotBooking.delete({
          where: { id: existingBooking.id }
        });
        console.log(`✅ Deleted time slot booking ${existingBooking.id}`);
      } else {
        console.log(`   No existing booking found for appointment ${appointmentId}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Error deleting time slot booking:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a time slot booking for an appointment
   * Calculates 3-hour booking window (1 hour before to 1 hour after appointment)
   * 
   * @param appointmentId - The appointment ID
   * @param movingPartnerId - The moving partner ID
   * @param appointmentDate - The appointment date/time
   */
  static async createBooking(
    appointmentId: number,
    movingPartnerId: number,
    appointmentDate: Date
  ): Promise<TimeSlotBookingResult> {
    try {
      console.log(`📅 Creating time slot booking for appointment ${appointmentId}`);

      // Get day of week for availability lookup
      // Use UTC methods to avoid timezone issues
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        appointmentDate.getUTCDay()
      ];

      // Calculate 3-hour window (1 hour before, appointment hour, 1 hour after)
      const bookingStart = new Date(appointmentDate.getTime() - (60 * 60 * 1000)); // 1 hour before
      const bookingEnd = new Date(appointmentDate.getTime() + (60 * 60 * 1000));   // 1 hour after

      // Find availability slot for the moving partner
      const formattedTime = formatTime24Hour(appointmentDate);

      const availabilitySlot = await prisma.movingPartnerAvailability.findFirst({
        where: {
          movingPartnerId,
          dayOfWeek,
          startTime: { not: '' },
          endTime: { not: '' }
        }
      });

      if (!availabilitySlot) {
        console.warn(`⚠️  No availability found for moving partner ${movingPartnerId} on ${dayOfWeek}`);
        // Don't fail the operation, just skip booking creation
        return { 
          success: true,
          error: `No availability found for ${dayOfWeek}` 
        };
      }

      // Validate appointment time is within availability window
      const timeValidation = this.validateTimeWithinAvailability(
        formattedTime,
        availabilitySlot.startTime,
        availabilitySlot.endTime
      );

      if (!timeValidation.isValid) {
        console.warn(`⚠️  Appointment time ${formattedTime} outside availability (${availabilitySlot.startTime}-${availabilitySlot.endTime})`);
        // Don't fail the operation, just skip booking creation with warning
        return {
          success: true,
          error: timeValidation.error
        };
      }

      // Create the booking
      const booking = await prisma.timeSlotBooking.create({
        data: {
          movingPartnerAvailabilityId: availabilitySlot.id,
          appointmentId,
          bookingDate: bookingStart,
          endDate: bookingEnd
        }
      });

      console.log(`✅ Created time slot booking ${booking.id} for appointment ${appointmentId}`);

      return {
        success: true,
        bookingId: booking.id
      };
    } catch (error) {
      console.error(`❌ Error creating time slot booking:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate that appointment time falls within availability window
   */
  private static validateTimeWithinAvailability(
    appointmentTime: string,
    availabilityStart: string,
    availabilityEnd: string
  ): { isValid: boolean; error?: string } {
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.replace(/^0/, '').split(':').map(Number);
      return hours * 60 + (minutes || 0);
    };

    const appointmentMinutes = timeToMinutes(appointmentTime);
    const startMinutes = timeToMinutes(availabilityStart);
    const endMinutes = timeToMinutes(availabilityEnd);

    if (appointmentMinutes < startMinutes || appointmentMinutes > endMinutes) {
      return {
        isValid: false,
        error: `Time ${appointmentTime} is outside available hours (${availabilityStart}-${availabilityEnd})`
      };
    }

    return { isValid: true };
  }

  /**
   * Get existing booking for an appointment
   */
  static async getBooking(appointmentId: number) {
    return await prisma.timeSlotBooking.findUnique({
      where: { appointmentId },
      include: {
        movingPartnerAvailability: {
          include: {
            movingPartner: true
          }
        }
      }
    });
  }

  /**
   * Delete driver time slot booking for an appointment
   * This is called when a driver is unassigned to free up their availability slot
   * 
   * @param appointmentId - The appointment ID
   */
  static async deleteDriverBooking(appointmentId: number): Promise<TimeSlotBookingResult> {
    try {
      console.log(`🗑️  Deleting driver time slot booking for appointment ${appointmentId}`);

      const existingBooking = await prisma.driverTimeSlotBooking.findUnique({
        where: { appointmentId }
      });

      if (existingBooking) {
        await prisma.driverTimeSlotBooking.delete({
          where: { appointmentId }
        });
        console.log(`✅ Deleted driver time slot booking for appointment ${appointmentId}`);
      } else {
        console.log(`   No driver time slot booking found for appointment ${appointmentId}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Error deleting driver time slot booking:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete driver time slot booking for a specific driver on an appointment
   * Used when a specific driver is unassigned but others may remain
   * 
   * Note: DriverTimeSlotBooking has a unique constraint on appointmentId,
   * so this finds the booking by appointmentId and verifies the driver before deleting.
   * 
   * @param driverId - The driver ID being unassigned
   * @param appointmentId - The appointment ID
   */
  static async deleteDriverBookingForDriver(
    driverId: number,
    appointmentId: number
  ): Promise<TimeSlotBookingResult> {
    try {
      console.log(`🗑️  Deleting driver time slot booking for driver ${driverId} on appointment ${appointmentId}`);

      // Find bookings through DriverAvailability -> DriverTimeSlotBooking
      const driverAvailability = await prisma.driverAvailability.findMany({
        where: { driverId },
        include: {
          driverTimeSlotBookings: {
            where: { appointmentId }
          }
        }
      });

      let deletedCount = 0;
      for (const availability of driverAvailability) {
        for (const booking of availability.driverTimeSlotBookings) {
          await prisma.driverTimeSlotBooking.delete({
            where: { id: booking.id }
          });
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Deleted ${deletedCount} driver time slot booking(s) for driver ${driverId} on appointment ${appointmentId}`);
      } else {
        console.log(`   No driver time slot booking found for driver ${driverId} on appointment ${appointmentId}`);
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ Error deleting driver time slot booking for driver:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

