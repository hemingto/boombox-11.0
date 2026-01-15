/**
 * @fileoverview Unit tests for NotificationOrchestrator
 * @testing Driver/mover notifications with de-duplication
 */

import { NotificationOrchestrator } from '@/lib/services/NotificationOrchestrator';
import { MessageService } from '@/lib/messaging/MessageService';

// Mock MessageService
jest.mock('@/lib/messaging/MessageService');
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({ sid: 'mock-sid' }),
    },
  }));
});

describe('NotificationOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
  });

  describe('collectUniqueDrivers', () => {
    it('should de-duplicate drivers from multiple tasks', () => {
      const tasks = [
        {
          driverId: 1,
          driver: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+15551111111',
          },
        },
        {
          driverId: 1,
          driver: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+15551111111',
          },
        },
        {
          driverId: 2,
          driver: {
            id: 2,
            firstName: 'Jane',
            lastName: 'Smith',
            phoneNumber: '+15552222222',
          },
        },
      ];

      const result = NotificationOrchestrator.collectUniqueDrivers(tasks);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should handle tasks without drivers', () => {
      const tasks = [
        { driverId: null, driver: null },
        {
          driverId: 1,
          driver: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+15551111111',
          },
        },
      ];

      const result = NotificationOrchestrator.collectUniqueDrivers(tasks);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle empty task list', () => {
      const result = NotificationOrchestrator.collectUniqueDrivers([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('notifyDriverOfTimeChange', () => {
    it('should send SMS notification to driver', async () => {
      const driver = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+15551111111',
      };

      const oldTime = new Date('2025-01-15T10:00:00Z');
      const newTime = new Date('2025-01-15T14:00:00Z');

      const appointment = {
        id: 123,
        appointmentType: 'Storage Unit Access',
        date: newTime,
        time: newTime,
        address: '123 Main St',
        description: 'Test appointment',
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const mockSendSms = jest.spyOn(MessageService, 'sendSms').mockResolvedValue(true);

      const result = await NotificationOrchestrator.notifyDriverOfTimeChange(
        driver,
        oldTime,
        newTime,
        appointment
      );

      expect(result).toBe(true);
      expect(mockSendSms).toHaveBeenCalledWith(
        driver.phoneNumber,
        expect.any(Object), // Template
        expect.objectContaining({
          appointmentId: '123',
          customerName: 'Customer Name',
          address: '123 Main St',
        })
      );
    });

    it('should skip notification when driver has no phone number', async () => {
      const driver = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
      };

      const oldTime = new Date('2025-01-15T10:00:00Z');
      const newTime = new Date('2025-01-15T14:00:00Z');

      const appointment = {
        id: 123,
        appointmentType: 'Storage Unit Access',
        date: newTime,
        time: newTime,
        address: '123 Main St',
        description: null,
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const mockSendSms = jest.spyOn(MessageService, 'sendSms');

      const result = await NotificationOrchestrator.notifyDriverOfTimeChange(
        driver,
        oldTime,
        newTime,
        appointment
      );

      expect(result).toBe(false);
      expect(mockSendSms).not.toHaveBeenCalled();
    });
  });

  describe('notifyMovingPartnerOfTimeChange', () => {
    it('should send both SMS and email notifications', async () => {
      const mover = {
        id: 10,
        name: 'Moving Company',
        phoneNumber: '+15553333333',
        email: 'mover@example.com',
      };

      const oldTime = new Date('2025-01-15T10:00:00Z');
      const newTime = new Date('2025-01-15T14:00:00Z');

      const appointment = {
        id: 123,
        appointmentType: 'Initial Pickup',
        date: newTime,
        time: newTime,
        address: '123 Main St',
        description: 'Test',
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const mockSendSms = jest.spyOn(MessageService, 'sendSms').mockResolvedValue(true);
      const mockSendEmail = jest.spyOn(MessageService, 'sendEmail').mockResolvedValue(true);

      const result = await NotificationOrchestrator.notifyMovingPartnerOfTimeChange(
        mover,
        oldTime,
        newTime,
        appointment
      );

      expect(result.sms).toBe(true);
      expect(result.email).toBe(true);
      expect(mockSendSms).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should handle missing contact info gracefully', async () => {
      const mover = {
        id: 10,
        name: 'Moving Company',
        phoneNumber: null,
        email: null,
      };

      const oldTime = new Date('2025-01-15T10:00:00Z');
      const newTime = new Date('2025-01-15T14:00:00Z');

      const appointment = {
        id: 123,
        appointmentType: 'Initial Pickup',
        date: newTime,
        time: newTime,
        address: '123 Main St',
        description: null,
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const result = await NotificationOrchestrator.notifyMovingPartnerOfTimeChange(
        mover,
        oldTime,
        newTime,
        appointment
      );

      expect(result.sms).toBe(false);
      expect(result.email).toBe(false);
    });
  });

  describe('notifyDriverTaskCancellation', () => {
    it('should notify driver of task cancellation', async () => {
      const driver = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+15551111111',
      };

      const appointment = {
        id: 123,
        appointmentType: 'Storage Unit Access',
        date: new Date('2025-01-15T10:00:00Z'),
        time: new Date('2025-01-15T10:00:00Z'),
        address: '123 Main St',
        description: 'Test',
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const mockSendSms = jest.spyOn(MessageService, 'sendSms').mockResolvedValue(true);

      const result = await NotificationOrchestrator.notifyDriverTaskCancellation(
        driver,
        appointment,
        'Storage unit count reduced'
      );

      expect(result).toBe(true);
      expect(mockSendSms).toHaveBeenCalledWith(
        driver.phoneNumber,
        expect.any(Object),
        expect.objectContaining({
          reason: 'Storage unit count reduced',
        })
      );
    });
  });

  describe('handleAppointmentChangeNotifications', () => {
    it('should handle time change notifications', async () => {
      const existingAppointment = {
        id: 123,
        time: new Date('2025-01-15T10:00:00Z'),
        planType: 'Do It Yourself Plan',
        movingPartner: null,
        onfleetTasks: [
          {
            driverId: 1,
            driver: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              phoneNumber: '+15551111111',
            },
          },
        ],
      };

      const updatedAppointment = {
        id: 123,
        appointmentType: 'Storage Unit Access',
        time: new Date('2025-01-15T14:00:00Z'),
        date: new Date('2025-01-15T14:00:00Z'),
        address: '123 Main St',
        description: 'Test',
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const changes = {
        timeChanged: true,
        planChanged: false,
        unitsAdded: [],
        unitsRemoved: [],
        movingPartnerChanged: false,
        driverReassignmentRequired: false,
      };

      const mockSendSms = jest.spyOn(MessageService, 'sendSms').mockResolvedValue(true);

      const result = await NotificationOrchestrator.handleAppointmentChangeNotifications(
        existingAppointment,
        updatedAppointment,
        changes
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('driver_time_change_1');
      expect(mockSendSms).toHaveBeenCalled();
    });

    it('should handle plan change from Full Service to DIY', async () => {
      const existingAppointment = {
        id: 123,
        time: new Date('2025-01-15T10:00:00Z'),
        planType: 'Full Service Plan',
        movingPartner: {
          id: 10,
          name: 'Moving Company',
          phoneNumber: '+15553333333',
          email: 'mover@example.com',
        },
        onfleetTasks: [],
      };

      const updatedAppointment = {
        id: 123,
        appointmentType: 'Initial Pickup',
        time: new Date('2025-01-15T10:00:00Z'),
        date: new Date('2025-01-15T10:00:00Z'),
        address: '123 Main St',
        description: 'Test',
        planType: 'Do It Yourself Plan',
        user: {
          firstName: 'Customer',
          lastName: 'Name',
          phoneNumber: '+15559999999',
        },
      };

      const changes = {
        timeChanged: false,
        planChanged: true,
        unitsAdded: [],
        unitsRemoved: [],
        movingPartnerChanged: false,
        driverReassignmentRequired: false,
      };

      const mockSendEmail = jest.spyOn(MessageService, 'sendEmail').mockResolvedValue(true);

      const result = await NotificationOrchestrator.handleAppointmentChangeNotifications(
        existingAppointment,
        updatedAppointment,
        changes
      );

      expect(result).toContain('mover_plan_change_email');
      expect(mockSendEmail).toHaveBeenCalled();
    });
  });
});

