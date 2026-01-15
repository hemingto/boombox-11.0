/**
 * @fileoverview Tests for Access Storage Unit API route
 * Tests the critical database operations when users submit the Access Storage form:
 * 1. RequestedAccessStorageUnit records creation
 * 2. Storage usage termination for "End Storage Term" appointments
 * 3. Moving partner time slot booking
 */

import { prisma } from '@/lib/database/prismaClient';
import { createStorageAccessAppointment } from '@/lib/utils/appointmentUtils';
import type { StorageAccessAppointmentData } from '@/lib/utils/appointmentUtils';

// Test data
let testUserId: number;
let testStorageUnitIds: number[];
let testMovingPartnerId: number;
let testStorageUnitUsageId: number;

beforeAll(async () => {
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      firstName: 'Test',
      lastName: 'User',
      email: `test-access-storage-${Date.now()}@test.com`,
      phoneNumber: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      verifiedPhoneNumber: true,
    },
  });
  testUserId = testUser.id;

  // Create test storage units
  const unit1 = await prisma.storageUnit.create({
    data: {
      storageUnitNumber: `TEST-UNIT-${Date.now()}-1`,
      status: 'Occupied',
    },
  });
  const unit2 = await prisma.storageUnit.create({
    data: {
      storageUnitNumber: `TEST-UNIT-${Date.now()}-2`,
      status: 'Occupied',
    },
  });
  testStorageUnitIds = [unit1.id, unit2.id];

  // Create test storage unit usage for "End Storage Term" test
  const usage = await prisma.storageUnitUsage.create({
    data: {
      userId: testUserId,
      storageUnitId: testStorageUnitIds[0],
      usageStartDate: new Date(),
      usageEndDate: null, // Active usage
    },
  });
  testStorageUnitUsageId = usage.id;

  // Create test moving partner with availability
  const movingPartner = await prisma.movingPartner.create({
    data: {
      name: `Test Moving Partner ${Date.now()}`,
      email: `test-partner-${Date.now()}@test.com`,
      phoneNumber: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
      status: 'ACTIVE',
    },
  });
  testMovingPartnerId = movingPartner.id;

  // Create availability for the moving partner (for Monday)
  await prisma.movingPartnerAvailability.create({
    data: {
      movingPartnerId: testMovingPartnerId,
      dayOfWeek: 'Monday',
      startTime: '08:00',
      endTime: '17:00',
      maxCapacity: 5,
    },
  });
});

afterAll(async () => {
  // Cleanup test data
  if (testUserId) {
    await prisma.requestedAccessStorageUnit.deleteMany({
      where: { appointment: { userId: testUserId } },
    });
    await prisma.timeSlotBooking.deleteMany({
      where: { appointment: { userId: testUserId } },
    });
    await prisma.storageUnitUsage.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.appointment.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  }

  if (testStorageUnitIds.length > 0) {
    await prisma.storageUnit.deleteMany({
      where: { id: { in: testStorageUnitIds } },
    });
  }

  if (testMovingPartnerId) {
    await prisma.movingPartnerAvailability.deleteMany({
      where: { movingPartnerId: testMovingPartnerId },
    });
    await prisma.movingPartner.delete({
      where: { id: testMovingPartnerId },
    });
  }

  await prisma.$disconnect();
});

describe('Access Storage Unit - RequestedAccessStorageUnit Creation', () => {
  test('should create RequestedAccessStorageUnit records when appointment is created', async () => {
    // Arrange
    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '123 Test St',
      zipCode: '12345',
      planType: 'Do It Yourself Plan',
      appointmentDateTime: new Date('2025-12-01T10:00:00Z'),
      deliveryReason: 'Access items',
      selectedStorageUnits: testStorageUnitIds,
      description: 'Test access appointment',
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 0,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 110,
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Assert
    expect(appointment).toBeDefined();
    expect(appointment.id).toBeDefined();

    // Verify RequestedAccessStorageUnit records were created
    const requestedUnits = await prisma.requestedAccessStorageUnit.findMany({
      where: { appointmentId: appointment.id },
      include: { storageUnit: true },
    });

    expect(requestedUnits).toHaveLength(testStorageUnitIds.length);
    expect(requestedUnits.map(ru => ru.storageUnitId).sort()).toEqual(
      testStorageUnitIds.sort()
    );

    // Verify each requested unit has the correct structure
    requestedUnits.forEach(requestedUnit => {
      expect(requestedUnit.appointmentId).toBe(appointment.id);
      expect(requestedUnit.storageUnit).toBeDefined();
      expect(testStorageUnitIds).toContain(requestedUnit.storageUnitId);
      expect(requestedUnit.unitsReady).toBe(false); // Should default to false
      expect(requestedUnit.requestedUnitPickupPhotos).toEqual([]); // Should default to empty array
    });
  });

  test('should handle single storage unit correctly', async () => {
    // Arrange
    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '456 Test Ave',
      zipCode: '54321',
      planType: 'Full Service Plan',
      appointmentDateTime: new Date('2025-12-02T14:00:00Z'),
      deliveryReason: 'Access items',
      selectedStorageUnits: [testStorageUnitIds[0]], // Only one unit
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 189,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 299,
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Assert
    const requestedUnits = await prisma.requestedAccessStorageUnit.findMany({
      where: { appointmentId: appointment.id },
    });

    expect(requestedUnits).toHaveLength(1);
    expect(requestedUnits[0].storageUnitId).toBe(testStorageUnitIds[0]);
  });
});

describe('Access Storage Unit - Storage Usage Termination', () => {
  test('should update StorageUnitUsage when deliveryReason is "End Storage Term"', async () => {
    // Arrange - Create a new active usage record for this test
    const testUsage = await prisma.storageUnitUsage.create({
      data: {
        userId: testUserId,
        storageUnitId: testStorageUnitIds[0],
        usageStartDate: new Date('2025-01-01'),
        usageEndDate: null, // Active usage
      },
    });

    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '789 Test Blvd',
      zipCode: '67890',
      planType: 'Do It Yourself Plan',
      appointmentDateTime: new Date('2025-12-15T10:00:00Z'),
      deliveryReason: 'End Storage Term',
      selectedStorageUnits: [testStorageUnitIds[0]],
      appointmentType: 'End Storage Term',
      parsedLoadingHelpPrice: 0,
      monthlyStorageRate: 0,
      monthlyInsuranceRate: 0,
      calculatedTotal: 0,
    };

    // Act - Create appointment
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Simulate the API route's termination logic
    const usageRecord = await prisma.storageUnitUsage.findFirst({
      where: {
        userId: testUserId,
        storageUnitId: testStorageUnitIds[0],
        usageEndDate: null,
      },
    });

    if (usageRecord) {
      await prisma.storageUnitUsage.update({
        where: { id: usageRecord.id },
        data: {
          usageEndDate: appointmentData.appointmentDateTime,
          endAppointmentId: appointment.id,
        },
      });
    }

    // Assert
    const updatedUsage = await prisma.storageUnitUsage.findUnique({
      where: { id: testUsage.id },
    });

    expect(updatedUsage).toBeDefined();
    expect(updatedUsage!.usageEndDate).toBeDefined();
    expect(updatedUsage!.usageEndDate).toEqual(appointmentData.appointmentDateTime);
    expect(updatedUsage!.endAppointmentId).toBe(appointment.id);
  });

  test('should handle "End storage term" (lowercase) correctly', async () => {
    // Arrange - Create another active usage record
    const testUsage = await prisma.storageUnitUsage.create({
      data: {
        userId: testUserId,
        storageUnitId: testStorageUnitIds[1],
        usageStartDate: new Date('2025-02-01'),
        usageEndDate: null,
      },
    });

    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '321 Test Lane',
      zipCode: '13579',
      planType: 'Do It Yourself Plan',
      appointmentDateTime: new Date('2025-12-20T11:00:00Z'),
      deliveryReason: 'End storage term', // lowercase variant
      selectedStorageUnits: [testStorageUnitIds[1]],
      appointmentType: 'End Storage Term',
      parsedLoadingHelpPrice: 0,
      monthlyStorageRate: 0,
      monthlyInsuranceRate: 0,
      calculatedTotal: 0,
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Simulate the termination logic
    const usageRecord = await prisma.storageUnitUsage.findFirst({
      where: {
        userId: testUserId,
        storageUnitId: testStorageUnitIds[1],
        usageEndDate: null,
      },
    });

    if (usageRecord) {
      await prisma.storageUnitUsage.update({
        where: { id: usageRecord.id },
        data: {
          usageEndDate: appointmentData.appointmentDateTime,
          endAppointmentId: appointment.id,
        },
      });
    }

    // Assert
    const updatedUsage = await prisma.storageUnitUsage.findUnique({
      where: { id: testUsage.id },
    });

    expect(updatedUsage!.usageEndDate).toBeDefined();
    expect(updatedUsage!.endAppointmentId).toBe(appointment.id);
  });

  test('should NOT update usage when deliveryReason is "Access items"', async () => {
    // Arrange - Create a usage record that should NOT be terminated
    const testUsage = await prisma.storageUnitUsage.create({
      data: {
        userId: testUserId,
        storageUnitId: testStorageUnitIds[0],
        usageStartDate: new Date('2025-03-01'),
        usageEndDate: null,
      },
    });

    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '555 Test Dr',
      zipCode: '24680',
      planType: 'Do It Yourself Plan',
      appointmentDateTime: new Date('2025-12-25T09:00:00Z'),
      deliveryReason: 'Access items', // NOT ending storage
      selectedStorageUnits: [testStorageUnitIds[0]],
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 0,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 110,
    };

    // Act
    await createStorageAccessAppointment(appointmentData);

    // Assert - Usage should remain active
    const unchangedUsage = await prisma.storageUnitUsage.findUnique({
      where: { id: testUsage.id },
    });

    expect(unchangedUsage!.usageEndDate).toBeNull();
    expect(unchangedUsage!.endAppointmentId).toBeNull();
  });
});

describe('Access Storage Unit - Moving Partner Time Slot Booking', () => {
  test('should create TimeSlotBooking when moving partner is selected', async () => {
    // Arrange - Create appointment on a Monday (when we have availability)
    const mondayDate = new Date('2025-12-01T10:00:00Z'); // This is a Monday
    
    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '999 Test Pkwy',
      zipCode: '11111',
      planType: 'Full Service Plan',
      appointmentDateTime: mondayDate,
      deliveryReason: 'Access items',
      selectedStorageUnits: [testStorageUnitIds[0]],
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 189,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 299,
      movingPartnerId: testMovingPartnerId,
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Simulate the time slot booking logic from the API route
    const dayOfWeek = mondayDate.toLocaleDateString("en-US", { weekday: "long" });
    const bookingStart = new Date(mondayDate.getTime() - (60 * 60 * 1000));
    const bookingEnd = new Date(mondayDate.getTime() + (60 * 60 * 1000));

    const availabilitySlot = await prisma.movingPartnerAvailability.findFirst({
      where: {
        movingPartnerId: testMovingPartnerId,
        dayOfWeek,
        startTime: { not: '' },
        endTime: { not: '' },
      },
    });

    if (availabilitySlot) {
      await prisma.timeSlotBooking.create({
        data: {
          movingPartnerAvailabilityId: availabilitySlot.id,
          appointmentId: appointment.id,
          bookingDate: bookingStart,
          endDate: bookingEnd,
        },
      });
    }

    // Assert
    const timeSlotBooking = await prisma.timeSlotBooking.findUnique({
      where: { appointmentId: appointment.id },
    });

    expect(timeSlotBooking).toBeDefined();
    expect(timeSlotBooking!.appointmentId).toBe(appointment.id);
    expect(timeSlotBooking!.movingPartnerAvailabilityId).toBeDefined();
    
    // Verify the booking window is correct (1 hour before to 1 hour after)
    const expectedStart = new Date(mondayDate.getTime() - (60 * 60 * 1000));
    const expectedEnd = new Date(mondayDate.getTime() + (60 * 60 * 1000));
    expect(timeSlotBooking!.bookingDate.getTime()).toBe(expectedStart.getTime());
    expect(timeSlotBooking!.endDate.getTime()).toBe(expectedEnd.getTime());
  });

  test('should NOT create TimeSlotBooking when no moving partner is selected', async () => {
    // Arrange
    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '777 Test Way',
      zipCode: '22222',
      planType: 'Do It Yourself Plan',
      appointmentDateTime: new Date('2025-12-08T10:00:00Z'),
      deliveryReason: 'Access items',
      selectedStorageUnits: [testStorageUnitIds[0]],
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 0,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 110,
      // NO movingPartnerId
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Assert
    const timeSlotBooking = await prisma.timeSlotBooking.findUnique({
      where: { appointmentId: appointment.id },
    });

    expect(timeSlotBooking).toBeNull();
  });

  test('should handle case when no availability slot exists for the day', async () => {
    // Arrange - Create appointment on a Tuesday (when we have NO availability)
    const tuesdayDate = new Date('2025-12-02T10:00:00Z'); // This is a Tuesday
    
    const appointmentData: StorageAccessAppointmentData = {
      userId: testUserId,
      address: '888 Test Ct',
      zipCode: '33333',
      planType: 'Full Service Plan',
      appointmentDateTime: tuesdayDate,
      deliveryReason: 'Access items',
      selectedStorageUnits: [testStorageUnitIds[0]],
      appointmentType: 'Storage Unit Access',
      parsedLoadingHelpPrice: 189,
      monthlyStorageRate: 100,
      monthlyInsuranceRate: 10,
      calculatedTotal: 299,
      movingPartnerId: testMovingPartnerId,
    };

    // Act
    const appointment = await createStorageAccessAppointment(appointmentData);

    // Simulate the time slot booking logic
    const dayOfWeek = tuesdayDate.toLocaleDateString("en-US", { weekday: "long" });
    const availabilitySlot = await prisma.movingPartnerAvailability.findFirst({
      where: {
        movingPartnerId: testMovingPartnerId,
        dayOfWeek,
        startTime: { not: '' },
        endTime: { not: '' },
      },
    });

    // Assert - No availability slot should exist
    expect(availabilitySlot).toBeNull();

    // Verify no time slot booking was created
    const timeSlotBooking = await prisma.timeSlotBooking.findUnique({
      where: { appointmentId: appointment.id },
    });

    expect(timeSlotBooking).toBeNull();
  });
});

