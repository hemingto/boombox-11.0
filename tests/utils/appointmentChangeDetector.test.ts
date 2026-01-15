/**
 * @fileoverview Unit tests for appointment change detection utilities
 * @testing detectTimeChange, detectPlanChange, detectStorageUnitChange, and more
 */

import {
  detectTimeChange,
  detectPlanChange,
  detectMovingPartnerChange,
  detectStorageUnitChange,
  detectAddressChange,
  getUnitNumbersToRemove,
  calculateDetailedAppointmentChanges,
} from '@/lib/utils/appointmentChangeDetector';

describe('Appointment Change Detector', () => {
  describe('detectTimeChange', () => {
    it('should detect time change', () => {
      const existingAppointment = {
        time: new Date('2025-01-15T10:00:00Z'),
      };
      const updateData = {
        appointmentDateTime: '2025-01-15T14:00:00Z',
      };

      const result = detectTimeChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.oldTime).toEqual(existingAppointment.time);
      expect(result!.newTime.getTime()).toBe(new Date(updateData.appointmentDateTime).getTime());
    });

    it('should return null when time unchanged', () => {
      const existingAppointment = {
        time: new Date('2025-01-15T10:00:00Z'),
      };
      const updateData = {
        appointmentDateTime: '2025-01-15T10:00:00Z',
      };

      const result = detectTimeChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });

    it('should return null when appointmentDateTime not provided', () => {
      const existingAppointment = {
        time: new Date('2025-01-15T10:00:00Z'),
      };
      const updateData = {};

      const result = detectTimeChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });
  });

  describe('detectPlanChange', () => {
    it('should detect DIY to Full Service change', () => {
      const existingAppointment = {
        planType: 'Do It Yourself Plan',
      };
      const updateData = {
        planType: 'Full Service Plan',
      };

      const result = detectPlanChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.oldPlan).toBe('Do It Yourself Plan');
      expect(result!.newPlan).toBe('Full Service Plan');
      expect(result!.switchType).toBe('diy_to_full_service');
    });

    it('should detect Full Service to DIY change', () => {
      const existingAppointment = {
        planType: 'Full Service Plan',
      };
      const updateData = {
        planType: 'Do It Yourself Plan',
      };

      const result = detectPlanChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.switchType).toBe('full_service_to_diy');
    });

    it('should return null when plan unchanged', () => {
      const existingAppointment = {
        planType: 'Do It Yourself Plan',
      };
      const updateData = {
        planType: 'Do It Yourself Plan',
      };

      const result = detectPlanChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });
  });

  describe('detectMovingPartnerChange', () => {
    it('should detect moving partner change', () => {
      const existingAppointment = {
        movingPartnerId: 1,
      };
      const updateData = {
        movingPartnerId: 2,
      };

      const result = detectMovingPartnerChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.oldMovingPartnerId).toBe(1);
      expect(result!.newMovingPartnerId).toBe(2);
    });

    it('should detect removing moving partner', () => {
      const existingAppointment = {
        movingPartnerId: 1,
      };
      const updateData = {
        movingPartnerId: null,
      };

      const result = detectMovingPartnerChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.newMovingPartnerId).toBeNull();
    });

    it('should return null when moving partner unchanged', () => {
      const existingAppointment = {
        movingPartnerId: 1,
      };
      const updateData = {};

      const result = detectMovingPartnerChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });
  });

  describe('detectStorageUnitChange', () => {
    it('should detect units added', () => {
      const existingAppointment = {
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
        ],
      };
      const updateData = {
        selectedStorageUnits: [1, 2, 3, 4],
      };

      const result = detectStorageUnitChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.unitsAdded).toEqual([3, 4]);
      expect(result!.unitsRemoved).toEqual([]);
      expect(result!.countIncreased).toBe(true);
      expect(result!.countDecreased).toBe(false);
    });

    it('should detect units removed', () => {
      const existingAppointment = {
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
          { storageUnitId: 3 },
        ],
      };
      const updateData = {
        selectedStorageUnits: [1],
      };

      const result = detectStorageUnitChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.unitsAdded).toEqual([]);
      expect(result!.unitsRemoved).toEqual([2, 3]);
      expect(result!.countIncreased).toBe(false);
      expect(result!.countDecreased).toBe(true);
    });

    it('should handle numberOfUnits count change', () => {
      const existingAppointment = {
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
        ],
      };
      const updateData = {
        numberOfUnits: 3,
      };

      const result = detectStorageUnitChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.countIncreased).toBe(true);
    });

    it('should return null when units unchanged', () => {
      const existingAppointment = {
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
        ],
      };
      const updateData = {
        selectedStorageUnits: [1, 2],
      };

      const result = detectStorageUnitChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });
  });

  describe('detectAddressChange', () => {
    it('should detect address change', () => {
      const existingAppointment = {
        address: '123 Main St',
        zipcode: '12345',
      };
      const updateData = {
        address: '456 Oak Ave',
        zipcode: '67890',
      };

      const result = detectAddressChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
      expect(result!.oldAddress).toBe('123 Main St');
      expect(result!.newAddress).toBe('456 Oak Ave');
      expect(result!.oldZipcode).toBe('12345');
      expect(result!.newZipcode).toBe('67890');
    });

    it('should detect zipcode change only', () => {
      const existingAppointment = {
        address: '123 Main St',
        zipcode: '12345',
      };
      const updateData = {
        zipcode: '67890',
      };

      const result = detectAddressChange(existingAppointment, updateData);

      expect(result).not.toBeNull();
      expect(result!.changed).toBe(true);
    });

    it('should return null when address unchanged', () => {
      const existingAppointment = {
        address: '123 Main St',
        zipcode: '12345',
      };
      const updateData = {};

      const result = detectAddressChange(existingAppointment, updateData);

      expect(result).toBeNull();
    });
  });

  describe('getUnitNumbersToRemove', () => {
    it('should calculate unit numbers to remove', () => {
      const existingUnitIds = [10, 20, 30, 40];
      const unitIdsToRemove = [20, 40];

      const result = getUnitNumbersToRemove(existingUnitIds, unitIdsToRemove);

      expect(result).toEqual([2, 4]); // 1-based unit numbers
    });

    it('should handle no removals', () => {
      const existingUnitIds = [10, 20, 30];
      const unitIdsToRemove: number[] = [];

      const result = getUnitNumbersToRemove(existingUnitIds, unitIdsToRemove);

      expect(result).toEqual([]);
    });

    it('should handle unit ID not found', () => {
      const existingUnitIds = [10, 20, 30];
      const unitIdsToRemove = [99]; // Not in existing

      const result = getUnitNumbersToRemove(existingUnitIds, unitIdsToRemove);

      expect(result).toEqual([]);
    });
  });

  describe('calculateDetailedAppointmentChanges', () => {
    it('should detect multiple changes', () => {
      const existingAppointment = {
        time: new Date('2025-01-15T10:00:00Z'),
        planType: 'Do It Yourself Plan',
        movingPartnerId: 1,
        address: '123 Main St',
        zipcode: '12345',
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
        ],
      };

      const updateData = {
        appointmentDateTime: '2025-01-15T14:00:00Z',
        planType: 'Full Service Plan',
        movingPartnerId: 2,
        address: '456 Oak Ave',
        zipcode: '67890',
        selectedStorageUnits: [1, 2, 3],
      };

      const result = calculateDetailedAppointmentChanges(existingAppointment, updateData);

      expect(result.hasChanges).toBe(true);
      expect(result.timeChange).not.toBeNull();
      expect(result.planChange).not.toBeNull();
      expect(result.movingPartnerChange).not.toBeNull();
      expect(result.storageUnitChange).not.toBeNull();
      expect(result.addressChange).not.toBeNull();
    });

    it('should detect no changes', () => {
      const existingAppointment = {
        time: new Date('2025-01-15T10:00:00Z'),
        planType: 'Do It Yourself Plan',
        movingPartnerId: 1,
        address: '123 Main St',
        zipcode: '12345',
      };

      const updateData = {};

      const result = calculateDetailedAppointmentChanges(existingAppointment, updateData);

      expect(result.hasChanges).toBe(false);
      expect(result.timeChange).toBeNull();
      expect(result.planChange).toBeNull();
      expect(result.movingPartnerChange).toBeNull();
      expect(result.storageUnitChange).toBeNull();
      expect(result.addressChange).toBeNull();
    });

    it('should detect storage unit reduction specifically', () => {
      const existingAppointment = {
        requestedStorageUnits: [
          { storageUnitId: 1 },
          { storageUnitId: 2 },
          { storageUnitId: 3 },
        ],
      };

      const updateData = {
        selectedStorageUnits: [1],
      };

      const result = calculateDetailedAppointmentChanges(existingAppointment, updateData);

      expect(result.hasChanges).toBe(true);
      expect(result.storageUnitChange).not.toBeNull();
      expect(result.storageUnitChange!.countDecreased).toBe(true);
      expect(result.storageUnitChange!.unitsRemoved).toEqual([2, 3]);
    });
  });
});

