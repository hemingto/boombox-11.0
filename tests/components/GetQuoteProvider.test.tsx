/**
 * @fileoverview Tests for GetQuoteProvider
 * Sub-Task 11A: Provider & Context tests
 */

import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { GetQuoteProvider, useGetQuoteContext } from '@/components/features/orders/get-quote';

describe('GetQuoteProvider', () => {
  describe('Provider Setup', () => {
    it('provides context to children', () => {
      const TestComponent = () => {
        const { state } = useGetQuoteContext();
        return <div data-testid="test">{state.currentStep}</div>;
      };

      render(
        <GetQuoteProvider>
          <TestComponent />
        </GetQuoteProvider>
      );

      expect(screen.getByTestId('test')).toHaveTextContent('1');
    });

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => {
        useGetQuoteContext();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useGetQuoteContext must be used within GetQuoteProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.storageUnitCount).toBe(1);
      expect(result.current.state.storageUnitText).toBe('studio apartment');
      expect(result.current.state.address).toBe('');
      expect(result.current.state.zipCode).toBe('');
      expect(result.current.state.selectedPlan).toBe('');
      expect(result.current.state.isSubmitting).toBe(false);
    });

    it('accepts initial storage unit count', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider initialStorageUnitCount={3}>
          {children}
        </GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.storageUnitCount).toBe(3);
      expect(result.current.state.storageUnitText).toBe('2 bedroom apt');
    });

    it('accepts initial zip code', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider initialZipCode="94101">{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.zipCode).toBe('94101');
    });
  });

  describe('Address Actions', () => {
    it('sets address with all location data', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      const coordinates = { lat: 37.7749, lng: -122.4194 };

      act(() => {
        result.current.actions.setAddress(
          '123 Main St',
          '94101',
          coordinates,
          'San Francisco'
        );
      });

      expect(result.current.state.address).toBe('123 Main St');
      expect(result.current.state.zipCode).toBe('94101');
      expect(result.current.state.coordinates).toEqual(coordinates);
      expect(result.current.state.cityName).toBe('San Francisco');
      expect(result.current.state.addressError).toBeNull();
    });

    it('clears address error', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      // First set an error by going to the state directly (we'll add validation later)
      // For now, just test the clear function works
      act(() => {
        result.current.actions.clearAddressError();
      });

      expect(result.current.state.addressError).toBeNull();
    });
  });

  describe('Storage Unit Actions', () => {
    it('sets storage unit count and text', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setStorageUnitCount(4, 'full house');
      });

      expect(result.current.state.storageUnitCount).toBe(4);
      expect(result.current.state.storageUnitText).toBe('full house');
    });
  });

  describe('Plan Selection Actions', () => {
    it('sets DIY plan and updates related pricing', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY');
      });

      expect(result.current.state.selectedPlan).toBe('option1');
      expect(result.current.state.selectedPlanName).toBe('Do It Yourself Plan');
      expect(result.current.state.planType).toBe('Do It Yourself Plan');
      expect(result.current.state.loadingHelpPrice).toBe('$0/hr');
      expect(result.current.state.loadingHelpDescription).toBe('Free! 1st hr');
      expect(result.current.state.selectedLabor).toBeNull();
    });

    it('sets Full Service plan and updates pricing', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
      });

      expect(result.current.state.selectedPlan).toBe('option2');
      expect(result.current.state.selectedPlanName).toBe('Full Service Plan');
      expect(result.current.state.planType).toBe('Full Service Plan');
      expect(result.current.state.loadingHelpPrice).toBe('$189/hr');
      expect(result.current.state.loadingHelpDescription).toBe('estimate');
    });

    it('toggles plan details visibility', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.isPlanDetailsVisible).toBe(false);

      act(() => {
        result.current.actions.togglePlanDetails();
      });

      expect(result.current.state.isPlanDetailsVisible).toBe(true);

      act(() => {
        result.current.actions.togglePlanDetails();
      });

      expect(result.current.state.isPlanDetailsVisible).toBe(false);
    });
  });

  describe('Step Navigation', () => {
    it('advances to next step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.currentStep).toBe(1);

      // Fill required fields for step 1 to pass validation
      act(() => {
        result.current.actions.setAddress('123 Main St', '94101', { lat: 37.7, lng: -122.4 }, 'SF');
        result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY Plan');
        result.current.actions.setInsurance({ label: 'Basic', price: '10', value: 'basic' });
        result.current.actions.nextStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('skips step 3 for DIY plan when going to next step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      // Set DIY plan and required fields
      act(() => {
        result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY');
        result.current.actions.goToStep(2);
      });

      expect(result.current.state.currentStep).toBe(2);

      // Set schedule (required for step 2 validation)
      act(() => {
        result.current.actions.setSchedule(new Date('2025-12-01'), '9:00 AM');
      });

      // Next step should skip to 4
      act(() => {
        result.current.actions.nextStep();
      });

      expect(result.current.state.currentStep).toBe(4);
    });

    it('includes step 3 for Full Service plan', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      // Set Full Service plan
      act(() => {
        result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
        result.current.actions.goToStep(2);
      });

      expect(result.current.state.currentStep).toBe(2);

      // Set schedule (required for step 2 validation)
      act(() => {
        result.current.actions.setSchedule(new Date('2025-12-01'), '9:00 AM - 11:00 AM');
      });

      // Next step should be 3
      act(() => {
        result.current.actions.nextStep();
      });

      expect(result.current.state.currentStep).toBe(3);
    });

    it('goes back to previous step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.goToStep(3);
      });

      expect(result.current.state.currentStep).toBe(3);

      act(() => {
        result.current.actions.previousStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('skips step 3 when going back for DIY plan', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      // Set DIY plan and go to step 4
      act(() => {
        result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY');
        result.current.actions.goToStep(4);
      });

      expect(result.current.state.currentStep).toBe(4);

      // Previous step should skip back to 2
      act(() => {
        result.current.actions.previousStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('jumps to specific step', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.goToStep(5);
      });

      expect(result.current.state.currentStep).toBe(5);
    });

    it('does not go below step 1 when going back', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      expect(result.current.state.currentStep).toBe(1);

      act(() => {
        result.current.actions.previousStep();
      });

      expect(result.current.state.currentStep).toBe(1);
    });
  });

  describe('Contact Info Actions', () => {
    it('sets first name and clears error', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setFirstName('John');
      });

      expect(result.current.state.firstName).toBe('John');
      expect(result.current.state.firstNameError).toBeNull();
    });

    it('sets all contact fields correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setFirstName('John');
        result.current.actions.setLastName('Doe');
        result.current.actions.setEmail('john@example.com');
        result.current.actions.setPhoneNumber('4155551234');
      });

      expect(result.current.state.firstName).toBe('John');
      expect(result.current.state.lastName).toBe('Doe');
      expect(result.current.state.email).toBe('john@example.com');
      expect(result.current.state.phoneNumber).toBe('4155551234');
    });

    it('clears all contact errors', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.clearContactErrors();
      });

      expect(result.current.state.firstNameError).toBeNull();
      expect(result.current.state.lastNameError).toBeNull();
      expect(result.current.state.emailError).toBeNull();
      expect(result.current.state.phoneError).toBeNull();
    });
  });

  describe('Pricing Actions', () => {
    it('sets calculated total', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setCalculatedTotal(299);
      });

      expect(result.current.state.calculatedTotal).toBe(299);
    });

    it('sets monthly rates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.setMonthlyStorageRate(150);
        result.current.actions.setMonthlyInsuranceRate(15);
      });

      expect(result.current.state.monthlyStorageRate).toBe(150);
      expect(result.current.state.monthlyInsuranceRate).toBe(15);
    });
  });

  describe('Step Navigation (Sub-Task 11B)', () => {
    describe('Basic Navigation', () => {
      it('can advance to next step with goToStep', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        act(() => {
          result.current.actions.goToStep(2);
        });

        expect(result.current.state.currentStep).toBe(2);
      });

      it('can go back with goToStep', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        act(() => {
          result.current.actions.goToStep(3);
        });

        expect(result.current.state.currentStep).toBe(3);

        act(() => {
          result.current.actions.goToStep(1);
        });

        expect(result.current.state.currentStep).toBe(1);
      });

      it('can go to previous step with previousStep', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        act(() => {
          result.current.actions.goToStep(3);
        });

        expect(result.current.state.currentStep).toBe(3);

        act(() => {
          result.current.actions.previousStep();
        });

        expect(result.current.state.currentStep).toBe(2);
      });

      it('does not go below step 1 with previousStep', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        expect(result.current.state.currentStep).toBe(1);

        act(() => {
          result.current.actions.previousStep();
        });

        expect(result.current.state.currentStep).toBe(1);
      });
    });

    describe('Validation Before Progression', () => {
      it('prevents advancing from step 1 without required fields', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        expect(result.current.state.currentStep).toBe(1);

        // Try to advance without filling required fields
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 1
        expect(result.current.state.currentStep).toBe(1);

        // Should have validation errors
        expect(result.current.state.addressError).toBeTruthy();
        expect(result.current.state.planError).toBeTruthy();
        expect(result.current.state.insuranceError).toBeTruthy();
      });

      it('allows advancing from step 1 when all fields are valid', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Fill required fields for step 1
        act(() => {
          result.current.actions.setAddress('123 Main St', '94101', { lat: 37.7, lng: -122.4 }, 'San Francisco');
          result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY Plan');
          result.current.actions.setInsurance({ label: 'Basic Coverage', price: '10', value: 'basic' });
        });

        expect(result.current.state.currentStep).toBe(1);

        // Try to advance
        act(() => {
          result.current.actions.nextStep();
        });

        // Should advance to step 2
        expect(result.current.state.currentStep).toBe(2);

        // Should have no errors
        expect(result.current.state.addressError).toBeNull();
        expect(result.current.state.planError).toBeNull();
        expect(result.current.state.insuranceError).toBeNull();
      });

      it('prevents advancing from step 2 without date/time', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 2
        act(() => {
          result.current.actions.goToStep(2);
        });

        expect(result.current.state.currentStep).toBe(2);

        // Try to advance without selecting date/time
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 2
        expect(result.current.state.currentStep).toBe(2);

        // Should have validation error
        expect(result.current.state.scheduleError).toBeTruthy();
      });

      it('allows advancing from step 2 when date/time are selected', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 2 and set plan
        act(() => {
          result.current.actions.goToStep(2);
          result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
        });

        // Set schedule
        act(() => {
          result.current.actions.setSchedule(new Date('2025-12-01'), '9:00 AM - 11:00 AM');
        });

        // Try to advance
        act(() => {
          result.current.actions.nextStep();
        });

        // Should advance to step 3 (for Full Service)
        expect(result.current.state.currentStep).toBe(3);

        // Should have no errors
        expect(result.current.state.scheduleError).toBeNull();
      });

      it('prevents advancing from step 3 without labor selection (Full Service)', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 3 and set Full Service plan
        act(() => {
          result.current.actions.goToStep(3);
          result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
        });

        expect(result.current.state.currentStep).toBe(3);

        // Try to advance without selecting labor
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 3
        expect(result.current.state.currentStep).toBe(3);

        // Should have validation error
        expect(result.current.state.laborError).toBeTruthy();
      });

      it('allows advancing from step 3 when labor is selected', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 3 and set Full Service plan
        act(() => {
          result.current.actions.goToStep(3);
          result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
          result.current.actions.setLabor('123', '189', 'Premium Movers', 'team-id-123');
        });

        // Try to advance
        act(() => {
          result.current.actions.nextStep();
        });

        // Should advance to step 4
        expect(result.current.state.currentStep).toBe(4);

        // Should have no errors
        expect(result.current.state.laborError).toBeNull();
      });

      it('prevents advancing from step 4 without contact info', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 4
        act(() => {
          result.current.actions.goToStep(4);
        });

        expect(result.current.state.currentStep).toBe(4);

        // Try to advance without contact info
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 4
        expect(result.current.state.currentStep).toBe(4);

        // Should have validation errors
        expect(result.current.state.firstNameError).toBeTruthy();
        expect(result.current.state.lastNameError).toBeTruthy();
        expect(result.current.state.emailError).toBeTruthy();
        expect(result.current.state.phoneError).toBeTruthy();
      });

      it('validates email format on step 4', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 4 and set invalid email
        act(() => {
          result.current.actions.goToStep(4);
          result.current.actions.setFirstName('John');
          result.current.actions.setLastName('Doe');
          result.current.actions.setEmail('invalid-email');
          result.current.actions.setPhoneNumber('1234567890');
        });

        // Try to advance
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 4
        expect(result.current.state.currentStep).toBe(4);

        // Should have email validation error
        expect(result.current.state.emailError).toBeTruthy();
      });

      it('validates phone format on step 4', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Go to step 4 and set invalid phone
        act(() => {
          result.current.actions.goToStep(4);
          result.current.actions.setFirstName('John');
          result.current.actions.setLastName('Doe');
          result.current.actions.setEmail('john@example.com');
          result.current.actions.setPhoneNumber('123'); // Too short
        });

        // Try to advance
        act(() => {
          result.current.actions.nextStep();
        });

        // Should stay on step 4
        expect(result.current.state.currentStep).toBe(4);

        // Should have phone validation error
        expect(result.current.state.phoneError).toBeTruthy();
      });
    });

    describe('Conditional Step Navigation (DIY vs Full Service)', () => {
      it('skips step 3 when advancing from step 2 with DIY plan', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Set up DIY plan and go to step 2
        act(() => {
          result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY Plan');
          result.current.actions.setAddress('123 Main St', '94101', { lat: 37.7, lng: -122.4 }, 'SF');
          result.current.actions.setInsurance({ label: 'Basic', price: '10', value: 'basic' });
          result.current.actions.nextStep(); // Advance to step 2
        });

        expect(result.current.state.currentStep).toBe(2);

        // Set schedule
        act(() => {
          result.current.actions.setSchedule(new Date('2025-12-01'), '9:00 AM');
        });

        // Advance from step 2 - should skip step 3
        act(() => {
          result.current.actions.nextStep();
        });

        expect(result.current.state.currentStep).toBe(4); // Skipped step 3
      });

      it('includes step 3 when advancing from step 2 with Full Service plan', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Set up Full Service plan and go to step 2
        act(() => {
          result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
          result.current.actions.setAddress('123 Main St', '94101', { lat: 37.7, lng: -122.4 }, 'SF');
          result.current.actions.setInsurance({ label: 'Basic', price: '10', value: 'basic' });
          result.current.actions.nextStep(); // Advance to step 2
        });

        expect(result.current.state.currentStep).toBe(2);

        // Set schedule
        act(() => {
          result.current.actions.setSchedule(new Date('2025-12-01'), '9:00 AM');
        });

        // Advance from step 2 - should go to step 3
        act(() => {
          result.current.actions.nextStep();
        });

        expect(result.current.state.currentStep).toBe(3); // Did not skip step 3
      });

      it('skips step 3 when going back from step 4 with DIY plan', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Set DIY plan and go to step 4
        act(() => {
          result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY Plan');
          result.current.actions.goToStep(4);
        });

        expect(result.current.state.currentStep).toBe(4);

        // Go back - should skip step 3
        act(() => {
          result.current.actions.previousStep();
        });

        expect(result.current.state.currentStep).toBe(2); // Skipped step 3 backwards
      });

      it('includes step 3 when going back from step 4 with Full Service plan', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Set Full Service plan and go to step 4
        act(() => {
          result.current.actions.setPlan('option2', 'Full Service Plan', 'Full Service');
          result.current.actions.goToStep(4);
        });

        expect(result.current.state.currentStep).toBe(4);

        // Go back - should go to step 3
        act(() => {
          result.current.actions.previousStep();
        });

        expect(result.current.state.currentStep).toBe(3); // Did not skip step 3
      });
    });

    describe('Manual Validation (validateCurrentStep)', () => {
      it('returns false and sets errors when current step is invalid', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        expect(result.current.state.currentStep).toBe(1);

        let isValid: boolean = true;
        act(() => {
          isValid = result.current.actions.validateCurrentStep();
        });

        expect(isValid).toBe(false);
        expect(result.current.state.addressError).toBeTruthy();
        expect(result.current.state.planError).toBeTruthy();
      });

      it('returns true when current step is valid', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <GetQuoteProvider>{children}</GetQuoteProvider>
        );

        const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

        // Fill required fields
        act(() => {
          result.current.actions.setAddress('123 Main St', '94101', { lat: 37.7, lng: -122.4 }, 'SF');
          result.current.actions.setPlan('option1', 'Do It Yourself Plan', 'DIY Plan');
          result.current.actions.setInsurance({ label: 'Basic', price: '10', value: 'basic' });
        });

        let isValid: boolean = false;
        act(() => {
          isValid = result.current.actions.validateCurrentStep();
        });

        expect(isValid).toBe(true);
        expect(result.current.state.addressError).toBeNull();
        expect(result.current.state.planError).toBeNull();
      });
    });
  });

  describe('Utility Actions', () => {
    it('clears all errors', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      act(() => {
        result.current.actions.clearAllErrors();
      });

      expect(result.current.state.addressError).toBeNull();
      expect(result.current.state.planError).toBeNull();
      expect(result.current.state.insuranceError).toBeNull();
      expect(result.current.state.scheduleError).toBeNull();
      expect(result.current.state.laborError).toBeNull();
      expect(result.current.state.firstNameError).toBeNull();
      expect(result.current.state.submitError).toBeNull();
    });

    it('resets form to initial state', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <GetQuoteProvider>{children}</GetQuoteProvider>
      );

      const { result } = renderHook(() => useGetQuoteContext(), { wrapper });

      // Make some changes
      act(() => {
        result.current.actions.setAddress('123 Main', '94101', { lat: 0, lng: 0 }, 'SF');
        result.current.actions.setFirstName('John');
        result.current.actions.goToStep(3);
      });

      expect(result.current.state.address).toBe('123 Main');
      expect(result.current.state.firstName).toBe('John');
      expect(result.current.state.currentStep).toBe(3);

      // Reset
      act(() => {
        result.current.actions.resetForm();
      });

      expect(result.current.state.address).toBe('');
      expect(result.current.state.firstName).toBe('');
      expect(result.current.state.currentStep).toBe(1);
    });
  });
});

