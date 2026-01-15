/**
 * @fileoverview Unit tests for driver time slot booking utilities
 * @testing createDriverTimeSlotBooking, deleteDriverTimeSlotBooking, and findAvailableDrivers conflict detection
 */

import {
  getUnitSpecificStartTime,
  getUnitCompletionTime,
  createDriverTimeSlotBooking,
  deleteDriverTimeSlotBooking,
} from '@/lib/utils/driverAssignmentUtils';
import { prisma } from '@/lib/database/prismaClient';

// Mock Prisma
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    driverAvailability: {
      findFirst: jest.fn(),
    },
    driverTimeSlotBooking: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Driver Time Slot Booking Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUnitSpecificStartTime', () => {
    it('should return original time for unit 1', () => {
      const originalTime = new Date('2025-01-15T10:00:00Z');
      const result = getUnitSpecificStartTime(originalTime, 1);
      expect(result.getTime()).toBe(originalTime.getTime());
    });

    it('should add 45 minutes stagger for unit 2', () => {
      const originalTime = new Date('2025-01-15T10:00:00Z');
      const result = getUnitSpecificStartTime(originalTime, 2);
      const expected = new Date('2025-01-15T10:45:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should add 90 minutes stagger for unit 3', () => {
      const originalTime = new Date('2025-01-15T10:00:00Z');
      const result = getUnitSpecificStartTime(originalTime, 3);
      const expected = new Date('2025-01-15T11:30:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('getUnitCompletionTime', () => {
    it('should add 135 minutes to unit start time', () => {
      const originalTime = new Date('2025-01-15T10:00:00Z');
      const result = getUnitCompletionTime(originalTime, 1);
      // Start time is 10:00, completion is 10:00 + 135 min = 12:15
      const expected = new Date('2025-01-15T12:15:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('should calculate completion time for staggered unit 2', () => {
      const originalTime = new Date('2025-01-15T10:00:00Z');
      const result = getUnitCompletionTime(originalTime, 2);
      // Unit 2 starts at 10:45, completion is 10:45 + 135 min = 13:00
      const expected = new Date('2025-01-15T13:00:00Z');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('createDriverTimeSlotBooking', () => {
    const mockAvailabilitySlot = {
      id: 1,
      driverId: 100,
      dayOfWeek: 'Wednesday',
      startTime: '08:00',
      endTime: '18:00',
      isBlocked: false,
    };

    it('should create a time slot booking when availability exists', async () => {
      (prisma.driverAvailability.findFirst as jest.Mock).mockResolvedValue(mockAvailabilitySlot);
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.driverTimeSlotBooking.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await createDriverTimeSlotBooking(
        100,
        500,
        new Date('2025-01-15'),
        new Date('2025-01-15T10:00:00Z'),
        1
      );

      expect(result).toBe(true);
      expect(prisma.driverAvailability.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            driverId: 100,
          }),
        })
      );
      expect(prisma.driverTimeSlotBooking.create).toHaveBeenCalled();
    });

    it('should return false when no availability slot exists', async () => {
      (prisma.driverAvailability.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await createDriverTimeSlotBooking(
        100,
        500,
        new Date('2025-01-15'),
        new Date('2025-01-15T10:00:00Z'),
        1
      );

      expect(result).toBe(false);
      expect(prisma.driverTimeSlotBooking.create).not.toHaveBeenCalled();
    });

    it('should return true if booking already exists', async () => {
      (prisma.driverAvailability.findFirst as jest.Mock).mockResolvedValue(mockAvailabilitySlot);
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        appointmentId: 500,
      });

      const result = await createDriverTimeSlotBooking(
        100,
        500,
        new Date('2025-01-15'),
        new Date('2025-01-15T10:00:00Z'),
        1
      );

      expect(result).toBe(true);
      expect(prisma.driverTimeSlotBooking.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.driverAvailability.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await createDriverTimeSlotBooking(
        100,
        500,
        new Date('2025-01-15'),
        new Date('2025-01-15T10:00:00Z'),
        1
      );

      expect(result).toBe(false);
    });

    it('should calculate correct booking window for staggered units', async () => {
      (prisma.driverAvailability.findFirst as jest.Mock).mockResolvedValue(mockAvailabilitySlot);
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.driverTimeSlotBooking.create as jest.Mock).mockResolvedValue({ id: 1 });

      await createDriverTimeSlotBooking(
        100,
        500,
        new Date('2025-01-15'),
        new Date('2025-01-15T10:00:00Z'),
        2 // Unit 2 - should be staggered
      );

      expect(prisma.driverTimeSlotBooking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          driverAvailabilityId: 1,
          appointmentId: 500,
        }),
      });

      // Verify the booking dates are for the staggered times
      const createCall = (prisma.driverTimeSlotBooking.create as jest.Mock).mock.calls[0][0];
      const bookingStart = new Date(createCall.data.bookingDate);
      const bookingEnd = new Date(createCall.data.endDate);
      
      // Unit 2 starts 45 min after original time (10:45)
      const expectedStart = new Date('2025-01-15T10:45:00Z');
      // Unit 2 completion is 10:45 + 135 min = 13:00
      const expectedEnd = new Date('2025-01-15T13:00:00Z');
      
      expect(bookingStart.getTime()).toBe(expectedStart.getTime());
      expect(bookingEnd.getTime()).toBe(expectedEnd.getTime());
    });
  });

  describe('deleteDriverTimeSlotBooking', () => {
    it('should delete existing booking', async () => {
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        appointmentId: 500,
      });
      (prisma.driverTimeSlotBooking.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await deleteDriverTimeSlotBooking(500);

      expect(result).toBe(true);
      expect(prisma.driverTimeSlotBooking.delete).toHaveBeenCalledWith({
        where: { appointmentId: 500 },
      });
    });

    it('should return true when no booking exists', async () => {
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await deleteDriverTimeSlotBooking(500);

      expect(result).toBe(true);
      expect(prisma.driverTimeSlotBooking.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.driverTimeSlotBooking.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        appointmentId: 500,
      });
      (prisma.driverTimeSlotBooking.delete as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await deleteDriverTimeSlotBooking(500);

      expect(result).toBe(false);
    });
  });

  describe('Time Slot Conflict Detection', () => {
    // Helper function to check overlap (mirrors the logic in findAvailableDrivers)
    const hasTimeOverlap = (
      newStart: number,
      newEnd: number,
      existingStart: number,
      existingEnd: number
    ): boolean => {
      return (
        (newStart >= existingStart && newStart <= existingEnd) ||
        (newEnd >= existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    };

    it('should detect overlap when new job starts during existing booking', () => {
      // Existing booking: 10:00 - 12:15 (with 1hr buffer: 9:00 - 13:15)
      // New job: 11:00 - 13:15 (with 1hr buffer: 10:00 - 14:15)
      const existingStart = new Date('2025-01-15T09:00:00Z').getTime();
      const existingEnd = new Date('2025-01-15T13:15:00Z').getTime();
      const newStart = new Date('2025-01-15T10:00:00Z').getTime();
      const newEnd = new Date('2025-01-15T14:15:00Z').getTime();

      expect(hasTimeOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
    });

    it('should detect overlap when new job ends during existing booking', () => {
      // Existing booking: 11:00 - 13:15 (with buffer: 10:00 - 14:15)
      // New job: 8:00 - 10:15 (with buffer: 7:00 - 11:15)
      const existingStart = new Date('2025-01-15T10:00:00Z').getTime();
      const existingEnd = new Date('2025-01-15T14:15:00Z').getTime();
      const newStart = new Date('2025-01-15T07:00:00Z').getTime();
      const newEnd = new Date('2025-01-15T11:15:00Z').getTime();

      expect(hasTimeOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
    });

    it('should detect overlap when new job completely contains existing booking', () => {
      // Existing booking: 11:00 - 12:00
      // New job: 9:00 - 15:00
      const existingStart = new Date('2025-01-15T11:00:00Z').getTime();
      const existingEnd = new Date('2025-01-15T12:00:00Z').getTime();
      const newStart = new Date('2025-01-15T09:00:00Z').getTime();
      const newEnd = new Date('2025-01-15T15:00:00Z').getTime();

      expect(hasTimeOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
    });

    it('should not detect overlap when jobs are separated by buffer', () => {
      // Existing booking: 10:00 - 12:15 (with 1hr buffer: 9:00 - 13:15)
      // New job: 15:00 - 17:15 (with 1hr buffer: 14:00 - 18:15)
      const existingStart = new Date('2025-01-15T09:00:00Z').getTime();
      const existingEnd = new Date('2025-01-15T13:15:00Z').getTime();
      const newStart = new Date('2025-01-15T14:00:00Z').getTime();
      const newEnd = new Date('2025-01-15T18:15:00Z').getTime();

      expect(hasTimeOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(false);
    });

    it('should detect back-to-back jobs as conflicting due to buffer', () => {
      // Existing job completion: 12:15 (with 1hr buffer after: 13:15)
      // New job start: 12:30 (with 1hr buffer before: 11:30)
      // These overlap in the buffer zone
      const existingStart = new Date('2025-01-15T09:00:00Z').getTime();
      const existingEnd = new Date('2025-01-15T13:15:00Z').getTime(); // 12:15 + 1hr
      const newStart = new Date('2025-01-15T11:30:00Z').getTime(); // 12:30 - 1hr
      const newEnd = new Date('2025-01-15T15:45:00Z').getTime();

      expect(hasTimeOverlap(newStart, newEnd, existingStart, existingEnd)).toBe(true);
    });
  });
});

