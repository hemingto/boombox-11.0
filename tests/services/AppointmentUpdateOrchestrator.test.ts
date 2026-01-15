/**
 * @fileoverview Unit tests for AppointmentUpdateOrchestrator
 * @testing Appointment update coordination including plan switches, time changes, and unit changes
 */

import { AppointmentUpdateOrchestrator, type AppointmentWithRelations } from '@/lib/services/AppointmentUpdateOrchestrator';
import { OnfleetTaskUpdateService } from '@/lib/services/onfleet/OnfleetTaskUpdateService';
import { NotificationOrchestrator } from '@/lib/services/NotificationOrchestrator';
import { TimeSlotBookingService } from '@/lib/services/TimeSlotBookingService';
import { DriverReassignmentService } from '@/lib/services/DriverReassignmentService';

// Mock all dependencies
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    onfleetTask: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    movingPartner: {
      findUnique: jest.fn(),
    },
    movingPartnerDriver: {
      findFirst: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
    driverAvailability: {
      findMany: jest.fn(),
    },
    driverTimeSlotBooking: {
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/services/onfleet/OnfleetTaskUpdateService');
jest.mock('@/lib/services/onfleet/OnfleetTaskCreationService');
jest.mock('@/lib/services/NotificationOrchestrator');
jest.mock('@/lib/services/TimeSlotBookingService');
jest.mock('@/lib/services/DriverReconfirmationService');
jest.mock('@/lib/services/DriverReassignmentService');
jest.mock('@/lib/services/appointmentOnfleetService', () => ({
  determineTeamAssignment: jest.fn().mockResolvedValue('team123'),
  buildTaskPayload: jest.fn().mockResolvedValue({ notes: 'test' }),
  getStorageUnitMapping: jest.fn().mockResolvedValue([]),
  fetchOriginalOnfleetTask: jest.fn().mockResolvedValue({ notes: 'original notes' }),
}));
jest.mock('@/lib/services/geocodingService', () => ({
  geocodeAddress: jest.fn().mockResolvedValue([-122.4, 37.7]),
}));

import { prisma } from '@/lib/database/prismaClient';

describe('AppointmentUpdateOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID = 'boombox-team-123';
  });

  afterEach(() => {
    delete process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
  });

  const createMockAppointment = (overrides = {}) => ({
    id: 100,
    planType: 'Do It Yourself Plan',
    date: new Date('2025-01-15T14:00:00Z'),
    time: new Date('2025-01-15T14:00:00Z'),
    address: '123 Test St',
    zipcode: '94080',
    numberOfUnits: 1,
    userId: 1,
    movingPartnerId: null,
    thirdPartyMovingPartnerId: null,
    description: 'Test appointment',
    loadingHelpPrice: 0,
    appointmentType: 'Storage Unit Access',
    onfleetTasks: [
      {
        id: 1,
        taskId: 'task-1',
        shortId: 'short-1',
        stepNumber: 1,
        unitNumber: 1,
        driverId: 1,
        driverNotificationStatus: 'confirmed',
        driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' },
      },
      {
        id: 2,
        taskId: 'task-2',
        shortId: 'short-2',
        stepNumber: 2,
        unitNumber: 1,
        driverId: 1,
        driverNotificationStatus: 'confirmed',
        driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' },
      },
      {
        id: 3,
        taskId: 'task-3',
        shortId: 'short-3',
        stepNumber: 3,
        unitNumber: 1,
        driverId: 1,
        driverNotificationStatus: 'confirmed',
        driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' },
      },
    ],
    movingPartner: null,
    user: { id: 1, firstName: 'Test', lastName: 'User', phoneNumber: '+15559999999' },
    requestedStorageUnits: [
      { storageUnitId: 10, storageUnit: { id: 10, storageUnitNumber: 'A-101' } },
    ],
    ...overrides,
  });

  describe('processAppointmentUpdate', () => {
    it('should return error when appointment not found', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await AppointmentUpdateOrchestrator.processAppointmentUpdate(
        999,
        { appointmentId: 999 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });
  });

  describe('handleStorageUnitReduction', () => {
    it('should notify drivers and delete tasks for removed units', async () => {
      const mockAppointment = createMockAppointment({
        requestedStorageUnits: [
          { storageUnitId: 10, storageUnit: { id: 10, storageUnitNumber: 'A-101' } },
          { storageUnitId: 11, storageUnit: { id: 11, storageUnitNumber: 'A-102' } },
        ],
        onfleetTasks: [
          { id: 1, taskId: 'task-1', shortId: 'short-1', stepNumber: 1, unitNumber: 1, driverId: 1, driver: { id: 1, firstName: 'John', lastName: 'Doe', phoneNumber: '+15551111111' }, driverNotificationStatus: null },
          { id: 4, taskId: 'task-4', shortId: 'short-4', stepNumber: 1, unitNumber: 2, driverId: 2, driver: { id: 2, firstName: 'Jane', lastName: 'Smith', phoneNumber: '+15552222222' }, driverNotificationStatus: null },
        ],
      });

      (prisma.onfleetTask.findMany as jest.Mock).mockResolvedValue([
        { taskId: 'task-1', shortId: 'short-1', unitNumber: 1 },
      ]);
      (prisma.onfleetTask.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (OnfleetTaskUpdateService.batchDeleteTasks as jest.Mock).mockResolvedValue([{ success: true }]);
      (NotificationOrchestrator.collectUniqueDrivers as jest.Mock).mockReturnValue([{ id: 2, firstName: 'Jane', lastName: 'Smith', phoneNumber: '+15552222222' }]);
      (NotificationOrchestrator.notifyDriverTaskCancellation as jest.Mock).mockResolvedValue(undefined);
      (prisma.movingPartner.findUnique as jest.Mock).mockResolvedValue(null);
      (OnfleetTaskUpdateService.updateTask as jest.Mock).mockResolvedValue({ success: true });

      await AppointmentUpdateOrchestrator.handleStorageUnitReduction(
        mockAppointment as unknown as AppointmentWithRelations,
        [11] // Remove unit 11 (index 1 = unitNumber 2)
      );

      expect(NotificationOrchestrator.notifyDriverTaskCancellation).toHaveBeenCalled();
      expect(OnfleetTaskUpdateService.batchDeleteTasks).toHaveBeenCalled();
      expect(prisma.onfleetTask.deleteMany).toHaveBeenCalled();
    });
  });

  describe('handlePlanSwitch', () => {
    it('should use smart reassignment when switching from DIY to Full Service', async () => {
      const mockAppointment = createMockAppointment();

      // Mock the DriverReassignmentService
      const mockPlan = {
        driversToKeep: [],
        driversToRemove: [{ driverId: 1, driverName: 'John Doe', driverPhone: '+15551111111', reason: 'No available unit' }],
        unitsNeedingNewDriver: [{ unitNumber: 1, driverType: 'moving_partner' }],
      };
      (DriverReassignmentService.getExistingAssignments as jest.Mock).mockResolvedValue([]);
      (DriverReassignmentService.analyzeDriverRequirements as jest.Mock).mockResolvedValue(mockPlan);
      
      (NotificationOrchestrator.notifyDriverReassignment as jest.Mock).mockResolvedValue(undefined);
      (OnfleetTaskUpdateService.updateTask as jest.Mock).mockResolvedValue({ success: true });
      (prisma.onfleetTask.findMany as jest.Mock).mockResolvedValue([
        { id: 1, taskId: 'task-1', shortId: 'short-1' }
      ]);
      (prisma.onfleetTask.update as jest.Mock).mockResolvedValue({});
      (TimeSlotBookingService.deleteDriverBookingForDriver as jest.Mock).mockResolvedValue({ success: true });

      await AppointmentUpdateOrchestrator.handlePlanSwitch('diy_to_full_service', mockAppointment as unknown as AppointmentWithRelations);

      // Should analyze driver requirements using smart reassignment
      expect(DriverReassignmentService.getExistingAssignments).toHaveBeenCalledWith(100);
      expect(DriverReassignmentService.analyzeDriverRequirements).toHaveBeenCalled();
      
      // Should notify drivers being removed (from the reassignment plan)
      expect(NotificationOrchestrator.notifyDriverReassignment).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'John' }),
        expect.any(Object),
        'No available unit'
      );
      
      // Should clean up driver time slot booking
      expect(TimeSlotBookingService.deleteDriverBookingForDriver).toHaveBeenCalledWith(1, 100);
    });

    it('should notify moving partner and use smart reassignment when switching to DIY', async () => {
      const mockAppointment = createMockAppointment({
        planType: 'Full Service Plan',
        movingPartnerId: 5,
        movingPartner: { id: 5, name: 'Test Movers', phoneNumber: '+15553333333', email: 'test@movers.com' },
      });

      // Mock the DriverReassignmentService
      const mockPlan = {
        driversToKeep: [],
        driversToRemove: [],
        unitsNeedingNewDriver: [{ unitNumber: 1, driverType: 'boombox' }],
      };
      (DriverReassignmentService.getExistingAssignments as jest.Mock).mockResolvedValue([]);
      (DriverReassignmentService.analyzeDriverRequirements as jest.Mock).mockResolvedValue(mockPlan);

      (NotificationOrchestrator.notifyMovingPartnerPlanChangeToDIY as jest.Mock).mockResolvedValue(undefined);
      (OnfleetTaskUpdateService.updateTask as jest.Mock).mockResolvedValue({ success: true });
      (prisma.onfleetTask.updateMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.onfleetTask.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (prisma.onfleetTask.update as jest.Mock).mockResolvedValue({});
      (TimeSlotBookingService.deleteBooking as jest.Mock).mockResolvedValue({ success: true });

      await AppointmentUpdateOrchestrator.handlePlanSwitch('full_service_to_diy', mockAppointment as unknown as AppointmentWithRelations);

      expect(NotificationOrchestrator.notifyMovingPartnerPlanChangeToDIY).toHaveBeenCalledWith(
        expect.objectContaining({ id: 5 }),
        expect.any(Object)
      );
      expect(TimeSlotBookingService.deleteBooking).toHaveBeenCalledWith(100);
      
      // Should have analyzed driver requirements
      expect(DriverReassignmentService.analyzeDriverRequirements).toHaveBeenCalled();
    });
  });
});

