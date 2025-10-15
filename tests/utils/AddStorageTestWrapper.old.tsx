/**
 * @fileoverview Test wrapper for AddStorageForm with all required providers and mocks
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock all form components to prevent complex dependency issues
jest.mock('@/components/forms', () => ({
  AddressInput: ({ onAddressChange, error }: any) => {
    const [address, setAddress] = React.useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAddress(value);
      onAddressChange?.({
        address: value,
        zipCode: '12345',
        coordinates: null,
        cityName: 'Test City'
      });
    };
    
    return (
      <div>
        <input 
          role="textbox" 
          aria-label="address"
          value={address}
          onChange={handleChange}
        />
        {error && <div role="alert">{error}</div>}
      </div>
    );
  },
  StorageUnitCounter: ({ count = 1, onCountChange }: any) => {
    const [currentCount, setCurrentCount] = React.useState(count);
    
    const handleIncrease = () => {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);
      onCountChange?.(newCount, '2 bedroom apt');
    };
    
    return (
      <div>
        <span>{currentCount} units</span>
        <button 
          role="button" 
          aria-label="increase units"
          onClick={handleIncrease}
        >
          +
        </button>
      </div>
    );
  },
  RadioCards: ({ options, selectedValue, onSelectionChange, error }: any) => {
    // Provide default options if none are passed
    const defaultOptions = [
      { id: 'option1', name: 'No, I can load myself', planType: 'DIY' },
      { id: 'option2', name: 'Yes, I need help loading', planType: 'FULL_SERVICE' }
    ];
    const radioOptions = options || defaultOptions;
    const [selected, setSelected] = React.useState(selectedValue);
    
    const handleChange = (optionId: string, name: string, planType: string) => {
      setSelected(optionId);
      onSelectionChange?.(optionId, name, planType);
    };
    
    return (
      <div>
        {radioOptions.map((option: any) => (
          <label key={option.id}>
            <input
              type="radio"
              role="radio"
              aria-label={option.name}
              checked={selected === option.id}
              onChange={() => handleChange(option.id, option.name, option.planType)}
            />
            {option.name}
          </label>
        ))}
        {error && <div role="alert">{error}</div>}
      </div>
    );
  },
  InsuranceInput: ({ onInsuranceChange, error }: any) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <div>
        <select 
          role="combobox" 
          aria-label="insurance"
          aria-expanded={isOpen}
          aria-controls="insurance-options"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(e) => onInsuranceChange?.({
            label: e.target.value,
            value: e.target.value
          })}
        >
          <option value="">Select insurance</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
        </select>
        {error && <div role="alert">{error}</div>}
      </div>
    );
  },
  LaborPlanDetails: () => <div>Labor Plan Details</div>,
  Scheduler: ({ onDateTimeSelected, goBackToStep1, hasError, errorMessage }: any) => (
    <div>
      <h2>Schedule Appointment</h2>
      <button 
        role="button" 
        aria-label="december 1"
        onClick={() => onDateTimeSelected?.(new Date('2024-12-01'), '10:00 AM - 12:00 PM')}
      >
        December 1
      </button>
      <button 
        role="button" 
        aria-label="10:00 AM - 12:00 PM"
        onClick={() => onDateTimeSelected?.(new Date('2024-12-01'), '10:00 AM - 12:00 PM')}
      >
        10:00 AM - 12:00 PM
      </button>
      <button role="button" aria-label="confirm">Confirm</button>
      <button role="button" aria-label="back" onClick={goBackToStep1}>Back</button>
      {hasError && <div role="alert">{errorMessage}</div>}
    </div>
  ),
}));

// Mock MyQuote component
jest.mock('@/components/features/orders', () => ({
  MyQuote: ({ title = 'New storage quote', handleSubmit, currentStep, buttonTexts }: any) => {
    const buttonText = buttonTexts?.[currentStep] || 'Schedule';
    const buttonLabel = buttonText === 'Schedule' ? 'Schedule Appointment' : buttonText;
    
    return (
      <div>
        <h2>Quote Summary</h2>
        <p>{title}</p>
        <button 
          role="button" 
          aria-label={buttonLabel}
          onClick={handleSubmit}
        >
          {buttonText}
        </button>
      </div>
    );
  },
  ChooseLabor: ({ onLaborSelect, selectedLabor, clearLaborError, laborError }: any) => (
    <div>
      <h2>Choose Labor</h2>
      <button 
        role="button" 
        aria-label="professional movers"
        onClick={() => onLaborSelect?.('1', '189', 'Professional Movers', 'team-123')}
      >
        Professional Movers
      </button>
      <button role="button" aria-label="confirm">Confirm</button>
      {laborError && (
        <div>
          <div role="alert">{laborError}</div>
          <button role="button" aria-label="clear error" onClick={clearLaborError}>
            Clear Error
          </button>
        </div>
      )}
    </div>
  ),
}));

// Mock AddStorageConfirmAppointment
jest.mock('@/components/features/orders/AddStorageConfirmAppointment', () => {
  return function MockAddStorageConfirmAppointment({ onGoBack }: any) {
    return (
      <div>
        <h2>Confirm appointment</h2>
        <textarea 
          role="textbox" 
          aria-label="location details"
          placeholder="Add location details..."
        />
        <button role="button" aria-label="submit">Submit</button>
        <button role="button" aria-label="back" onClick={onGoBack}>Back</button>
      </div>
    );
  };
});

// Mock LoadingOverlay
jest.mock('@/components/ui/primitives/LoadingOverlay', () => ({
  LoadingOverlay: ({ visible, message }: any) => 
    visible ? (
      <div role="status">
        <div>{message}</div>
      </div>
    ) : null,
}));

// Mock icons
jest.mock('@/components/icons', () => ({
  HelpIcon: ({ className, ...props }: any) => <div className={className} {...props}>Help Icon</div>,
  MovingHelpIcon: () => <div>Moving Help Icon</div>,
  FurnitureIcon: () => <div>Furniture Icon</div>,
}));

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
  return <>{children}</>;
}

// Custom render function
function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

export { customRender as render };
export * from '@testing-library/react';
