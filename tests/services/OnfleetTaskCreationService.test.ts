/**
 * @fileoverview Unit tests for OnfleetTaskCreationService
 * @testing Creating Onfleet tasks for additional storage units during appointment edits
 */

import { OnfleetTaskCreationService } from '@/lib/services/onfleet/OnfleetTaskCreationService';
import * as appointmentOnfleetService from '@/lib/services/appointmentOnfleetService';

// Mock Prisma
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    appointment: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock appointmentOnfleetService
jest.mock('@/lib/services/appointmentOnfleetService', () => ({
  createOnfleetTasksWithDatabaseSave: jest.fn(),
}));

// Import the mocked prisma
import { prisma } from '@/lib/database/prismaClient';

describe('OnfleetTaskCreationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTasksForAdditionalUnits', () => {
    const mockAppointment = {
      id: 100,
      userId: 1,
      user: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+15551234567',
      },
      address: '123 Test St',
      zipcode: '94080',
      time: new Date('2025-01-15T14:00:00Z'),
      planType: 'Full Service Plan',
      deliveryReason: 'Access items',
      description: 'Test appointment',
      appointmentType: 'Storage Unit Access',
      loadingHelpPrice: 189,
      monthlyStorageRate: 99,
      monthlyInsuranceRate: 10,
      quotedPrice: 298,
      movingPartnerId: 5,
      thirdPartyMovingPartnerId: null,
      numberOfUnits: 2,
      movingPartner: { id: 5, onfleetTeamId: 'team123' },
      onfleetTasks: [
        { unitNumber: 1 },
        { unitNumber: 1 },
        { unitNumber: 1 },
        { unitNumber: 2 },
        { unitNumber: 2 },
        { unitNumber: 2 },
      ],
      requestedStorageUnits: [
        { storageUnitId: 10, storageUnit: { id: 10, storageUnitNumber: 'A-101' } },
        { storageUnitId: 11, storageUnit: { id: 11, storageUnitNumber: 'A-102' } },
      ],
    };

    it('should return success with 0 tasks when no new units', async () => {
      const result = await OnfleetTaskCreationService.createTasksForAdditionalUnits(
        100,
        [],
        { appointmentId: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.tasksCreated).toBe(0);
      expect(prisma.appointment.findUnique).not.toHaveBeenCalled();
    });

    it('should create tasks for new units with correct starting unit number', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (appointmentOnfleetService.createOnfleetTasksWithDatabaseSave as jest.Mock).mockResolvedValue({
        taskIds: ['task1', 'task2', 'task3'],
      });

      const result = await OnfleetTaskCreationService.createTasksForAdditionalUnits(
        100,
        [12], // new unit ID
        { appointmentId: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.tasksCreated).toBe(3); // 3 tasks per unit (pickup, customer, return)
      expect(appointmentOnfleetService.createOnfleetTasksWithDatabaseSave).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 100,
          startingUnitNumber: 3, // Highest existing unit is 2, so start at 3
          additionalUnitsOnly: true,
          storageUnitIds: [12],
        })
      );
    });

    it('should handle appointment not found', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await OnfleetTaskCreationService.createTasksForAdditionalUnits(
        999,
        [12],
        { appointmentId: 999 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('createTasksForUnitCountIncrease', () => {
    const mockAppointment = {
      id: 100,
      userId: 1,
      user: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+15551234567',
      },
      address: '123 Test St',
      zipcode: '94080',
      time: new Date('2025-01-15T14:00:00Z'),
      planType: 'Full Service Plan',
      description: 'Test appointment',
      appointmentType: 'Additional Storage',
      loadingHelpPrice: 189,
      monthlyStorageRate: 99,
      monthlyInsuranceRate: 10,
      quotedPrice: 298,
      movingPartnerId: 5,
      thirdPartyMovingPartnerId: null,
      numberOfUnits: 1,
      movingPartner: { id: 5, onfleetTeamId: 'team123' },
      onfleetTasks: [
        { unitNumber: 1 },
        { unitNumber: 1 },
        { unitNumber: 1 },
      ],
    };

    it('should return success when no additional units', async () => {
      const result = await OnfleetTaskCreationService.createTasksForUnitCountIncrease(
        100,
        0,
        { appointmentId: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.tasksCreated).toBe(0);
    });

    it('should create tasks for unit count increase', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (appointmentOnfleetService.createOnfleetTasksWithDatabaseSave as jest.Mock).mockResolvedValue({
        taskIds: ['task1', 'task2', 'task3', 'task4', 'task5', 'task6'],
      });

      const result = await OnfleetTaskCreationService.createTasksForUnitCountIncrease(
        100,
        2, // adding 2 units
        { appointmentId: 100 }
      );

      expect(result.success).toBe(true);
      expect(result.tasksCreated).toBe(6); // 3 tasks per unit * 2 units
      expect(appointmentOnfleetService.createOnfleetTasksWithDatabaseSave).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 100,
          startingUnitNumber: 2, // Existing highest unit is 1
          additionalUnitsOnly: true,
          storageUnitCount: 2,
        })
      );
    });
  });
});

