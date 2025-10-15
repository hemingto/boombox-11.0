/**
 * @fileoverview Tests for AddStorageStep1 component
 * @source boombox-11.0/src/components/features/orders/AddStorageStep1.tsx
 * 
 * TEST COVERAGE:
 * - Component rendering and form structure
 * - Address input and validation
 * - Storage unit counter functionality
 * - Plan selection (DIY vs Full Service)
 * - Insurance selection and validation
 * - Plan details accordion behavior
 * - Error state display and clearing
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Form field interactions and callbacks
 * - Semantic HTML structure with fieldsets
 * 
 * @refactor Comprehensive tests for the first step of Add Storage form
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AddStorageStep1 from '@/components/features/orders/AddStorageStep1';
import { AddStorageFormState, AddStorageFormErrors, PlanType } from '@/types/addStorage.types';
import { InsuranceOption } from '@/types/insurance';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock form components
jest.mock('@/components/forms', () => ({
  AddressInput: ({ value, onAddressChange, hasError, onClearError }: any) => (
    <div data-testid="address-input">
      <label htmlFor="address-input">Address</label>
      <input
        id="address-input"
        value={value}
        onChange={(e) => onAddressChange(
          e.target.value,
          '12345', 
          { lat: 40.7128, lng: -74.0060 }, 
          'New York'
        )}
        aria-invalid={hasError}
      />
      {hasError && <button onClick={onClearError}>Clear Error</button>}
    </div>
  ),
  StorageUnitCounter: ({ onCountChange, initialCount }: any) => (
    <div data-testid="storage-unit-counter">
      <span>Count: {initialCount}</span>
      <button onClick={() => onCountChange(initialCount + 1, `${initialCount + 1} storage units`)}>
        Increase
      </button>
    </div>
  ),
  RadioCards: ({ id, title, icon, checked, onChange, hasError, onClearError }: any) => (
    <div data-testid={`radio-card-${id}`}>
      {icon}
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={() => onChange(id, title)}
        aria-invalid={hasError}
      />
      <label htmlFor={id}>{title}</label>
      {hasError && <button onClick={onClearError}>Clear Error</button>}
    </div>
  ),
  InsuranceInput: ({ value, selectedInsurance, onInsuranceChange, hasError, onClearError }: any) => (
    <div data-testid="insurance-input">
      <label htmlFor="insurance-select">Insurance Coverage</label>
      <select
        id="insurance-select"
        value={selectedInsurance?.value || value || ''}
        onChange={(e) => {
          const option = e.target.value ? { id: '1', value: e.target.value, name: 'Test Insurance', price: 15 } : null;
          onInsuranceChange(option);
        }}
        aria-invalid={hasError}
      >
        <option value="">No Insurance</option>
        <option value="basic">Basic Coverage</option>
        <option value="premium">Premium Coverage</option>
      </select>
      {hasError && <button onClick={onClearError}>Clear Error</button>}
    </div>
  ),
  LaborPlanDetails: () => (
    <div data-testid="labor-plan-details">
      <h3>Plan Details</h3>
      <p>DIY Plan: Load your own items</p>
      <p>Full Service: Professional movers help you</p>
    </div>
  )
}));

// Mock icons
jest.mock('@/components/icons', () => ({
  MovingHelpIcon: ({ className, hasError }: any) => (
    <div data-testid="moving-help-icon" className={className} aria-invalid={hasError}>
      Moving Help Icon
    </div>
  ),
  FurnitureIcon: ({ className, hasError }: any) => (
    <div data-testid="furniture-icon" className={className} aria-invalid={hasError}>
      Furniture Icon
    </div>
  )
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Sample form state and props
const mockFormState: AddStorageFormState = {
  addressInfo: {
    address: '123 Test St',
    zipCode: '12345',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    cityName: 'New York'
  },
  storageUnit: {
    count: 2,
    text: '2 storage units'
  },
  selectedPlan: 'option1',
  selectedPlanName: 'Do It Yourself Plan',
  planType: PlanType.DIY,
  selectedLabor: null,
  selectedInsurance: null,
  scheduling: {
    scheduledDate: null,
    scheduledTimeSlot: null
  },
  pricing: {
    loadingHelpPrice: '0',
    loadingHelpDescription: 'Free',
    monthlyStorageRate: 89,
    monthlyInsuranceRate: 0,
    calculatedTotal: 89
  },
  description: '',
  isPlanDetailsVisible: false,
  contentHeight: 0
};

const mockErrors: AddStorageFormErrors = {};

const mockProps = {
  formState: mockFormState,
  errors: mockErrors,
  onAddressChange: jest.fn(),
  onStorageUnitChange: jest.fn(),
  onPlanChange: jest.fn(),
  onInsuranceChange: jest.fn(),
  onTogglePlanDetails: jest.fn(),
  onClearError: jest.fn(),
  contentRef: { current: null }
};

describe('AddStorageStep1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<AddStorageStep1 {...mockProps} />);
      expect(screen.getByText('Add storage unit')).toBeInTheDocument();
    });

    it('renders with proper semantic HTML structure', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      // Check for header
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add storage unit');
      
      // Check for fieldsets
      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets).toHaveLength(4); // Address, Storage Units, Plan Selection, Insurance
    });

    it('renders all form sections', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      expect(screen.getByTestId('address-input')).toBeInTheDocument();
      expect(screen.getByTestId('storage-unit-counter')).toBeInTheDocument();
      expect(screen.getByTestId('radio-card-option1')).toBeInTheDocument();
      expect(screen.getByTestId('radio-card-option2')).toBeInTheDocument();
      expect(screen.getByTestId('insurance-input')).toBeInTheDocument();
    });

    it('renders storage calculator link with proper accessibility', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const calculatorLink = screen.getByRole('link', { name: 'Open storage calculator in new tab' });
      expect(calculatorLink).toHaveAttribute('href', '/storage-calculator');
      expect(calculatorLink).toHaveAttribute('target', '_blank');
      expect(calculatorLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders plan details toggle button with proper accessibility', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: 'Toggle plan details visibility' });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveAttribute('aria-controls', 'plan-details-content');
    });
  });

  describe('Address Input', () => {
    it('displays current address value', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const addressInput = screen.getByTestId('address-input').querySelector('input');
      expect(addressInput).toHaveValue('123 Test St');
    });

    it('calls onAddressChange when address is updated', async () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const addressInput = screen.getByTestId('address-input').querySelector('input');
      await userEvent.type(addressInput!, 'X');
      
      // Check that the function was called with the expected structure
      expect(mockProps.onAddressChange).toHaveBeenCalled();
      const lastCall = mockProps.onAddressChange.mock.calls[mockProps.onAddressChange.mock.calls.length - 1][0];
      expect(lastCall).toHaveProperty('address');
      expect(lastCall).toHaveProperty('zipCode', '12345');
      expect(lastCall).toHaveProperty('coordinates');
      expect(lastCall).toHaveProperty('cityName', 'New York');
      expect(lastCall.coordinates).toEqual({ lat: 40.7128, lng: -74.0060 });
    });

    it('displays address error with proper accessibility', () => {
      const propsWithError = {
        ...mockProps,
        errors: { addressError: 'Please enter a valid address' }
      };
      
      render(<AddStorageStep1 {...propsWithError} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Please enter a valid address');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });

    it('clears address error when clear button is clicked', async () => {
      const propsWithError = {
        ...mockProps,
        errors: { addressError: 'Please enter a valid address' }
      };
      
      render(<AddStorageStep1 {...propsWithError} />);
      
      const clearButton = screen.getByText('Clear Error');
      await userEvent.click(clearButton);
      
      expect(mockProps.onClearError).toHaveBeenCalledWith('addressError');
    });
  });

  describe('Storage Unit Counter', () => {
    it('displays current storage unit count', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });

    it('calls onStorageUnitChange when count is updated', async () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const increaseButton = screen.getByText('Increase');
      await userEvent.click(increaseButton);
      
      expect(mockProps.onStorageUnitChange).toHaveBeenCalledWith(3, '3 storage units');
    });
  });

  describe('Plan Selection', () => {
    it('displays both plan options with icons', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      expect(screen.getByText("No, I'll load my storage unit myself")).toBeInTheDocument();
      expect(screen.getByText('Yes, I would love some help loading')).toBeInTheDocument();
      expect(screen.getByTestId('furniture-icon')).toBeInTheDocument();
      expect(screen.getByTestId('moving-help-icon')).toBeInTheDocument();
    });

    it('shows DIY plan as selected by default', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const diyRadio = screen.getByTestId('radio-card-option1').querySelector('input');
      const fullServiceRadio = screen.getByTestId('radio-card-option2').querySelector('input');
      
      expect(diyRadio).toBeChecked();
      expect(fullServiceRadio).not.toBeChecked();
    });

    it('calls onPlanChange when plan is selected', async () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const fullServiceRadio = screen.getByTestId('radio-card-option2').querySelector('input');
      await userEvent.click(fullServiceRadio!);
      
      expect(mockProps.onPlanChange).toHaveBeenCalledWith(
        'option2',
        'Yes, I would love some help loading',
        'Yes, I would love some help loading'
      );
    });

    it('displays plan error with proper accessibility', () => {
      const propsWithError = {
        ...mockProps,
        errors: { planError: 'Please select a plan' }
      };
      
      render(<AddStorageStep1 {...propsWithError} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Please select a plan');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });

    it('shows error state on icons when plan has error', () => {
      const propsWithError = {
        ...mockProps,
        errors: { planError: 'Please select a plan' }
      };
      
      render(<AddStorageStep1 {...propsWithError} />);
      
      expect(screen.getByTestId('furniture-icon')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('moving-help-icon')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Plan Details Accordion', () => {
    it('toggles plan details visibility', async () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const toggleButton = screen.getByRole('button', { name: 'Toggle plan details visibility' });
      await userEvent.click(toggleButton);
      
      expect(mockProps.onTogglePlanDetails).toHaveBeenCalled();
    });

    it('shows plan details when visible', () => {
      const propsWithVisibleDetails = {
        ...mockProps,
        formState: {
          ...mockFormState,
          isPlanDetailsVisible: true
        }
      };
      
      render(<AddStorageStep1 {...propsWithVisibleDetails} />);
      
      const toggleButton = screen.getByRole('button', { name: 'Toggle plan details visibility' });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      
      const detailsContainer = screen.getByRole('region', { hidden: true });
      expect(detailsContainer).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByTestId('labor-plan-details')).toBeInTheDocument();
    });

    it('hides plan details when not visible', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const detailsContainer = screen.getByRole('region', { hidden: true });
      expect(detailsContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Insurance Selection', () => {
    it('displays insurance options', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      expect(insuranceSelect).toBeInTheDocument();
      expect(screen.getByText('No Insurance')).toBeInTheDocument();
      expect(screen.getByText('Basic Coverage')).toBeInTheDocument();
    });

    it('calls onInsuranceChange when insurance is selected', async () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      await userEvent.selectOptions(insuranceSelect!, 'basic');
      
      expect(mockProps.onInsuranceChange).toHaveBeenCalledWith({
        id: '1',
        value: 'basic',
        name: 'Test Insurance',
        price: 15
      });
    });

    it('displays insurance error with proper accessibility', () => {
      const propsWithError = {
        ...mockProps,
        errors: { insuranceError: 'Please select insurance coverage' }
      };
      
      render(<AddStorageStep1 {...propsWithError} />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Please select insurance coverage');
      expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Form Structure and Accessibility', () => {
    it('uses proper fieldset and legend structure', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      // Address fieldset
      expect(screen.getByText('Where are we delivering your Boombox?')).toBeInTheDocument();
      
      // Plan selection fieldset
      expect(screen.getByText('Do you need help loading your Boombox?')).toBeInTheDocument();
      
      // Insurance fieldset
      expect(screen.getByText('Do you need additional insurance coverage?')).toBeInTheDocument();
    });

    it('has proper radiogroup for plan selection', () => {
      render(<AddStorageStep1 {...mockProps} />);
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'plan-selection-legend');
    });

    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(<AddStorageStep1 {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Error Handling', () => {
    it('clears errors when clear buttons are clicked', async () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          addressError: 'Address error',
          planError: 'Plan error',
          insuranceError: 'Insurance error'
        }
      };
      
      render(<AddStorageStep1 {...propsWithErrors} />);
      
      const clearButtons = screen.getAllByText('Clear Error');
      
      for (const button of clearButtons) {
        await userEvent.click(button);
      }
      
      expect(mockProps.onClearError).toHaveBeenCalledWith('addressError');
      expect(mockProps.onClearError).toHaveBeenCalledWith('planError');
      expect(mockProps.onClearError).toHaveBeenCalledWith('insuranceError');
    });

    it('shows error states on form controls', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          addressError: 'Address error',
          planError: 'Plan error',
          insuranceError: 'Insurance error'
        }
      };
      
      render(<AddStorageStep1 {...propsWithErrors} />);
      
      const addressInput = screen.getByTestId('address-input').querySelector('input');
      const planRadio1 = screen.getByTestId('radio-card-option1').querySelector('input');
      const planRadio2 = screen.getByTestId('radio-card-option2').querySelector('input');
      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      
      expect(addressInput).toHaveAttribute('aria-invalid', 'true');
      expect(planRadio1).toHaveAttribute('aria-invalid', 'true');
      expect(planRadio2).toHaveAttribute('aria-invalid', 'true');
      expect(insuranceSelect).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Content Reference', () => {
    it('handles content ref for accordion animation', () => {
      const mockRef = { current: document.createElement('div') };
      const propsWithRef = {
        ...mockProps,
        contentRef: mockRef
      };
      
      render(<AddStorageStep1 {...propsWithRef} />);
      
      // Component should render without errors with ref
      expect(screen.getByText('Add storage unit')).toBeInTheDocument();
    });
  });

  describe('Insurance Value Handling', () => {
    it('handles null insurance value', () => {
      const propsWithNullInsurance = {
        ...mockProps,
        formState: {
          ...mockFormState,
          selectedInsurance: null
        }
      };
      
      render(<AddStorageStep1 {...propsWithNullInsurance} />);
      
      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      expect(insuranceSelect).toHaveValue('');
    });

    it('handles insurance with value', () => {
      const mockInsurance: InsuranceOption = {
        id: '1',
        value: 'premium',
        name: 'Premium Coverage',
        price: 25,
        coverage: '$5000'
      };
      
      const propsWithInsurance = {
        ...mockProps,
        formState: {
          ...mockFormState,
          selectedInsurance: mockInsurance
        }
      };
      
      render(<AddStorageStep1 {...propsWithInsurance} />);
      
      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      expect(insuranceSelect).toHaveValue('premium');
    });
  });
});
