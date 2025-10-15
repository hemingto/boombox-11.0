/**
 * @fileoverview Jest tests for useAccessStorageForm hook
 * @source boombox-11.0/src/hooks/useAccessStorageForm.ts
 * 
 * TEST COVERAGE:
 * - Hook initialization and state management
 * - Form field handlers and validation
 * - Step navigation and validation logic
 * - Form submission workflow
 * - Error handling and recovery
 * - Plan selection and labor handling
 * - Date/time selection and validation
 * - Form reset and cleanup
 * 
 * @refactor Comprehensive tests for the centralized form state management hook
 */

import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAccessStorageForm } from '@/hooks/useAccessStorageForm';
import {
  AccessStorageStep,
  DeliveryReason,
  PlanType,
  AppointmentType,
  DEFAULT_FORM_STATE,
  DEFAULT_FORM_ERRORS,
  DEFAULT_FORM_FLAGS
} from '@/types/accessStorage.types';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('next-auth/react');

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: mockRefresh,
};

const mockSession = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
  },
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('useAccessStorageForm Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    
    // Default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { appointmentId: 123 }
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      expect(result.current.formState).toEqual({
        ...DEFAULT_FORM_STATE,
        zipCode: ''
      });
      expect(result.current.errors).toEqual(DEFAULT_FORM_ERRORS);
      expect(result.current.flags).toEqual(DEFAULT_FORM_FLAGS);
    });

    it('accepts initial zip code', () => {
      const { result } = renderHook(() => 
        useAccessStorageForm({ initialZipCode: '90210' })
      );

      expect(result.current.formState.zipCode).toBe('90210');
    });

    it('provides content ref for plan details animation', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      expect(result.current.contentRef).toBeDefined();
      expect(result.current.contentRef.current).toBeNull();
    });
  });

  describe('Form State Management', () => {
    it('updates form state with partial updates', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.updateFormState({
          address: '123 Test St',
          zipCode: '90210'
        });
      });

      expect(result.current.formState.address).toBe('123 Test St');
      expect(result.current.formState.zipCode).toBe('90210');
      // Other fields should remain unchanged
      expect(result.current.formState.deliveryReason).toBeNull();
    });

    it('manages error state correctly', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.setError('addressError', 'Invalid address');
      });

      expect(result.current.errors.addressError).toBe('Invalid address');

      act(() => {
        result.current.clearError('addressError');
      });

      expect(result.current.errors.addressError).toBeNull();
    });

    it('clears all errors', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.setError('addressError', 'Address error');
        result.current.setError('planError', 'Plan error');
      });

      expect(result.current.errors.addressError).toBe('Address error');
      expect(result.current.errors.planError).toBe('Plan error');

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual(DEFAULT_FORM_ERRORS);
    });
  });

  describe('Address Handling', () => {
    it('handles address change correctly', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const mockCoordinates = { lat: 34.0522, lng: -118.2437 };

      act(() => {
        result.current.handleAddressChange(
          '123 Test St',
          '90210',
          mockCoordinates,
          'Los Angeles'
        );
      });

      expect(result.current.formState.address).toBe('123 Test St');
      expect(result.current.formState.zipCode).toBe('90210');
      expect(result.current.formState.coordinates).toEqual(mockCoordinates);
      expect(result.current.formState.cityName).toBe('Los Angeles');
      expect(result.current.errors.addressError).toBeNull();
    });
  });

  describe('Delivery Reason Handling', () => {
    it('handles delivery reason change', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleDeliveryReasonChange(DeliveryReason.ACCESS_ITEMS);
      });

      expect(result.current.formState.deliveryReason).toBe(DeliveryReason.ACCESS_ITEMS);
      expect(result.current.formState.appointmentType).toBe(AppointmentType.STORAGE_UNIT_ACCESS);
      expect(result.current.errors.deliveryReasonError).toBeNull();
    });

    it('sets appointment type to END_STORAGE_TERM when ending storage', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleDeliveryReasonChange(DeliveryReason.END_STORAGE_TERM);
      });

      expect(result.current.formState.deliveryReason).toBe(DeliveryReason.END_STORAGE_TERM);
      expect(result.current.formState.appointmentType).toBe(AppointmentType.END_STORAGE_TERM);
    });
  });

  describe('Storage Unit Selection', () => {
    it('handles storage unit selection', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const selectedIds = ['unit-1', 'unit-2'];

      act(() => {
        result.current.handleStorageUnitSelection(selectedIds);
      });

      expect(result.current.formState.selectedStorageUnits).toEqual(selectedIds);
      expect(result.current.errors.storageUnitError).toBeNull();
    });
  });

  describe('Plan Selection', () => {
    it('handles DIY plan selection', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleInitialPlanChoice(
          'option1',
          'Do It Yourself Plan',
          'No loading help'
        );
      });

      expect(result.current.formState.selectedPlan).toBe('option1');
      expect(result.current.formState.selectedPlanName).toBe('Do It Yourself Plan');
      expect(result.current.formState.planType).toBe(PlanType.DO_IT_YOURSELF);
      expect(result.current.formState.loadingHelpPrice).toBe('$0');
      expect(result.current.formState.loadingHelpDescription).toBe('No loading help');
      expect(result.current.errors.planError).toBeNull();
    });

    it('handles Full Service plan selection', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleInitialPlanChoice(
          'option2',
          'Full Service Plan',
          'estimate'
        );
      });

      expect(result.current.formState.selectedPlan).toBe('option2');
      expect(result.current.formState.selectedPlanName).toBe('Full Service Plan');
      expect(result.current.formState.planType).toBe(PlanType.FULL_SERVICE);
      expect(result.current.formState.loadingHelpPrice).toBe('$189/hr');
      expect(result.current.formState.loadingHelpDescription).toBe('estimate');
    });
  });

  describe('Labor Selection', () => {
    it('handles labor selection for Full Service plan', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const mockLabor = {
        id: '123',
        price: '150',
        title: 'Professional Movers',
        onfleetTeamId: 'team-456'
      };

      act(() => {
        result.current.handleLaborChange(
          mockLabor.id,
          mockLabor.price,
          mockLabor.title,
          mockLabor.onfleetTeamId
        );
      });

      expect(result.current.formState.selectedLabor).toEqual({
        id: mockLabor.id,
        price: '$150/hr',
        title: mockLabor.title,
        onfleetTeamId: mockLabor.onfleetTeamId
      });
      expect(result.current.formState.parsedLoadingHelpPrice).toBe(150);
      expect(result.current.formState.loadingHelpPrice).toBe('$150/hr');
      expect(result.current.formState.selectedPlanName).toBe(mockLabor.title);
      expect(result.current.formState.planType).toBe(PlanType.FULL_SERVICE);
      expect(result.current.formState.movingPartnerId).toBe(123);
    });

    it('handles third-party labor selection', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleLaborChange(
          'thirdParty-789',
          '120',
          'Third Party Movers'
        );
      });

      expect(result.current.formState.planType).toBe(PlanType.THIRD_PARTY);
      expect(result.current.formState.thirdPartyMovingPartnerId).toBe(789);
      expect(result.current.formState.movingPartnerId).toBeNull();
    });
  });

  describe('Date and Time Selection', () => {
    it('handles date and time selection', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const testDate = new Date('2024-02-15T10:00:00Z');
      const timeSlot = '10:00am-12:00pm';

      act(() => {
        result.current.handleDateTimeSelected(testDate, timeSlot);
      });

      expect(result.current.formState.scheduledDate).toEqual(testDate);
      expect(result.current.formState.scheduledTimeSlot).toBe(timeSlot);
      expect(result.current.errors.scheduleError).toBeNull();
    });

    it('resets labor selection when date changes for Full Service plans', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // First set up a Full Service plan with labor
      act(() => {
        result.current.updateFormState({ planType: PlanType.FULL_SERVICE });
        result.current.handleLaborChange('labor-123', '150', 'Test Labor');
      });

      expect(result.current.formState.selectedLabor).toBeDefined();

      // Then change the date
      act(() => {
        result.current.handleDateTimeSelected(
          new Date('2024-02-15T10:00:00Z'),
          '10:00am-12:00pm'
        );
      });

      expect(result.current.formState.selectedLabor).toBeNull();
      expect(result.current.formState.movingPartnerId).toBeNull();
    });

    it('computes appointment date time correctly', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const testDate = new Date('2024-02-15');
      const timeSlot = '10:00am-12:00pm';

      act(() => {
        result.current.handleDateTimeSelected(testDate, timeSlot);
      });

      const appointmentDateTime = result.current.getAppointmentDateTime();
      expect(appointmentDateTime).toBeInstanceOf(Date);
      expect(appointmentDateTime?.getHours()).toBe(10);
      expect(appointmentDateTime?.getMinutes()).toBe(0);
    });
  });

  describe('Step Validation', () => {
    it('validates delivery purpose step', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Should fail without delivery reason
      act(() => {
        const isValid = result.current.validateStep(AccessStorageStep.DELIVERY_PURPOSE);
        expect(isValid).toBe(false);
      });

      // Should pass with all required fields
      act(() => {
        result.current.updateFormState({
          deliveryReason: DeliveryReason.ACCESS_ITEMS,
          address: '123 Test St',
          zipCode: '12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York',
          selectedStorageUnits: ['unit-1'],
          selectedPlan: 'option1',
          selectedPlanName: 'Do It Yourself Plan',
          planType: PlanType.DO_IT_YOURSELF
        });
      });

      act(() => {
        const isValid = result.current.validateStep(AccessStorageStep.DELIVERY_PURPOSE);
        expect(isValid).toBe(true);
      });
    });

    it('validates scheduling step', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Should fail without date/time
      act(() => {
        expect(result.current.validateStep(AccessStorageStep.SCHEDULING)).toBe(false);
      });
      expect(result.current.errors.scheduledDateError).toBe('Please select a date');

      // Should pass with date and time
      act(() => {
        result.current.updateFormState({
          scheduledDate: new Date('2024-02-15T10:00:00Z'),
          scheduledTimeSlot: '10:00am-12:00pm'
        });
      });

      expect(result.current.validateStep(AccessStorageStep.SCHEDULING)).toBe(true);
    });

    it('validates labor selection step for Full Service plans', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Set up Full Service plan
      act(() => {
        result.current.updateFormState({ planType: PlanType.FULL_SERVICE });
      });

      // Should fail without labor selection
      act(() => {
        expect(result.current.validateStep(AccessStorageStep.LABOR_SELECTION)).toBe(false);
      });
      expect(result.current.errors.laborError).toBe('Please choose a moving help option');

      // Should pass with labor selection
      act(() => {
        result.current.updateFormState({
          selectedLabor: {
            id: 'labor-123',
            price: '$150/hr',
            title: 'Test Labor'
          }
        });
      });

      expect(result.current.validateStep(AccessStorageStep.LABOR_SELECTION)).toBe(true);
    });

    it('skips labor validation for DIY plans', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.updateFormState({ planType: PlanType.DO_IT_YOURSELF });
      });

      // Should pass without labor selection for DIY
      act(() => {
        expect(result.current.validateStep(AccessStorageStep.LABOR_SELECTION)).toBe(true);
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form successfully', async () => {
      const onSubmissionSuccess = jest.fn();
      const { result } = renderHook(() => 
        useAccessStorageForm({ onSubmissionSuccess })
      );

      // Set up valid form state
      act(() => {
        result.current.updateFormState({
          deliveryReason: DeliveryReason.ACCESS_ITEMS,
          address: '123 Test St',
          zipCode: '90210',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York',
          selectedPlan: 'option1',
          selectedPlanName: 'Test Plan',
          scheduledDate: new Date('2024-02-15T10:00:00Z'),
          scheduledTimeSlot: '10:00am-12:00pm',
          selectedStorageUnits: ['unit-1'],
          planType: PlanType.DO_IT_YOURSELF,
          appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
          parsedLoadingHelpPrice: 0,
          calculatedTotal: 100
        });
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/orders/access-storage-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"userId":"test-user-123"')
      });

      expect(result.current.flags.isSubmitting).toBe(false);
      expect(onSubmissionSuccess).toHaveBeenCalledWith(123);
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/user-page/test-user-123');
    });

    it('handles submission errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Submission failed' })
      });

      const { result } = renderHook(() => useAccessStorageForm());

      // Set up valid form state
      act(() => {
        result.current.updateFormState({
          deliveryReason: DeliveryReason.ACCESS_ITEMS,
          address: '123 Test St',
          zipCode: '90210',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York',
          selectedPlan: 'option1',
          selectedPlanName: 'Test Plan',
          scheduledDate: new Date('2024-02-15T10:00:00Z'),
          scheduledTimeSlot: '10:00am-12:00pm',
          selectedStorageUnits: ['unit-1'],
          planType: PlanType.DO_IT_YOURSELF,
          appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
          parsedLoadingHelpPrice: 0,
          calculatedTotal: 100
        });
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.errors.submitError).toBe('Submission failed');
      expect(result.current.flags.isSubmitting).toBe(false);
    });

    it('validates form before submission', async () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Try to submit without required fields
      await act(async () => {
        await result.current.submitForm();
      });

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.errors.deliveryReasonError).toBe('Please select a reason for delivery');
    });

    it('handles network errors during submission', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAccessStorageForm());

      // Set up valid form state
      act(() => {
        result.current.updateFormState({
          deliveryReason: DeliveryReason.ACCESS_ITEMS,
          address: '123 Test St',
          zipCode: '90210',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York',
          selectedPlan: 'option1',
          selectedPlanName: 'Test Plan',
          scheduledDate: new Date('2024-02-15T10:00:00Z'),
          scheduledTimeSlot: '10:00am-12:00pm',
          selectedStorageUnits: ['unit-1'],
          planType: PlanType.DO_IT_YOURSELF,
          appointmentType: AppointmentType.STORAGE_UNIT_ACCESS,
          parsedLoadingHelpPrice: 0,
          calculatedTotal: 100
        });
      });

      await act(async () => {
        await result.current.submitForm();
      });

      expect(result.current.errors.submitError).toBe('Network error');
      expect(result.current.flags.isSubmitting).toBe(false);
    });
  });

  describe('Plan Details Animation', () => {
    it('toggles plan details visibility', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      expect(result.current.formState.isPlanDetailsVisible).toBe(false);

      act(() => {
        result.current.togglePlanDetails();
      });

      expect(result.current.formState.isPlanDetailsVisible).toBe(true);

      act(() => {
        result.current.togglePlanDetails();
      });

      expect(result.current.formState.isPlanDetailsVisible).toBe(false);
    });

    it('calculates content height when showing details', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Mock the ref to have scrollHeight
      const mockElement = { scrollHeight: 200 };
      result.current.contentRef.current = mockElement as HTMLDivElement;

      act(() => {
        result.current.togglePlanDetails();
      });

      expect(result.current.formState.isPlanDetailsVisible).toBe(true);
      expect(result.current.formState.contentHeight).toBe(200);
    });
  });

  describe('Form Reset', () => {
    it('resets form to initial state', () => {
      const { result } = renderHook(() => 
        useAccessStorageForm({ initialZipCode: '90210' })
      );

      // Modify form state
      act(() => {
        result.current.updateFormState({
          address: '123 Test St',
          deliveryReason: DeliveryReason.ACCESS_ITEMS
        });
        result.current.setError('addressError', 'Test error');
      });

      expect(result.current.formState.address).toBe('123 Test St');
      expect(result.current.errors.addressError).toBe('Test error');

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formState).toEqual({
        ...DEFAULT_FORM_STATE,
        zipCode: '90210'
      });
      expect(result.current.errors).toEqual(DEFAULT_FORM_ERRORS);
      expect(result.current.flags).toEqual(DEFAULT_FORM_FLAGS);
    });
  });

  describe('Unavailable Labor Handling', () => {
    it('handles unavailable labor errors', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleUnavailableLabor(true, 'Labor unavailable for selected time');
      });

      expect(result.current.errors.unavailableLaborError).toBe('Labor unavailable for selected time');

      act(() => {
        result.current.handleUnavailableLabor(false);
      });

      expect(result.current.errors.unavailableLaborError).toBeNull();
    });

    it('uses default message when no message provided', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      act(() => {
        result.current.handleUnavailableLabor(true);
      });

      expect(result.current.errors.unavailableLaborError).toBe('Mover unavailable. Choose another.');
    });
  });

  describe('Step Navigation Logic', () => {
    it('determines if can proceed to next step', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      // Should not be able to proceed without valid form
      act(() => {
        expect(result.current.canProceedToNextStep(AccessStorageStep.DELIVERY_PURPOSE)).toBe(false);
      });

      // Set up valid delivery purpose step
      act(() => {
        result.current.updateFormState({
          deliveryReason: DeliveryReason.ACCESS_ITEMS,
          address: '123 Test St',
          zipCode: '12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York',
          selectedStorageUnits: ['unit-1'],
          selectedPlan: 'option1',
          selectedPlanName: 'Do It Yourself Plan',
          planType: PlanType.DO_IT_YOURSELF
        });
      });

      act(() => {
        expect(result.current.canProceedToNextStep(AccessStorageStep.DELIVERY_PURPOSE)).toBe(true);
      });
    });
  });

  describe('Computed Values', () => {
    it('provides combined date time for labor', () => {
      const { result } = renderHook(() => useAccessStorageForm());

      const testDate = new Date('2024-02-15');
      const timeSlot = '2:30pm-4:30pm';

      act(() => {
        result.current.handleDateTimeSelected(testDate, timeSlot);
      });

      const combinedDateTime = result.current.combinedDateTimeForLabor;
      expect(combinedDateTime).toBeInstanceOf(Date);
      expect(combinedDateTime?.getHours()).toBe(14); // 2:30 PM in 24-hour format
      expect(combinedDateTime?.getMinutes()).toBe(30);
    });
  });
});
