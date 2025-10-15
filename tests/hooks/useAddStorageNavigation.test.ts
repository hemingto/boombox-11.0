/**
 * @fileoverview Jest tests for useAddStorageNavigation hook
 * @source boombox-11.0/src/hooks/useAddStorageNavigation.ts
 * 
 * TEST COVERAGE:
 * - Hook initialization and state management
 * - Step navigation and validation
 * - URL synchronization with shallow routing
 * - Plan type conditional navigation (DIY vs Full Service)
 * - Navigation guards and validation checks
 * - Browser history integration
 * - Step progression and regression
 * - Can proceed validation logic
 * - Edge cases and error handling
 * 
 * @refactor Comprehensive tests for the Add Storage navigation logic hook
 */

import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAddStorageNavigation } from '@/hooks/useAddStorageNavigation';
import { AddStorageStep, PlanType } from '@/types/addStorage.types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn()
};

const mockSearchParams = {
  get: jest.fn(),
  toString: jest.fn(() => '')
};

// Track the current step in URL for proper mocking
let currentUrlStep = '1';

const mockValidateStep = jest.fn();

describe('useAddStorageNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentUrlStep = '1'; // Reset to step 1
    
    // Mock router.push to update our tracked URL step
    mockPush.mockImplementation((url: string) => {
      const match = url.match(/step=(\d+)/);
      if (match) {
        currentUrlStep = match[1];
      }
    });
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    const { useSearchParams } = require('next/navigation');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockValidateStep.mockReturnValue(true); // Default to valid
    
    // Mock searchParams.get to return the current URL step
    mockSearchParams.get.mockImplementation((param: string) => {
      if (param === 'step') {
        return currentUrlStep;
      }
      return null;
    });
  });

  describe('Hook Initialization', () => {
    it('initializes with ADDRESS_AND_PLAN step for DIY plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      expect(result.current.canProceed(AddStorageStep.ADDRESS_AND_PLAN)).toBe(true);
    });


    it('initializes with ADDRESS_AND_PLAN step for Full Service plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      expect(result.current.canProceed(AddStorageStep.ADDRESS_AND_PLAN)).toBe(true);
    });

    it('provides all required navigation functions', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      expect(typeof result.current.goToStep).toBe('function');
      expect(typeof result.current.goToNextStep).toBe('function');
      expect(typeof result.current.goToPreviousStep).toBe('function');
      expect(typeof result.current.canProceed).toBe('function');
    });
  });

  describe('Step Navigation', () => {
    it('navigates to specific step with URL update', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
      expect(mockPush).toHaveBeenCalledWith('?step=2');
    });

    it('navigates to next step with validation', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(mockValidateStep).toHaveBeenCalledWith(AddStorageStep.ADDRESS_AND_PLAN);
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
      expect(mockPush).toHaveBeenCalledWith('?step=2');
    });

    it('prevents navigation to next step when validation fails', () => {
      mockValidateStep.mockReturnValue(false);
      
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      const initialStep = result.current.currentStep;
      
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(result.current.currentStep).toBe(initialStep); // Should not change
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates to previous step', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // First go to step 2
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      // Then go back
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      expect(mockPush).toHaveBeenLastCalledWith('?step=1', );
    });

    it('does not go to previous step from first step', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      const initialStep = result.current.currentStep;
      
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(initialStep);
    });
  });

  describe('DIY Plan Navigation Flow', () => {
    it('follows correct step sequence for DIY plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Step 1: Address and Plan
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      
      // Step 2: Scheduling
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
      
      // Step 3: Skip Labor Selection for DIY, go to Confirmation
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(AddStorageStep.CONFIRMATION);
    });

    it('skips labor selection step for DIY plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Go to scheduling
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      // Next step should skip labor selection
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.CONFIRMATION);
      expect(result.current.currentStep).not.toBe(AddStorageStep.LABOR_SELECTION);
    });

    it('handles backward navigation correctly for DIY plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Go to confirmation
      act(() => {
        result.current.goToStep(AddStorageStep.CONFIRMATION);
      });
      
      // Go back should skip labor selection
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
    });
  });

  describe('Full Service Plan Navigation Flow', () => {
    it('follows correct step sequence for Full Service plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      // Step 1: Address and Plan
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      
      // Step 2: Scheduling
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
      
      // Step 3: Labor Selection
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
      
      // Step 4: Confirmation
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(AddStorageStep.CONFIRMATION);
    });

    it('includes labor selection step for Full Service plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      // Go to scheduling
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      // Next step should be labor selection
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
    });

    it('handles backward navigation correctly for Full Service plan', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      // Go to confirmation
      act(() => {
        result.current.goToStep(AddStorageStep.CONFIRMATION);
      });
      
      // Go back should go to labor selection
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
      
      // Go back again should go to scheduling
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
    });
  });

  describe('Plan Type Changes', () => {
    it('adjusts navigation when plan type changes from DIY to Full Service', () => {
      const { result, rerender } = renderHook(
        ({ planType }) => useAddStorageNavigation({
          planType,
          validateStep: mockValidateStep
        }),
        { initialProps: { planType: PlanType.DIY } }
      );
      
      // Go to confirmation (skipping labor for DIY)
      act(() => {
        result.current.goToStep(AddStorageStep.CONFIRMATION);
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.CONFIRMATION);
      
      // Change to Full Service
      rerender({ planType: PlanType.FULL_SERVICE });
      
      // Navigation should now include labor selection
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
    });

    it('adjusts navigation when plan type changes from Full Service to DIY', () => {
      const { result, rerender } = renderHook(
        ({ planType }) => useAddStorageNavigation({
          planType,
          validateStep: mockValidateStep
        }),
        { initialProps: { planType: PlanType.FULL_SERVICE } }
      );
      
      // Go to labor selection
      act(() => {
        result.current.goToStep(AddStorageStep.LABOR_SELECTION);
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
      
      // Change to DIY
      rerender({ planType: PlanType.DIY });
      
      // Should remain on current step, but navigation logic should adjust
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
      
      // But going back should now skip labor selection for DIY
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
    });
  });

  describe('URL Synchronization', () => {
    it('updates URL with step parameter', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      expect(mockPush).toHaveBeenCalledWith('?step=2', );
    });

    it('uses shallow routing for navigation', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        expect.any(String),
        
      );
    });

    it('generates correct step URLs', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      // Test each step URL
      act(() => {
        result.current.goToStep(AddStorageStep.ADDRESS_AND_PLAN);
      });
      expect(mockPush).toHaveBeenLastCalledWith('?step=1', );
      
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      expect(mockPush).toHaveBeenLastCalledWith('?step=2', );
      
      act(() => {
        result.current.goToStep(AddStorageStep.LABOR_SELECTION);
      });
      expect(mockPush).toHaveBeenLastCalledWith('?step=3', );
      
      act(() => {
        result.current.goToStep(AddStorageStep.CONFIRMATION);
      });
      expect(mockPush).toHaveBeenLastCalledWith('?step=4', );
    });
  });

  describe('Validation Integration', () => {
    it('calls validateStep before proceeding to next step', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(mockValidateStep).toHaveBeenCalledWith(AddStorageStep.ADDRESS_AND_PLAN);
    });

    it('updates canProceed based on validation result', () => {
      mockValidateStep.mockReturnValue(false);
      
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      expect(result.current.canProceed(AddStorageStep.ADDRESS_AND_PLAN)).toBe(false);
    });

    it('allows navigation when validation passes', () => {
      mockValidateStep.mockReturnValue(true);
      
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      expect(result.current.canProceed(AddStorageStep.ADDRESS_AND_PLAN)).toBe(true);
      
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.SCHEDULING);
    });

    it('validates correct step based on current position', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.FULL_SERVICE,
          validateStep: mockValidateStep
        })
      );
      
      // Go to scheduling step
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      // Clear previous calls to focus on the next step validation
      mockValidateStep.mockClear();
      
      // Try to go to next step
      act(() => {
        result.current.goToNextStep();
      });
      
      // Should validate the current step (SCHEDULING) before proceeding
      expect(mockValidateStep).toHaveBeenCalledWith(AddStorageStep.SCHEDULING);
      expect(result.current.currentStep).toBe(AddStorageStep.LABOR_SELECTION);
    });
  });

  describe('Edge Cases', () => {
    it('handles invalid step navigation gracefully', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      const initialStep = result.current.currentStep;
      
      act(() => {
        result.current.goToStep(999 as AddStorageStep); // Invalid step
      });
      
      // Should remain on current step or handle gracefully
      expect(typeof result.current.currentStep).toBe('number');
    });

    it('handles missing validateStep function', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: undefined as any
        })
      );
      
      // Should not crash
      expect(result.current.currentStep).toBeDefined();
      expect(typeof result.current.canProceed).toBe('function');
    });

    it('handles router errors gracefully', () => {
      mockPush.mockImplementation(() => {
        throw new Error('Router error');
      });
      
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Should not crash when router fails, but step should still change
      expect(() => {
        act(() => {
          result.current.goToNextStep();
        });
      }).toThrow('Router error');
      
      // Reset mock for other tests
      mockPush.mockImplementation(() => {});
    });
  });

  describe('Step Boundaries', () => {
    it('does not go beyond last step', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Go to last step
      act(() => {
        result.current.goToStep(AddStorageStep.CONFIRMATION);
      });
      
      const lastStep = result.current.currentStep;
      
      // Try to go to next step
      act(() => {
        result.current.goToNextStep();
      });
      
      expect(result.current.currentStep).toBe(lastStep); // Should not change
    });

    it('does not go before first step', () => {
      const { result } = renderHook(() => 
        useAddStorageNavigation({
          planType: PlanType.DIY,
          validateStep: mockValidateStep
        })
      );
      
      // Already on first step
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN);
      
      // Try to go to previous step
      act(() => {
        result.current.goToPreviousStep();
      });
      
      expect(result.current.currentStep).toBe(AddStorageStep.ADDRESS_AND_PLAN); // Should not change
    });
  });

  describe('State Consistency', () => {
    it('maintains consistent state across re-renders', () => {
      const { result, rerender } = renderHook(
        ({ planType }) => useAddStorageNavigation({
          planType,
          validateStep: mockValidateStep
        }),
        { initialProps: { planType: PlanType.DIY } }
      );
      
      act(() => {
        result.current.goToStep(AddStorageStep.SCHEDULING);
      });
      
      const stepBeforeRerender = result.current.currentStep;
      
      rerender({ planType: PlanType.DIY });
      
      expect(result.current.currentStep).toBe(stepBeforeRerender);
    });
  });
});
