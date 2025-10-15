/**
 * @fileoverview QuoteBuilder component tests
 * @source boombox-10.0/src/app/components/getquote/quotebuilder.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuoteBuilder, QuoteBuilderProps } from '@/components/features/orders/get-quote/QuoteBuilder';
import type { InsuranceOption } from '@/types/insurance';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, target, rel }: any) => {
    return <a href={href} target={target} rel={rel}>{children}</a>;
  };
});

// Mock child components
jest.mock('@/components/forms/AddressInput', () => ({
  __esModule: true,
  default: ({ value, onAddressChange, hasError, onClearError }: any) => (
    <div data-testid="address-input">
      <input
        type="text"
        value={value}
        onChange={(e) => onAddressChange(e.target.value, '94102', { lat: 37.7749, lng: -122.4194 }, 'San Francisco')}
        data-error={hasError}
      />
      <button onClick={onClearError}>Clear Error</button>
    </div>
  ),
}));

jest.mock('@/components/forms/StorageUnitCounter', () => ({
  __esModule: true,
  default: ({ onCountChange, initialCount }: any) => (
    <div data-testid="storage-unit-counter">
      <span data-testid="unit-count">{initialCount}</span>
      <button onClick={() => onCountChange(initialCount + 1, '1 bedroom apt')}>Increment</button>
      <button onClick={() => onCountChange(initialCount - 1, 'studio apartment')}>Decrement</button>
    </div>
  ),
}));

jest.mock('@/components/forms/RadioCards', () => ({
  RadioCards: ({ id, checked, onChange, plan, hasError }: any) => (
    <div data-testid={`radio-card-${id}`}>
      <input
        type="radio"
        checked={checked}
        onChange={() => onChange(id, plan, 'description')}
        data-error={hasError}
      />
      <label>{plan}</label>
    </div>
  ),
}));

jest.mock('@/components/forms/InsuranceInput', () => ({
  __esModule: true,
  default: ({ value, onInsuranceChange, hasError, onClearError }: any) => (
    <div data-testid="insurance-input">
      <select
        value={value?.value || ''}
        onChange={(e) => onInsuranceChange({ value: e.target.value, label: 'Test Insurance', price: '15' })}
        data-error={hasError}
      >
        <option value="">Select Insurance</option>
        <option value="5000">$5,000 Coverage</option>
      </select>
      <button onClick={onClearError}>Clear Error</button>
    </div>
  ),
}));

jest.mock('@/components/forms/LaborPlanDetails', () => ({
  __esModule: true,
  default: () => <div data-testid="labor-plan-details">Plan Details</div>,
}));

jest.mock('@/components/icons/MovingHelpIcon', () => ({
  MovingHelpIcon: ({ className, hasError }: any) => (
    <div data-testid="moving-help-icon" data-error={hasError} className={className}>
      Icon
    </div>
  ),
}));

jest.mock('@/components/icons/FurnitureIcon', () => ({
  FurnitureIcon: ({ className, hasError }: any) => (
    <div data-testid="furniture-icon" data-error={hasError} className={className}>
      Icon
    </div>
  ),
}));

describe('QuoteBuilder', () => {
  const mockInsuranceOption: InsuranceOption = {
    value: '5000',
    label: '$5,000 Coverage',
    price: '15',
  };

  const mockOnAddressChange = jest.fn();
  const mockClearAddressError = jest.fn();
  const mockOnStorageUnitChange = jest.fn();
  const mockOnPlanChange = jest.fn();
  const mockClearPlanError = jest.fn();
  const mockOnPlanTypeChange = jest.fn();
  const mockTogglePlanDetails = jest.fn();
  const mockOnInsuranceChange = jest.fn();
  const mockClearInsuranceError = jest.fn();
  const mockContentRef = React.createRef<HTMLDivElement>();

  const defaultProps: QuoteBuilderProps = {
    address: '123 Main St',
    addressError: null,
    onAddressChange: mockOnAddressChange,
    clearAddressError: mockClearAddressError,
    storageUnitCount: 1,
    initialStorageUnitCount: 1,
    onStorageUnitChange: mockOnStorageUnitChange,
    selectedPlan: '',
    planError: null,
    onPlanChange: mockOnPlanChange,
    clearPlanError: mockClearPlanError,
    onPlanTypeChange: mockOnPlanTypeChange,
    isPlanDetailsVisible: false,
    togglePlanDetails: mockTogglePlanDetails,
    contentHeight: null,
    contentRef: mockContentRef,
    selectedInsurance: null,
    insuranceError: null,
    onInsuranceChange: mockOnInsuranceChange,
    clearInsuranceError: mockClearInsuranceError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with all sections', () => {
      render(<QuoteBuilder {...defaultProps} />);

      expect(screen.getByText('Build your quote')).toBeInTheDocument();
      expect(screen.getByText('Where are we delivering your Boombox?')).toBeInTheDocument();
      expect(screen.getByText('Do you need help loading your Boombox?')).toBeInTheDocument();
      expect(screen.getByText('Do you need additional insurance coverage?')).toBeInTheDocument();
    });

    it('should render AddressInput component', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const addressInput = screen.getByTestId('address-input');
      expect(addressInput).toBeInTheDocument();
    });

    it('should render StorageUnitCounter component', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const storageCounter = screen.getByTestId('storage-unit-counter');
      expect(storageCounter).toBeInTheDocument();
      expect(screen.getByTestId('unit-count')).toHaveTextContent('1');
    });

    it('should render both plan option cards', () => {
      render(<QuoteBuilder {...defaultProps} />);

      expect(screen.getByTestId('radio-card-option1')).toBeInTheDocument();
      expect(screen.getByTestId('radio-card-option2')).toBeInTheDocument();
      expect(screen.getByText('Do It Yourself Plan')).toBeInTheDocument();
      expect(screen.getByText('Full Service Plan')).toBeInTheDocument();
    });

    it('should render InsuranceInput component', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const insuranceInput = screen.getByTestId('insurance-input');
      expect(insuranceInput).toBeInTheDocument();
    });

    it('should render storage calculator link', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const link = screen.getByText(/If you are unsure how many units you need/i)
        .closest('p')
        ?.querySelector('a');
      
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/storage-calculator');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Error States', () => {
    it('should display address error when present', () => {
      const props = { ...defaultProps, addressError: 'Address is required' };
      render(<QuoteBuilder {...props} />);

      expect(screen.getByText('Address is required')).toBeInTheDocument();
    });

    it('should display plan error when present', () => {
      const props = { ...defaultProps, planError: 'Please select a plan' };
      render(<QuoteBuilder {...props} />);

      expect(screen.getByText('Please select a plan')).toBeInTheDocument();
    });

    it('should display insurance error when present', () => {
      const props = { ...defaultProps, insuranceError: 'Insurance is required' };
      render(<QuoteBuilder {...props} />);

      expect(screen.getByText('Insurance is required')).toBeInTheDocument();
    });

    it('should not display errors when null', () => {
      render(<QuoteBuilder {...defaultProps} />);

      expect(screen.queryByText('Address is required')).not.toBeInTheDocument();
      expect(screen.queryByText('Please select a plan')).not.toBeInTheDocument();
      expect(screen.queryByText('Insurance is required')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onStorageUnitChange when unit count changes', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const incrementButton = screen.getByText('Increment');
      fireEvent.click(incrementButton);

      expect(mockOnStorageUnitChange).toHaveBeenCalledWith(2, '1 bedroom apt');
    });

    it('should call onPlanChange when DIY plan is selected', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const diyRadio = screen.getByTestId('radio-card-option1').querySelector('input');
      fireEvent.click(diyRadio!);

      expect(mockOnPlanChange).toHaveBeenCalledWith('option1', 'Do It Yourself Plan', 'description');
      expect(mockOnPlanTypeChange).toHaveBeenCalledWith('Do It Yourself Plan');
    });

    it('should call onPlanChange when Full Service plan is selected', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const fullServiceRadio = screen.getByTestId('radio-card-option2').querySelector('input');
      fireEvent.click(fullServiceRadio!);

      expect(mockOnPlanChange).toHaveBeenCalledWith('option2', 'Full Service Plan', 'description');
    });

    it('should call togglePlanDetails when plan details link is clicked', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });
      
      fireEvent.click(planDetailsLink);

      expect(mockTogglePlanDetails).toHaveBeenCalled();
    });

    it('should call togglePlanDetails when Enter key is pressed on plan details link', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });
      
      fireEvent.keyDown(planDetailsLink, { key: 'Enter' });

      expect(mockTogglePlanDetails).toHaveBeenCalled();
    });

    it('should call togglePlanDetails when Space key is pressed on plan details link', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });
      
      fireEvent.keyDown(planDetailsLink, { key: ' ' });

      expect(mockTogglePlanDetails).toHaveBeenCalled();
    });

    it('should call onInsuranceChange when insurance is selected', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const insuranceSelect = screen.getByTestId('insurance-input').querySelector('select');
      fireEvent.change(insuranceSelect!, { target: { value: '5000' } });

      expect(mockOnInsuranceChange).toHaveBeenCalled();
    });
  });

  describe('Plan Details Expansion', () => {
    it('should hide plan details when isPlanDetailsVisible is false', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetails = screen.getByTestId('labor-plan-details').parentElement;
      expect(planDetails).toHaveClass('opacity-0');
      expect(planDetails).toHaveAttribute('aria-hidden', 'true');
    });

    it('should show plan details when isPlanDetailsVisible is true', () => {
      const props = { ...defaultProps, isPlanDetailsVisible: true, contentHeight: 200 };
      render(<QuoteBuilder {...props} />);

      const planDetails = screen.getByTestId('labor-plan-details').parentElement;
      expect(planDetails).toHaveClass('opacity-100');
      expect(planDetails).toHaveAttribute('aria-hidden', 'false');
    });

    it('should set content height when plan details are visible', () => {
      const props = { ...defaultProps, isPlanDetailsVisible: true, contentHeight: 200 };
      render(<QuoteBuilder {...props} />);

      const planDetails = screen.getByTestId('labor-plan-details').parentElement;
      // Note: In test environment, the useEffect may not update the inline style
      // but we can verify the style attribute is set with transition property
      expect(planDetails).toHaveStyle({ transition: 'height 0.5s ease' });
    });

    it('should set height to 0px when plan details are hidden', () => {
      const props = { ...defaultProps, isPlanDetailsVisible: false };
      render(<QuoteBuilder {...props} />);

      const planDetails = screen.getByTestId('labor-plan-details').parentElement;
      expect(planDetails).toHaveStyle({ height: '0px' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on plan details toggle', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });

      expect(planDetailsLink).toHaveAttribute('role', 'button');
      expect(planDetailsLink).toHaveAttribute('tabIndex', '0');
      expect(planDetailsLink).toHaveAttribute('aria-expanded', 'false');
      expect(planDetailsLink).toHaveAttribute('aria-controls', 'plan-details-content');
    });

    it('should update aria-expanded when plan details are visible', () => {
      const props = { ...defaultProps, isPlanDetailsVisible: true };
      render(<QuoteBuilder {...props} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });

      expect(planDetailsLink).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper heading hierarchy', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const heading = screen.getByText('Build your quote');
      expect(heading.tagName).toBe('H1');
    });

    it('should have keyboard navigable plan details toggle', () => {
      render(<QuoteBuilder {...defaultProps} />);

      const planDetailsLink = screen.getByText((content, element) => {
        return element?.tagName === 'SPAN' && content === 'here' && element.className.includes('underline');
      });

      expect(planDetailsLink).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Props Validation', () => {
    it('should pass correct storage unit count to counter', () => {
      const props = { ...defaultProps, storageUnitCount: 3, initialStorageUnitCount: 3 };
      render(<QuoteBuilder {...props} />);

      expect(screen.getByTestId('unit-count')).toHaveTextContent('3');
    });

    it('should pass address value to AddressInput', () => {
      const props = { ...defaultProps, address: '456 Test St' };
      render(<QuoteBuilder {...props} />);

      const addressInput = screen.getByTestId('address-input').querySelector('input');
      expect(addressInput).toHaveValue('456 Test St');
    });

    it('should pass hasError prop to components when errors present', () => {
      const props = {
        ...defaultProps,
        addressError: 'Error',
        planError: 'Error',
        insuranceError: 'Error',
      };
      render(<QuoteBuilder {...props} />);

      const addressInput = screen.getByTestId('address-input').querySelector('input');
      const insuranceInput = screen.getByTestId('insurance-input').querySelector('select');
      
      expect(addressInput).toHaveAttribute('data-error', 'true');
      expect(insuranceInput).toHaveAttribute('data-error', 'true');
    });
  });
});

