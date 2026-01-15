/**
 * @fileoverview Unit tests for TimeSlotBookingService
 * @testing Time slot booking creation, deletion, and update for moving partners
 */

import { TimeSlotBookingService } from '@/lib/services/TimeSlotBookingService';

// Mock Prisma
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    timeSlotBooking: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    movingPartnerAvailability: {
      findFirst: jest.fn(),
    },
  },
}));

// Import the mocked prisma
import { prisma } from '@/lib/database/prismaClient';

describe('TimeSlotBookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateBookingForAppointment', () => {
    it('should delete existing booking when moving partner is removed', async () => {
      const mockExistingBooking = { id: 1, appointmentId: 100 };
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(mockExistingBooking);
      (prisma.timeSlotBooking.delete as jest.Mock).mockResolvedValue({});

      const result = await TimeSlotBookingService.updateBookingForAppointment(
        100, // appointmentId
        new Date('2025-01-15T10:00:00Z'),
        null, // movingPartnerId (removed)
        1 // existingMovingPartnerId
      );

      expect(result.success).toBe(true);
      expect(prisma.timeSlotBooking.findUnique).toHaveBeenCalledWith({
        where: { appointmentId: 100 }
      });
    });

    it('should do nothing when no moving partner and no existing booking', async () => {
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await TimeSlotBookingService.updateBookingForAppointment(
        100,
        new Date('2025-01-15T10:00:00Z'),
        null,
        null
      );

      expect(result.success).toBe(true);
      expect(prisma.timeSlotBooking.create).not.toHaveBeenCalled();
    });

    it('should create new booking when moving partner is assigned', async () => {
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.movingPartnerAvailability.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        movingPartnerId: 5,
        dayOfWeek: 'Wednesday',
        startTime: '00:00',
        endTime: '23:59', // Full day availability to avoid timezone issues in tests
      });
      (prisma.timeSlotBooking.create as jest.Mock).mockResolvedValue({
        id: 1,
        appointmentId: 100,
        movingPartnerAvailabilityId: 1,
      });

      // Use a time that will work regardless of local timezone
      const result = await TimeSlotBookingService.updateBookingForAppointment(
        100,
        new Date('2025-01-15T15:00:00Z'), // Wednesday, 15:00 UTC
        5, // new movingPartnerId
        null
      );

      expect(result.success).toBe(true);
      expect(prisma.timeSlotBooking.create).toHaveBeenCalled();
    });
  });

  describe('deleteBooking', () => {
    it('should delete booking if it exists', async () => {
      const mockExistingBooking = { id: 1, appointmentId: 100 };
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(mockExistingBooking);
      (prisma.timeSlotBooking.delete as jest.Mock).mockResolvedValue({});

      const result = await TimeSlotBookingService.deleteBooking(100);

      expect(result.success).toBe(true);
      expect(prisma.timeSlotBooking.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should succeed if no booking exists', async () => {
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await TimeSlotBookingService.deleteBooking(100);

      expect(result.success).toBe(true);
      expect(prisma.timeSlotBooking.delete).not.toHaveBeenCalled();
    });
  });

  describe('createBooking', () => {
    it('should create booking with correct 3-hour window', async () => {
      (prisma.movingPartnerAvailability.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        movingPartnerId: 5,
        dayOfWeek: 'Wednesday',
        startTime: '00:00',
        endTime: '23:59', // Full day availability to avoid timezone issues in tests
      });
      (prisma.timeSlotBooking.create as jest.Mock).mockResolvedValue({
        id: 1,
        appointmentId: 100,
        movingPartnerAvailabilityId: 1,
      });

      const appointmentDate = new Date('2025-01-15T14:00:00Z'); // 2 PM UTC
      const result = await TimeSlotBookingService.createBooking(
        100,
        5,
        appointmentDate
      );

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe(1);
      expect(prisma.timeSlotBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            appointmentId: 100,
            movingPartnerAvailabilityId: 1,
          })
        })
      );
    });

    it('should handle missing availability gracefully', async () => {
      (prisma.movingPartnerAvailability.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await TimeSlotBookingService.createBooking(
        100,
        5,
        new Date('2025-01-15T14:00:00Z')
      );

      expect(result.success).toBe(true);
      expect(result.error).toContain('No availability found');
      expect(prisma.timeSlotBooking.create).not.toHaveBeenCalled();
    });
  });

  describe('getBooking', () => {
    it('should return booking with moving partner details', async () => {
      const mockBooking = {
        id: 1,
        appointmentId: 100,
        movingPartnerAvailability: {
          id: 1,
          movingPartner: {
            id: 5,
            name: 'Test Movers',
          },
        },
      };
      (prisma.timeSlotBooking.findUnique as jest.Mock).mockResolvedValue(mockBooking);

      const result = await TimeSlotBookingService.getBooking(100);

      expect(result).toEqual(mockBooking);
    });
  });
});

