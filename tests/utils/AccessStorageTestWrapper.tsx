/**
 * @fileoverview Test wrapper for AccessStorageForm components with all required providers
 * Provides proper context and mocks for AccessStorage workflow tests
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AccessStorageProvider } from '@/components/features/orders/AccessStorageProvider';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock storage units hook
jest.mock('@/hooks/useStorageUnits', () => ({
  useStorageUnits: () => ({
    storageUnits: [],
    isLoading: false,
    error: null,
    hasStorageUnits: false,
    getAllStorageUnitIds: () => [],
  }),
}));

// Mock appointment data hook for edit mode
jest.mock('@/hooks/useAppointmentData', () => ({
  useAppointmentData: (appointmentId?: string) => ({
    appointmentData: appointmentId ? {
      id: parseInt(appointmentId),
      userId: 1,
      appointmentType: 'Storage Unit Access',
      address: '123 Test St',
      zipCode: '12345',
      date: new Date('2024-12-01'),
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      numberOfUnits: 2,
      description: 'Test appointment',
    } : null,
    isLoading: false,
    error: null,
  }),
}));

// Mock form persistence hook
jest.mock('@/hooks/useFormPersistence', () => ({
  useFormPersistence: () => ({
    persistForm: jest.fn(),
    clearPersistedForm: jest.fn(),
  }),
}));

// Mock form components
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
  RadioCards: ({ options, selectedValue, onSelectionChange, error }: any) => {
    const [selected, setSelected] = React.useState(selectedValue);
    
    const handleChange = (optionId: string, name: string) => {
      setSelected(optionId);
      onSelectionChange?.(optionId, name);
    };
    
    return (
      <div>
        {options?.map((option: any) => (
          <label key={option.id}>
            <input
              type="radio"
              role="radio"
              aria-label={option.name}
              checked={selected === option.id}
              onChange={() => handleChange(option.id, option.name)}
            />
            {option.name}
          </label>
        ))}
        {error && <div role="alert">{error}</div>}
      </div>
    );
  },
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
  MyQuote: ({ title = 'Access storage quote', handleSubmit, currentStep, buttonTexts }: any) => {
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
}));

// Mock LoadingOverlay
jest.mock('@/components/ui/primitives/LoadingOverlay', () => ({
  LoadingOverlay: ({ visible, message }: any) => 
    visible ? (
      <div role="status">
        <div>{message}</div>
      </div>
    ) : null,
}));

// Mock Modal
jest.mock('@/components/ui', () => ({
  Modal: ({ open, onClose, title, children }: any) => 
    open ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} aria-label="close">Close</button>
      </div>
    ) : null,
}));

// Mock icons
jest.mock('@/components/icons', () => ({
  HelpIcon: ({ className, ...props }: any) => <div className={className} {...props}>Help Icon</div>,
}));

// Test wrapper component that provides AccessStorageProvider
interface TestWrapperProps {
  children: React.ReactNode;
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialZipCode?: string;
}

function TestWrapper({ children, mode = 'create', appointmentId, initialZipCode = '12345' }: TestWrapperProps) {
  return (
    <AccessStorageProvider
      mode={mode}
      appointmentId={appointmentId}
      initialZipCode={initialZipCode}
      enablePersistence={false} // Disable persistence in tests
    >
      {children}
    </AccessStorageProvider>
  );
}

// Custom render function with AccessStorageProvider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mode?: 'create' | 'edit';
  appointmentId?: string;
  initialZipCode?: string;
}

function customRender(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { mode, appointmentId, initialZipCode, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper mode={mode} appointmentId={appointmentId} initialZipCode={initialZipCode}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
}

export { customRender as render };
export * from '@testing-library/react';

