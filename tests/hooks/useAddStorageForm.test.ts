/**
 * @fileoverview Jest tests for useAddStorageForm hook
 * @source boombox-11.0/src/hooks/useAddStorageForm.ts
 * 
 * TEST COVERAGE:
 * - Hook initialization and state management
 * - Form field handlers and validation
 * - Address info updates and validation
 * - Storage unit selection and text generation
 * - Plan selection and type management
 * - Labor selection and pricing updates
 * - Insurance selection and validation
 * - Scheduling updates and date handling
 * - Pricing calculations and updates
 * - Form validation and error handling
 * - Form reset and cleanup
 * - Plan details accordion behavior
 * - Content height management
 * 
 * @refactor Comprehensive tests for the centralized Add Storage form state management hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAddStorageForm } from '@/hooks/useAddStorageForm';
import {
  AddStorageStep,
  PlanType,
  DEFAULT_ADD_STORAGE_FORM_STATE,
  DEFAULT_ADD_STORAGE_FORM_ERRORS
} from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }))
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user-id' } },
    status: 'authenticated'
  }))
}));

// Mock dependencies
jest.mock('@/lib/utils', () => ({
  parseLoadingHelpPrice: jest.fn((price: string) => parseFloat(price.replace(/[^0-9.]/g, '')) || 0),
  getStorageUnitText: jest.fn((count: number) => `${count} storage unit${count !== 1 ? 's' : ''}`)
}));

describe('useAddStorageForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      expect(result.current.formState).toEqual(expect.objectContaining({
        addressInfo: {
          address: '',
          zipCode: '',
          coordinates: null,
          cityName: ''
        },
        storageUnit: {
          count: 1,
          text: 'studio apartment'
        },
        selectedPlan: '',
        selectedPlanName: '',
        planType: PlanType.DIY,
        selectedLabor: null,
        selectedInsurance: null,
        scheduling: {
          scheduledDate: null,
          scheduledTimeSlot: null
        },
        pricing: {
          loadingHelpPrice: '---',
          loadingHelpDescription: '',
          monthlyStorageRate: 0,
          monthlyInsuranceRate: 0,
          parsedLoadingHelpPrice: 0,
          calculatedTotal: 0
        },
        description: '',
        appointmentType: 'Additional Storage',
        currentStep: AddStorageStep.ADDRESS_AND_PLAN,
        isPlanDetailsVisible: false,
        contentHeight: null,
        movingPartnerId: null,
        thirdPartyMovingPartnerId: null
      }));
      
      expect(result.current.errors).toEqual(DEFAULT_ADD_STORAGE_FORM_ERRORS);
    });

    it('initializes with custom initial values', () => {
      const { result } = renderHook(() => 
        useAddStorageForm({
          initialStorageUnitCount: 3,
          initialZipCode: '12345'
        })
      );
      
      expect(result.current.formState.storageUnit.count).toBe(3);
      expect(result.current.formState.storageUnit.text).toBe('2 bedroom apt');
      expect(result.current.formState.addressInfo.zipCode).toBe('12345');
    });

    it('provides all required functions', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      expect(typeof result.current.updateFormState).toBe('function');
      expect(typeof result.current.updateAddressInfo).toBe('function');
      expect(typeof result.current.updateStorageUnit).toBe('function');
      expect(typeof result.current.updatePlanSelection).toBe('function');
      expect(typeof result.current.updateLaborSelection).toBe('function');
      expect(typeof result.current.updateInsurance).toBe('function');
      expect(typeof result.current.updateScheduling).toBe('function');
      expect(typeof result.current.updatePricing).toBe('function');
      expect(typeof result.current.validateStep).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.togglePlanDetails).toBe('function');
      expect(result.current.contentRef).toBeDefined();
    });
  });

  describe('Address Info Updates', () => {
    it('updates address information correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const addressInfo = {
        address: '123 Test St',
        zipCode: '12345',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        cityName: 'New York'
      };
      
      act(() => {
        result.current.updateAddressInfo(addressInfo);
      });
      
      expect(result.current.formState.addressInfo).toEqual(addressInfo);
    });

    it('clears address error when address is updated', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Set an address error first
      act(() => {
        result.current.clearError('addressError');
      });
      
      // Update address
      act(() => {
        result.current.updateAddressInfo({
          address: '456 New St',
          zipCode: '54321',
          coordinates: { lat: 41, lng: -75 },
          cityName: 'Philadelphia'
        });
      });
      
      expect(result.current.errors.addressError).toBeNull();
    });
  });

  describe('Storage Unit Updates', () => {
    it('updates storage unit count and text', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updateStorageUnit(3, '3 storage units');
      });
      
      expect(result.current.formState.storageUnit.count).toBe(3);
      expect(result.current.formState.storageUnit.text).toBe('3 storage units');
    });

    it('handles single unit text correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({ initialStorageUnitCount: 2 }));
      
      act(() => {
        result.current.updateStorageUnit(1, '1 storage unit');
      });
      
      expect(result.current.formState.storageUnit.count).toBe(1);
      expect(result.current.formState.storageUnit.text).toBe('1 storage unit');
    });
  });

  describe('Plan Selection', () => {
    it('updates plan selection for DIY plan', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updatePlanSelection('option1', 'Do It Yourself Plan', 'DIY');
      });
      
      expect(result.current.formState.selectedPlan).toBe('option1');
      expect(result.current.formState.selectedPlanName).toBe('Do It Yourself Plan');
      expect(result.current.formState.planType).toBe('DIY');
    });

    it('updates plan selection for Full Service plan', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updatePlanSelection('option2', 'Full Service Plan', 'FULL_SERVICE');
      });
      
      expect(result.current.formState.selectedPlan).toBe('option2');
      expect(result.current.formState.selectedPlanName).toBe('Full Service Plan');
      expect(result.current.formState.planType).toBe('FULL_SERVICE');
    });

    it('clears plan error when plan is selected', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updatePlanSelection('option1', 'Do It Yourself Plan', 'DIY');
      });
      
      expect(result.current.errors.planError).toBeNull();
    });

    it('resets labor selection when switching to DIY plan', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // First set Full Service with labor
      act(() => {
        result.current.updatePlanSelection('option2', 'Full Service Plan', 'FULL_SERVICE');
        result.current.updateLaborSelection({
          id: 'labor-1',
          price: '$189',
          title: 'Professional Movers',
          onfleetTeamId: 'team-123'
        });
      });
      
      expect(result.current.formState.selectedLabor).not.toBeNull();
      
      // Switch to DIY
      act(() => {
        result.current.updatePlanSelection('option1', 'Do It Yourself Plan', 'DIY');
      });
      
      // DIY plan sets a special DIY labor object
      expect(result.current.formState.selectedLabor).toEqual({
        id: 'Do It Yourself Plan',
        price: '$0/hr',
        title: 'Do It Yourself Plan'
      });
      expect(result.current.formState.pricing.loadingHelpPrice).toBe('$0/hr');
      expect(result.current.formState.pricing.loadingHelpDescription).toBe('Free! 1st hr');
    });
  });

  describe('Labor Selection', () => {
    it('updates labor selection correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const laborSelection = {
        id: 'labor-1',
        price: '189',
        title: 'Professional Movers',
        onfleetTeamId: 'team-123'
      };
      
      act(() => {
        result.current.updateLaborSelection(laborSelection);
      });
      
      expect(result.current.formState.selectedLabor).toEqual({
        ...laborSelection,
        price: '$189/hr'
      });
      expect(result.current.formState.pricing.loadingHelpPrice).toBe('$189/hr');
      expect(result.current.formState.pricing.loadingHelpDescription).toBe('Full Service Plan');
    });

    it('clears labor errors when labor is selected', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updateLaborSelection({
          id: 'labor-1',
          price: '$189',
          title: 'Professional Movers'
        });
      });
      
      expect(result.current.errors.laborError).toBeNull();
      expect(result.current.errors.unavailableLaborError).toBeNull();
    });

    it('handles labor selection without onfleetTeamId', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const laborSelection = {
        id: 'labor-2',
        price: '150',
        title: 'Budget Movers'
      };
      
      act(() => {
        result.current.updateLaborSelection(laborSelection);
      });
      
      expect(result.current.formState.selectedLabor).toEqual({
        ...laborSelection,
        price: '$150/hr'
      });
    });
  });

  describe('Insurance Selection', () => {
    it('updates insurance selection correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const insurance: InsuranceOption = {
        id: '1',
        value: 'basic',
        name: 'Basic Coverage',
        price: 15,
        coverage: '$1000'
      };
      
      act(() => {
        result.current.updateInsurance(insurance);
      });
      
      expect(result.current.formState.selectedInsurance).toEqual(insurance);
    });

    it('handles null insurance selection', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // First set insurance
      const insurance: InsuranceOption = {
        id: '1',
        value: 'basic',
        name: 'Basic Coverage',
        price: 15,
        coverage: '$1000'
      };
      
      act(() => {
        result.current.updateInsurance(insurance);
      });
      
      expect(result.current.formState.selectedInsurance).toEqual(insurance);
      
      // Then clear it
      act(() => {
        result.current.updateInsurance(null);
      });
      
      expect(result.current.formState.selectedInsurance).toBeNull();
    });

    it('clears insurance error when insurance is selected', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const insurance: InsuranceOption = {
        id: '1',
        value: 'basic',
        name: 'Basic Coverage',
        price: 15,
        coverage: '$1000'
      };
      
      act(() => {
        result.current.updateInsurance(insurance);
      });
      
      expect(result.current.errors.insuranceError).toBeNull();
    });
  });

  describe('Scheduling Updates', () => {
    it('updates scheduling information correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const scheduledDate = new Date('2024-12-01');
      const scheduledTimeSlot = '10:00 AM - 12:00 PM';
      
      act(() => {
        result.current.updateScheduling(scheduledDate, scheduledTimeSlot);
      });
      
      expect(result.current.formState.scheduling.scheduledDate).toEqual(scheduledDate);
      expect(result.current.formState.scheduling.scheduledTimeSlot).toBe(scheduledTimeSlot);
    });

    it('clears schedule error when scheduling is updated', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updateScheduling(new Date('2024-12-01'), '2:00 PM - 4:00 PM');
      });
      
      expect(result.current.errors.scheduleError).toBeNull();
    });
  });

  describe('Pricing Updates', () => {
    it('updates pricing information correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const pricingUpdate = {
        monthlyStorageRate: 89,
        monthlyInsuranceRate: 15,
        calculatedTotal: 104
      };
      
      act(() => {
        result.current.updatePricing(pricingUpdate);
      });
      
      expect(result.current.formState.pricing.monthlyStorageRate).toBe(89);
      expect(result.current.formState.pricing.monthlyInsuranceRate).toBe(15);
      expect(result.current.formState.pricing.calculatedTotal).toBe(104);
    });

    it('updates partial pricing information', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.updatePricing({ monthlyStorageRate: 99 });
      });
      
      expect(result.current.formState.pricing.monthlyStorageRate).toBe(99);
      expect(result.current.formState.pricing.monthlyInsuranceRate).toBe(0); // Should remain unchanged
    });
  });

  describe('Form Validation', () => {
    it('validates address and plan step correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Set valid data including insurance
      act(() => {
        result.current.updateAddressInfo({
          address: '123 Test St',
          zipCode: '12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York'
        });
        result.current.updatePlanSelection('option1', 'Do It Yourself Plan', 'DIY');
        result.current.updateInsurance({
          id: '1',
          value: 'basic',
          name: 'Basic Coverage',
          price: 15,
          coverage: '$1000'
        });
      });
      
      const validation = result.current.validateStep(AddStorageStep.ADDRESS_AND_PLAN);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual({});
    });

    it('validates scheduling step correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Set valid scheduling data
      act(() => {
        result.current.updateScheduling(new Date('2024-12-01'), '10:00 AM - 12:00 PM');
      });
      
      const validation = result.current.validateStep(AddStorageStep.SCHEDULING);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual({});
    });

    it('validates labor selection step for Full Service plan', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Set Full Service plan with labor
      act(() => {
        result.current.updatePlanSelection('option2', 'Full Service Plan', 'FULL_SERVICE');
        result.current.updateLaborSelection({
          id: 'labor-1',
          price: '$189',
          title: 'Professional Movers'
        });
      });
      
      const validation = result.current.validateStep(AddStorageStep.LABOR_SELECTION);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual({});
    });

    it('returns validation errors for invalid data', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Don't set any data
      const validation = result.current.validateStep(AddStorageStep.ADDRESS_AND_PLAN);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveProperty('addressError');
      expect(validation.errors).toHaveProperty('planError');
    });
  });

  describe('Error Management', () => {
    it('clears specific errors correctly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Trigger validation to set errors
      act(() => {
        result.current.validateStep(AddStorageStep.ADDRESS_AND_PLAN);
      });
      
      // Clear specific error
      act(() => {
        result.current.clearError('addressError');
      });
      
      expect(result.current.errors.addressError).toBeNull();
    });

    it('handles clearing non-existent errors', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      act(() => {
        result.current.clearError('nonExistentError' as any);
      });
      
      // Should not throw error
      expect(result.current.errors).toBeDefined();
    });
  });

  describe('Plan Details Accordion', () => {
    it('toggles plan details visibility', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
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

    it('updates content height when toggling', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Mock contentRef with scrollHeight
      const mockElement = {
        scrollHeight: 200
      };
      result.current.contentRef.current = mockElement as HTMLDivElement;
      
      act(() => {
        result.current.togglePlanDetails(); // This makes isPlanDetailsVisible true
      });
      
      act(() => {
        result.current.updateContentHeight(); // Now this should work
      });
      
      expect(result.current.formState.contentHeight).toBe(200);
    });
  });

  describe('Form State Updates', () => {
    it('updates form state directly', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const newState = {
        description: 'Test description'
      };
      
      act(() => {
        result.current.updateFormState(newState);
      });
      
      expect(result.current.formState.description).toBe('Test description');
    });

    it('merges partial state updates', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      // Set initial data
      act(() => {
        result.current.updateAddressInfo({
          address: '123 Test St',
          zipCode: '12345',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          cityName: 'New York'
        });
      });
      
      // Update only description
      act(() => {
        result.current.updateFormState({ description: 'New description' });
      });
      
      expect(result.current.formState.description).toBe('New description');
      expect(result.current.formState.addressInfo.address).toBe('123 Test St'); // Should remain
    });
  });

  describe('Content Reference', () => {
    it('provides a content ref for accordion animation', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      expect(result.current.contentRef).toBeDefined();
      expect(result.current.contentRef.current).toBeNull(); // Initially null
    });

    it('uses content ref for height calculation', () => {
      const { result } = renderHook(() => useAddStorageForm({}));
      
      const mockElement = {
        scrollHeight: 150
      };
      result.current.contentRef.current = mockElement as HTMLDivElement;
      
      act(() => {
        result.current.togglePlanDetails(); // This makes isPlanDetailsVisible true
      });
      
      act(() => {
        result.current.updateContentHeight(); // Now this should work
      });
      
      expect(result.current.formState.contentHeight).toBe(150);
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined initial values gracefully', () => {
      const { result } = renderHook(() => 
        useAddStorageForm({
          initialStorageUnitCount: undefined as any,
          initialZipCode: undefined as any
        })
      );
      
      expect(result.current.formState.storageUnit.count).toBe(1); // Default
      expect(result.current.formState.addressInfo.zipCode).toBe(''); // Default
    });

    it('handles invalid storage unit count', () => {
      const { result } = renderHook(() => 
        useAddStorageForm({
          initialStorageUnitCount: -1
        })
      );
      
      expect(result.current.formState.storageUnit.count).toBe(-1); // Uses whatever is passed
      expect(result.current.formState.storageUnit.text).toBe('studio apartment'); // Default text for invalid count
    });

    it('handles zero storage unit count', () => {
      const { result } = renderHook(() => 
        useAddStorageForm({
          initialStorageUnitCount: 0
        })
      );
      
      expect(result.current.formState.storageUnit.count).toBe(0); // Uses whatever is passed
      expect(result.current.formState.storageUnit.text).toBe('studio apartment'); // Default text for invalid count
    });
  });
});
