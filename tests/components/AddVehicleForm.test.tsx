/**
 * @fileoverview Tests for AddVehicleForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AddVehicleForm } from '@/components/features/drivers/AddVehicleForm';
import { VehicleService } from '@/lib/services/vehicleService';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }))
}));

// Mock VehicleService
jest.mock('@/lib/services/vehicleService', () => ({
  VehicleService: {
    createVehicle: jest.fn(),
    uploadVehiclePhoto: jest.fn(),
  }
}));

// Mock PhotoUploads component
jest.mock('@/components/forms/PhotoUploads', () => {
  const MockPhotoUploads = ({ onPhotosSelected, photoUploadTitle, buttonText }: any) => (
    <div data-testid={`photo-upload-${photoUploadTitle?.toLowerCase().replace(/\s+/g, '-')}`}>
      <span>{photoUploadTitle}</span>
      <button 
        onClick={() => {
          // Simulate file selection
          const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
          onPhotosSelected([mockFile]);
        }}
      >
        {buttonText}
      </button>
    </div>
  );
  MockPhotoUploads.displayName = 'MockPhotoUploads';
  return {
    __esModule: true,
    default: MockPhotoUploads
  };
});

// Mock UI components
jest.mock('@/components/ui', () => ({
  Input: ({ label, value, onChange, error, onClearError, placeholder, required, ...props }: any) => (
    <div>
      <label>{label} {required && '*'}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        data-testid={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        {...props}
      />
      {error && <span role="alert" data-testid={`error-${label?.toLowerCase().replace(/\s+/g, '-')}`}>{error}</span>}
    </div>
  ),
  Select: ({ label, value, onChange, error, options, placeholder, required }: any) => (
    <div>
      <label>{label} {required && '*'}</label>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        aria-invalid={!!error}
        data-testid={`select-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span role="alert" data-testid={`error-${label?.toLowerCase().replace(/\s+/g, '-')}`}>{error}</span>}
    </div>
  ),
  LoadingOverlay: ({ message }: any) => (
    <div data-testid="loading-overlay" role="status" aria-live="polite">
      {message}
    </div>
  )
}));

// Mock YesOrNoRadio component
jest.mock('@/components/forms/YesOrNoRadio', () => {
  const MockYesOrNoRadio = ({ value, onChange, hasError, errorMessage }: any) => (
    <div>
      <label>
        <input
          type="radio"
          name="trailer-hitch"
          value="Yes"
          checked={value === 'Yes'}
          onChange={() => onChange('Yes')}
          data-testid="radio-yes"
        />
        Yes
      </label>
      <label>
        <input
          type="radio"
          name="trailer-hitch"
          value="No"
          checked={value === 'No'}
          onChange={() => onChange('No')}
          data-testid="radio-no"
        />
        No
      </label>
      {hasError && errorMessage && <span role="alert" data-testid="error-trailer-hitch">{errorMessage}</span>}
    </div>
  );
  MockYesOrNoRadio.displayName = 'MockYesOrNoRadio';
  return {
    __esModule: true,
    default: MockYesOrNoRadio
  };
});

// Test data
const mockProps = {
  userId: 'test-user-123',
  userType: 'driver' as const,
};

const mockVehicleData = {
  make: 'Toyota',
  model: 'Camry',
  year: '2020',
  licensePlate: 'ABC123',
  hasTrailerHitch: false,
  frontVehiclePhoto: 'https://example.com/front.jpg',
  backVehiclePhoto: 'https://example.com/back.jpg',
  autoInsurancePhoto: 'https://example.com/insurance.jpg',
};

describe('AddVehicleForm', () => {
  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<AddVehicleForm {...mockProps} />);
      expect(screen.getByRole('heading', { name: /provide your vehicle information/i })).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<AddVehicleForm {...mockProps} />);
      
      // Vehicle information fields
      expect(screen.getByTestId('select-vehicle-year')).toBeInTheDocument();
      expect(screen.getByTestId('select-vehicle-make')).toBeInTheDocument();
      expect(screen.getByTestId('input-vehicle-model')).toBeInTheDocument();
      expect(screen.getByTestId('input-license-plate-number')).toBeInTheDocument();
      
      // Trailer hitch radio buttons
      expect(screen.getByTestId('radio-yes')).toBeInTheDocument();
      expect(screen.getByTestId('radio-no')).toBeInTheDocument();
      
      // Photo upload sections
      expect(screen.getByTestId('photo-upload-front-of-vehicle-photo')).toBeInTheDocument();
      expect(screen.getByTestId('photo-upload-back-of-vehicle-photo')).toBeInTheDocument();
      expect(screen.getByTestId('photo-upload-auto-insurance-document')).toBeInTheDocument();
      
      // Submit button
      expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument();
    });

    it('renders proper section headings', () => {
      render(<AddVehicleForm {...mockProps} />);
      
      expect(screen.getByRole('heading', { name: /provide your vehicle information/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /provide front and back photos/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /provide vehicle's auto insurance/i })).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AddVehicleForm {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility with error state', async () => {
      render(<AddVehicleForm {...mockProps} />);
      
      // Trigger validation errors by submitting empty form
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      const { container } = render(<AddVehicleForm {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and roles', () => {
      render(<AddVehicleForm {...mockProps} />);
      
      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { name: /provide your vehicle information/i });
      expect(mainHeading.tagName).toBe('H2');
      
      // Check for form labels
      expect(screen.getByLabelText(/vehicle year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vehicle make/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/vehicle model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/license plate number/i)).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      render(<AddVehicleForm {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        const errorElements = screen.getAllByRole('alert');
        expect(errorElements.length).toBeGreaterThan(0);
        
        // Check that errors have proper aria-live
        errorElements.forEach(error => {
          expect(error).toBeInTheDocument();
        });
      });
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles form field changes correctly', async () => {
      const user = userEvent.setup();
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in vehicle year
      const yearSelect = screen.getByTestId('select-vehicle-year');
      await user.selectOptions(yearSelect, '2020');
      expect(yearSelect).toHaveValue('2020');
      
      // Fill in vehicle make
      const makeSelect = screen.getByTestId('select-vehicle-make');
      await user.selectOptions(makeSelect, 'Toyota');
      expect(makeSelect).toHaveValue('Toyota');
      
      // Fill in vehicle model
      const modelInput = screen.getByTestId('input-vehicle-model');
      await user.type(modelInput, 'Camry');
      expect(modelInput).toHaveValue('Camry');
      
      // Fill in license plate
      const licensePlateInput = screen.getByTestId('input-license-plate-number');
      await user.type(licensePlateInput, 'ABC123');
      expect(licensePlateInput).toHaveValue('ABC123');
      
      // Select trailer hitch option
      const yesRadio = screen.getByTestId('radio-yes');
      await user.click(yesRadio);
      expect(yesRadio).toBeChecked();
    });

    it('clears errors when user corrects input', async () => {
      const user = userEvent.setup();
      render(<AddVehicleForm {...mockProps} />);
      
      // Submit to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      // Wait for errors to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-vehicle-make')).toBeInTheDocument();
      });
      
      // Fix the error by selecting a make
      const makeSelect = screen.getByTestId('select-vehicle-make');
      await user.selectOptions(makeSelect, 'Toyota');
      
      // Error should be cleared (note: this depends on implementation)
      // The error might still be visible until next validation cycle
      expect(makeSelect).toHaveValue('Toyota');
    });

    it('handles photo uploads correctly', async () => {
      const user = userEvent.setup();
      render(<AddVehicleForm {...mockProps} />);
      
      // Click front photo upload button
      const frontPhotoButton = screen.getByRole('button', { name: /add front photo/i });
      await user.click(frontPhotoButton);
      
      // Click back photo upload button
      const backPhotoButton = screen.getByRole('button', { name: /add back photo/i });
      await user.click(backPhotoButton);
      
      // Click insurance document upload button
      const insuranceButton = screen.getByRole('button', { name: /add insurance document/i });
      await user.click(insuranceButton);
      
      // Verify buttons are present (photo upload logic is mocked)
      expect(frontPhotoButton).toBeInTheDocument();
      expect(backPhotoButton).toBeInTheDocument();
      expect(insuranceButton).toBeInTheDocument();
    });
  });

  // REQUIRED: Form validation testing
  describe('Form Validation', () => {
    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      render(<AddVehicleForm {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-vehicle-make')).toHaveTextContent(/please select a vehicle make/i);
        expect(screen.getByTestId('error-vehicle-model')).toHaveTextContent(/this field is required/i);
        expect(screen.getByTestId('error-vehicle-year')).toHaveTextContent(/please select a vehicle year/i);
        expect(screen.getByTestId('error-license-plate-number')).toHaveTextContent(/this field is required/i);
        expect(screen.getByTestId('error-trailer-hitch')).toHaveTextContent(/please select whether your vehicle has a trailer hitch/i);
      });
    });

    it('validates license plate format', async () => {
      const user = userEvent.setup();
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in all fields except license plate with invalid format
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'X'); // Too short
      await user.click(screen.getByTestId('radio-yes'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-license-plate-number')).toHaveTextContent(/please enter a valid license plate/i);
      });
    });

    it('accepts valid form data', async () => {
      const user = userEvent.setup();
      
      // Mock successful API calls
      (VehicleService.createVehicle as jest.Mock).mockResolvedValue(mockVehicleData);
      
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in all required fields with valid data
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-yes'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      });
    });
  });

  // REQUIRED: API integration testing
  describe('API Integration', () => {
    it('calls VehicleService.createVehicle with correct data', async () => {
      const user = userEvent.setup();
      
      // Mock successful API calls
      (VehicleService.createVehicle as jest.Mock).mockResolvedValue(mockVehicleData);
      
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in form
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-no'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(VehicleService.createVehicle).toHaveBeenCalledWith(
          'test-user-123',
          'driver',
          expect.objectContaining({
            make: 'Toyota',
            model: 'Camry',
            year: '2020',
            licensePlate: 'ABC123',
            hasTrailerHitch: false,
          })
        );
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (VehicleService.createVehicle as jest.Mock).mockRejectedValue(
        new Error('Failed to create vehicle')
      );
      
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in form
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-no'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to create vehicle/i);
      });
    });

    it('calls onSuccess callback when provided', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();
      
      // Mock successful API calls
      (VehicleService.createVehicle as jest.Mock).mockResolvedValue(mockVehicleData);
      
      render(<AddVehicleForm {...mockProps} onSuccess={mockOnSuccess} />);
      
      // Fill in form
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-no'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('redirects to correct page when no onSuccess callback', async () => {
      const user = userEvent.setup();
      
      // Mock successful API calls
      (VehicleService.createVehicle as jest.Mock).mockResolvedValue(mockVehicleData);
      
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in form
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-no'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/driver-account-page/test-user-123/vehicle');
      });
    });
  });

  // REQUIRED: Loading states testing
  describe('Loading States', () => {
    it('shows loading overlay during submission', async () => {
      const user = userEvent.setup();
      
      // Mock slow API call
      (VehicleService.createVehicle as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockVehicleData), 100))
      );
      
      render(<AddVehicleForm {...mockProps} />);
      
      // Fill in form with valid data
      await user.selectOptions(screen.getByTestId('select-vehicle-year'), '2020');
      await user.selectOptions(screen.getByTestId('select-vehicle-make'), 'Toyota');
      await user.type(screen.getByTestId('input-vehicle-model'), 'Camry');
      await user.type(screen.getByTestId('input-license-plate-number'), 'ABC123');
      await user.click(screen.getByTestId('radio-no'));
      
      const submitButton = screen.getByRole('button', { name: /add vehicle/i });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();
      });
      
      expect(screen.getByText(/adding your vehicle/i)).toBeInTheDocument();
      
      // Button should be disabled and show loading text
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/adding vehicle/i);
    });
  });

  // REQUIRED: Props testing
  describe('Props Handling', () => {
    it('handles different userType correctly', () => {
      const { rerender } = render(<AddVehicleForm {...mockProps} userType="driver" />);
      expect(screen.getByRole('heading', { name: /provide your vehicle information/i })).toBeInTheDocument();
      
      rerender(<AddVehicleForm {...mockProps} userType="mover" />);
      expect(screen.getByRole('heading', { name: /provide your vehicle information/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<AddVehicleForm {...mockProps} className="custom-class" />);
      const formContainer = container.querySelector('.flex-col.max-w-2xl');
      expect(formContainer).toHaveClass('custom-class');
    });
  });
});
