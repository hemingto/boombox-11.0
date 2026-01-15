/**
 * @fileoverview Unit tests for DriverReassignmentService
 * @testing Smart driver reassignment logic for plan changes and unit count modifications
 */

import { 
  DriverReassignmentService,
  type TaskWithDriver,
  type ReassignmentPlan 
} from '@/lib/services/DriverReassignmentService';

// Mock prisma
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    movingPartnerDriver: {
      findFirst: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
    },
    onfleetTask: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/database/prismaClient';

describe('DriverReassignmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID = 'boombox-team-123';
  });

  afterEach(() => {
    delete process.env.BOOMBOX_DELIVERY_NETWORK_TEAM_ID;
  });

  describe('analyzeDriverRequirements', () => {
    const appointmentTime = new Date('2025-01-10T09:00:00Z');

    describe('DIY to Full Service upgrade', () => {
      it('should shift Boombox driver from Unit 1 to Unit 2 when upgrading', async () => {
        // Boombox driver Tim Cook on Unit 1
        const existingTasks: TaskWithDriver[] = [
          {
            id: 1,
            taskId: 'task-1',
            unitNumber: 1,
            stepNumber: 1,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
          {
            id: 2,
            taskId: 'task-2',
            unitNumber: 1,
            stepNumber: 2,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
          {
            id: 3,
            taskId: 'task-3',
            unitNumber: 1,
            stepNumber: 3,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
        ];

        // Tim Cook is a Boombox driver, not a Moving Partner driver
        (prisma.movingPartnerDriver.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
          id: 16,
          onfleetTeamIds: ['boombox-team-123'],
        });

        const plan = await DriverReassignmentService.analyzeDriverRequirements(
          existingTasks,
          'Do It Yourself Plan',
          'Full Service Plan',
          1, // old unit count
          2, // new unit count
          appointmentTime,
          10 // moving partner ID for Full Service
        );

        // Tim Cook should be shifted from Unit 1 to Unit 2
        expect(plan.driversToKeep).toHaveLength(1);
        expect(plan.driversToKeep[0]).toMatchObject({
          driverId: 16,
          currentUnit: 1,
          newUnit: 2,
        });

        // Unit 1 now needs a Moving Partner driver
        expect(plan.unitsNeedingNewDriver).toHaveLength(1);
        expect(plan.unitsNeedingNewDriver[0]).toMatchObject({
          unitNumber: 1,
          driverType: 'moving_partner',
        });

        // No drivers should be removed
        expect(plan.driversToRemove).toHaveLength(0);
      });

      it('should remove Boombox driver when no unit available to shift to', async () => {
        // Boombox driver on Unit 1, only 1 unit total (no Unit 2 to shift to)
        const existingTasks: TaskWithDriver[] = [
          {
            id: 1,
            taskId: 'task-1',
            unitNumber: 1,
            stepNumber: 1,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
        ];

        (prisma.movingPartnerDriver.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
          id: 16,
          onfleetTeamIds: ['boombox-team-123'],
        });

        const plan = await DriverReassignmentService.analyzeDriverRequirements(
          existingTasks,
          'Do It Yourself Plan',
          'Full Service Plan',
          1, // old unit count
          1, // new unit count - same, no Unit 2 available
          appointmentTime,
          10
        );

        // Tim Cook should be removed (no Unit 2 to shift to)
        expect(plan.driversToRemove).toHaveLength(1);
        expect(plan.driversToRemove[0]).toMatchObject({
          driverId: 16,
          reason: expect.stringContaining('No available unit'),
        });

        // Unit 1 needs a Moving Partner driver
        expect(plan.unitsNeedingNewDriver).toHaveLength(1);
        expect(plan.unitsNeedingNewDriver[0]).toMatchObject({
          unitNumber: 1,
          driverType: 'moving_partner',
        });

        expect(plan.driversToKeep).toHaveLength(0);
      });
    });

    describe('Full Service to DIY downgrade', () => {
      it('should remove Moving Partner drivers and need new Boombox drivers', async () => {
        // Moving Partner driver John Jacob on Unit 1
        const existingTasks: TaskWithDriver[] = [
          {
            id: 1,
            taskId: 'task-1',
            unitNumber: 1,
            stepNumber: 1,
            driverId: 17,
            driver: {
              id: 17,
              firstName: 'John',
              lastName: 'Jacob',
              phoneNumber: '+15559876543',
              onfleetWorkerId: 'worker-17',
            },
          },
        ];

        // John Jacob is a Moving Partner driver
        (prisma.movingPartnerDriver.findFirst as jest.Mock).mockResolvedValue({
          id: 5,
          driverId: 17,
          movingPartnerId: 10,
          isActive: true,
        });
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
          id: 17,
          onfleetTeamIds: [], // Not a Boombox driver
        });

        const plan = await DriverReassignmentService.analyzeDriverRequirements(
          existingTasks,
          'Full Service Plan',
          'Do It Yourself Plan',
          1,
          1,
          appointmentTime,
          undefined // No moving partner for DIY
        );

        // John Jacob should be removed (MP driver can't do DIY)
        expect(plan.driversToRemove).toHaveLength(1);
        expect(plan.driversToRemove[0]).toMatchObject({
          driverId: 17,
          reason: expect.stringContaining('Driver type mismatch'),
        });

        // Unit 1 needs a Boombox driver
        expect(plan.unitsNeedingNewDriver).toHaveLength(1);
        expect(plan.unitsNeedingNewDriver[0]).toMatchObject({
          unitNumber: 1,
          driverType: 'boombox',
        });

        expect(plan.driversToKeep).toHaveLength(0);
      });
    });

    describe('Unit count changes', () => {
      it('should handle unit count reduction (driver removed)', async () => {
        // Two Boombox drivers: Tim on Unit 1, Jane on Unit 2
        const existingTasks: TaskWithDriver[] = [
          {
            id: 1,
            taskId: 'task-1',
            unitNumber: 1,
            stepNumber: 1,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
          {
            id: 4,
            taskId: 'task-4',
            unitNumber: 2,
            stepNumber: 1,
            driverId: 18,
            driver: {
              id: 18,
              firstName: 'Jane',
              lastName: 'Doe',
              phoneNumber: '+15559999999',
              onfleetWorkerId: 'worker-18',
            },
          },
        ];

        (prisma.movingPartnerDriver.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
          id: 16,
          onfleetTeamIds: ['boombox-team-123'],
        });

        const plan = await DriverReassignmentService.analyzeDriverRequirements(
          existingTasks,
          'Do It Yourself Plan',
          'Do It Yourself Plan', // Same plan
          2, // old unit count
          1, // new unit count - reduced
          appointmentTime,
          undefined
        );

        // Tim on Unit 1 should stay
        expect(plan.driversToKeep).toHaveLength(1);
        expect(plan.driversToKeep[0]).toMatchObject({
          driverId: 16,
          currentUnit: 1,
          newUnit: 1,
        });

        // Jane on Unit 2 should be removed (unit no longer exists)
        expect(plan.driversToRemove).toHaveLength(1);
        expect(plan.driversToRemove[0]).toMatchObject({
          driverId: 18,
          reason: expect.stringContaining('Unit 2 no longer exists'),
        });

        expect(plan.unitsNeedingNewDriver).toHaveLength(0);
      });

      it('should request new drivers for added units', async () => {
        // One Boombox driver Tim on Unit 1
        const existingTasks: TaskWithDriver[] = [
          {
            id: 1,
            taskId: 'task-1',
            unitNumber: 1,
            stepNumber: 1,
            driverId: 16,
            driver: {
              id: 16,
              firstName: 'Tim',
              lastName: 'Cook',
              phoneNumber: '+15551234567',
              onfleetWorkerId: 'worker-16',
            },
          },
        ];

        (prisma.movingPartnerDriver.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.driver.findUnique as jest.Mock).mockResolvedValue({
          id: 16,
          onfleetTeamIds: ['boombox-team-123'],
        });

        const plan = await DriverReassignmentService.analyzeDriverRequirements(
          existingTasks,
          'Do It Yourself Plan',
          'Do It Yourself Plan', // Same plan
          1, // old unit count
          2, // new unit count - increased
          appointmentTime,
          undefined
        );

        // Tim stays on Unit 1
        expect(plan.driversToKeep).toHaveLength(1);
        expect(plan.driversToKeep[0]).toMatchObject({
          driverId: 16,
          currentUnit: 1,
          newUnit: 1,
        });

        // Unit 2 needs a new driver
        expect(plan.unitsNeedingNewDriver).toHaveLength(1);
        expect(plan.unitsNeedingNewDriver[0]).toMatchObject({
          unitNumber: 2,
          driverType: 'boombox',
        });

        expect(plan.driversToRemove).toHaveLength(0);
      });
    });
  });

  describe('getExistingAssignments', () => {
    it('should fetch and order tasks by unit and step number', async () => {
      const mockTasks = [
        { id: 1, taskId: 'task-1', unitNumber: 1, stepNumber: 1, driverId: 16, driver: { id: 16, firstName: 'Tim', lastName: 'Cook', phoneNumber: '+15551234567', onfleetWorkerId: 'worker-16' } },
        { id: 2, taskId: 'task-2', unitNumber: 1, stepNumber: 2, driverId: 16, driver: { id: 16, firstName: 'Tim', lastName: 'Cook', phoneNumber: '+15551234567', onfleetWorkerId: 'worker-16' } },
        { id: 3, taskId: 'task-3', unitNumber: 1, stepNumber: 3, driverId: 16, driver: { id: 16, firstName: 'Tim', lastName: 'Cook', phoneNumber: '+15551234567', onfleetWorkerId: 'worker-16' } },
      ];

      (prisma.onfleetTask.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const tasks = await DriverReassignmentService.getExistingAssignments(31);

      expect(prisma.onfleetTask.findMany).toHaveBeenCalledWith({
        where: { appointmentId: 31 },
        select: expect.objectContaining({
          id: true,
          taskId: true,
          unitNumber: true,
          stepNumber: true,
          driverId: true,
          driver: expect.any(Object),
        }),
        orderBy: [
          { unitNumber: 'asc' },
          { stepNumber: 'asc' },
        ],
      });

      expect(tasks).toHaveLength(3);
      expect(tasks[0].id).toBe(1);
    });
  });
});

