/**
 * @fileoverview Unit tests for DriverReconfirmationService
 * @testing Driver reconfirmation flow for appointment time changes
 */

import { DriverReconfirmationService } from '@/lib/services/DriverReconfirmationService';
import { MessageService } from '@/lib/messaging/MessageService';
import * as appointmentUtils from '@/lib/utils/appointmentUtils';

// Mock dependencies
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    onfleetTask: {
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/messaging/MessageService');
jest.mock('@/lib/utils/appointmentUtils', () => ({
  generateDriverReconfirmToken: jest.fn(() => 'mock-token'),
  generateDriverWebViewUrl: jest.fn(() => 'https://example.com/driver/offer/mock-token'),
  formatTimeMinusOneHour: jest.fn((date) => '1:00 PM'),
}));
jest.mock('@/lib/utils/dateUtils', () => ({
  formatVerboseDate: jest.fn((date) => 'Wednesday, January 15'),
}));

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
    },
  }));
});

import { prisma } from '@/lib/database/prismaClient';

describe('DriverReconfirmationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('sendReconfirmationRequest', () => {
    const mockDriver = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+15551111111',
    };

    const mockAppointment = {
      id: 100,
      appointmentType: 'Storage Unit Access',
      address: '123 Test St',
      date: new Date('2025-01-15T14:00:00Z'),
      time: new Date('2025-01-15T14:00:00Z'),
      description: 'Test appointment',
    };

    it('should send reconfirmation SMS successfully', async () => {
      (MessageService.sendSms as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'mock-message-id',
      });

      const result = await DriverReconfirmationService.sendReconfirmationRequest(
        mockDriver,
        mockAppointment,
        new Date('2025-01-15T14:00:00Z'),
        new Date('2025-01-16T16:00:00Z'),
        1
      );

      expect(result.success).toBe(true);
      expect(result.smsSent).toBe(true);
      expect(appointmentUtils.generateDriverReconfirmToken).toHaveBeenCalledWith(1, 100, 1);
      expect(MessageService.sendSms).toHaveBeenCalledWith(
        '+15551111111',
        expect.any(Object),
        expect.objectContaining({
          appointmentType: 'Storage Unit Access',
          webViewUrl: 'https://example.com/driver/offer/mock-token',
        })
      );
    });

    it('should handle driver without phone number', async () => {
      const driverNoPhone = { ...mockDriver, phoneNumber: null };

      const result = await DriverReconfirmationService.sendReconfirmationRequest(
        driverNoPhone,
        mockAppointment,
        new Date('2025-01-15T14:00:00Z'),
        new Date('2025-01-16T16:00:00Z'),
        1
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('no phone number');
      expect(MessageService.sendSms).not.toHaveBeenCalled();
    });

    it('should handle SMS send failure', async () => {
      (MessageService.sendSms as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const result = await DriverReconfirmationService.sendReconfirmationRequest(
        mockDriver,
        mockAppointment,
        new Date('2025-01-15T14:00:00Z'),
        new Date('2025-01-16T16:00:00Z'),
        1
      );

      expect(result.success).toBe(false);
      expect(result.smsSent).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('updateTasksToReconfirmationPending', () => {
    it('should update task status for driver', async () => {
      (prisma.onfleetTask.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      await DriverReconfirmationService.updateTasksToReconfirmationPending(100, 1, 1);

      expect(prisma.onfleetTask.updateMany).toHaveBeenCalledWith({
        where: {
          appointmentId: 100,
          driverId: 1,
          unitNumber: 1,
        },
        data: {
          driverNotificationStatus: 'pending_reconfirmation',
          lastNotifiedDriverId: 1,
          driverNotificationSentAt: expect.any(Date),
        },
      });
    });
  });

  describe('processReconfirmationsForAppointment', () => {
    it('should send reconfirmation to all unique drivers', async () => {
      (MessageService.sendSms as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'mock-message-id',
      });
      (prisma.onfleetTask.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const appointment = {
        id: 100,
        appointmentType: 'Storage Unit Access',
        address: '123 Test St',
        date: new Date('2025-01-15T14:00:00Z'),
        time: new Date('2025-01-15T14:00:00Z'),
        description: 'Test appointment',
        onfleetTasks: [
          {
            id: 1,
            unitNumber: 1,
            driverId: 1,
            driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' },
          },
          {
            id: 2,
            unitNumber: 1,
            driverId: 1,
            driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' },
          },
          {
            id: 3,
            unitNumber: 2,
            driverId: 2,
            driver: { id: 2, firstName: 'Jane', lastName: 'Smith', phoneNumber: '+15552222222' },
          },
        ],
      };

      const results = await DriverReconfirmationService.processReconfirmationsForAppointment(
        appointment,
        new Date('2025-01-15T14:00:00Z'),
        new Date('2025-01-16T16:00:00Z')
      );

      // Should only send 2 SMS (one per unique driver-unit pair)
      expect(results).toHaveLength(2);
      expect(MessageService.sendSms).toHaveBeenCalledTimes(2);
    });

    it('should skip tasks without drivers', async () => {
      const appointment = {
        id: 100,
        appointmentType: 'Storage Unit Access',
        address: '123 Test St',
        date: new Date('2025-01-15T14:00:00Z'),
        time: new Date('2025-01-15T14:00:00Z'),
        description: 'Test appointment',
        onfleetTasks: [
          { id: 1, unitNumber: 1, driverId: null, driver: null },
          { id: 2, unitNumber: 2, driverId: null, driver: null },
        ],
      };

      const results = await DriverReconfirmationService.processReconfirmationsForAppointment(
        appointment,
        new Date('2025-01-15T14:00:00Z'),
        new Date('2025-01-16T16:00:00Z')
      );

      expect(results).toHaveLength(0);
      expect(MessageService.sendSms).not.toHaveBeenCalled();
    });
  });

  describe('hasAssignedDrivers', () => {
    it('should return true when tasks have drivers', async () => {
      (prisma.onfleetTask.count as jest.Mock).mockResolvedValue(3);

      const result = await DriverReconfirmationService.hasAssignedDrivers(100);

      expect(result).toBe(true);
      expect(prisma.onfleetTask.count).toHaveBeenCalledWith({
        where: {
          appointmentId: 100,
          driverId: { not: null },
        },
      });
    });

    it('should return false when no tasks have drivers', async () => {
      (prisma.onfleetTask.count as jest.Mock).mockResolvedValue(0);

      const result = await DriverReconfirmationService.hasAssignedDrivers(100);

      expect(result).toBe(false);
    });
  });
});

