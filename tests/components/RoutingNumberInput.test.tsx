/**
 * @fileoverview Tests for RoutingNumberInput component
 * @source boombox-11.0/src/components/forms/RoutingNumberInput.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutingNumberInput } from '@/components/forms/RoutingNumberInput';

// Mock the validation utilities
jest.mock('@/lib/utils/validationUtils', () => ({
  isValidRoutingNumber: jest.fn(),
  ValidationMessages: {
    REQUIRED: 'This field is required',
    INVALID_ROUTING_NUMBER: 'Routing number must be 9 digits',
  },
}));

const mockIsValidRoutingNumber = jest.mocked(require('@/lib/utils/validationUtils').isValidRoutingNumber);

describe('RoutingNumberInput', () => {
  const defaultProps = {
    value: '',
    onRoutingNumberChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidRoutingNumber.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render routing number input field', () => {
      render(<RoutingNumberInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Routing Number');
      expect(input).toHaveAttribute('maxLength', '9');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });

    it('should render with label when showLabel is true', () => {
      render(<RoutingNumberInput {...defaultProps} showLabel />);
      
      expect(screen.getByText('Routing Number')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          showLabel 
          label="Bank Routing Number" 
        />
      );
      
      expect(screen.getByText('Bank Routing Number')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(<RoutingNumberInput {...defaultProps} />);
      
      expect(screen.getByText("Enter your bank's 9-digit routing number")).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<RoutingNumberInput {...defaultProps} value="123456789" />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      expect(input).toHaveValue('123456789');
    });

    it('should render as disabled when disabled prop is true', () => {
      render(<RoutingNumberInput {...defaultProps} disabled />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      expect(input).toBeDisabled();
    });

    it('should render with required indicator when required', () => {
      render(<RoutingNumberInput {...defaultProps} required showLabel />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should accept numeric input', async () => {
      const user = userEvent.setup();
      const onRoutingNumberChange = jest.fn();
      
      // Create a controlled component that updates value
      const ControlledComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <RoutingNumberInput 
            value={value}
            onRoutingNumberChange={(newValue) => {
              setValue(newValue);
              onRoutingNumberChange(newValue);
            }}
          />
        );
      };
      
      render(<ControlledComponent />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      await user.type(input, '123456789');
      
      expect(onRoutingNumberChange).toHaveBeenLastCalledWith('123456789');
      expect(input).toHaveValue('123456789');
    });

    it('should reject non-numeric input', async () => {
      const user = userEvent.setup();
      const onRoutingNumberChange = jest.fn();
      
      // Create a controlled component that updates value
      const ControlledComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <RoutingNumberInput 
            value={value}
            onRoutingNumberChange={(newValue) => {
              setValue(newValue);
              onRoutingNumberChange(newValue);
            }}
          />
        );
      };
      
      render(<ControlledComponent />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      await user.type(input, 'abc123def');
      
      // Should only accept the numeric part
      expect(input).toHaveValue('123');
      expect(onRoutingNumberChange).toHaveBeenLastCalledWith('123');
    });

    it('should limit input to 9 characters', async () => {
      const user = userEvent.setup();
      const onRoutingNumberChange = jest.fn();
      
      // Create a controlled component that updates value
      const ControlledComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <RoutingNumberInput 
            value={value}
            onRoutingNumberChange={(newValue) => {
              setValue(newValue);
              onRoutingNumberChange(newValue);
            }}
          />
        );
      };
      
      render(<ControlledComponent />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      await user.type(input, '12345678901234');
      
      expect(input).toHaveValue('123456789');
      expect(onRoutingNumberChange).toHaveBeenLastCalledWith('123456789');
    });

    it('should clear error on focus', async () => {
      const user = userEvent.setup();
      
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          hasError 
          errorMessage="Invalid routing number" 
        />
      );
      
      expect(screen.getByText('Invalid routing number')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      await user.click(input);
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid routing number')).not.toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show required error when field is required and empty', async () => {
      const user = userEvent.setup();
      
      render(<RoutingNumberInput {...defaultProps} required />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      // Focus and blur to trigger validation
      await user.click(input);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should show invalid routing number error', async () => {
      const user = userEvent.setup();
      mockIsValidRoutingNumber.mockReturnValue(false);
      
      // Create a controlled component that updates value
      const ControlledComponent = () => {
        const [value, setValue] = React.useState('');
        return (
          <RoutingNumberInput 
            value={value}
            onRoutingNumberChange={setValue}
          />
        );
      };
      
      render(<ControlledComponent />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      await user.type(input, '12345');
      await user.tab(); // Trigger blur validation
      
      await waitFor(() => {
        expect(screen.getByText('Routing number must be 9 digits')).toBeInTheDocument();
      });
    });

    it('should validate on Enter key press', async () => {
      const user = userEvent.setup();
      mockIsValidRoutingNumber.mockReturnValue(false);
      
      render(<RoutingNumberInput {...defaultProps} value="12345" />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      await user.type(input, '{enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Routing number must be 9 digits')).toBeInTheDocument();
      });
    });

    it('should use custom validator when provided', async () => {
      const user = userEvent.setup();
      const customValidator = jest.fn().mockReturnValue({
        isValid: false,
        message: 'Custom validation error',
      });
      
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          customValidator={customValidator}
          value="123456789"
        />
      );
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      // Focus the input first, then tab away to trigger blur validation
      await user.click(input);
      await user.tab();
      
      await waitFor(() => {
        expect(customValidator).toHaveBeenCalledWith('123456789');
        expect(screen.getByText('Custom validation error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<RoutingNumberInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      expect(input).toHaveAttribute('aria-label', 'Bank routing number');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should set aria-invalid to true when there is an error', () => {
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          hasError 
          errorMessage="Error message" 
        />
      );
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'routing-number-error');
    });

    it('should associate error message with input', () => {
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          hasError 
          errorMessage="Invalid routing number" 
        />
      );
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      const errorMessage = screen.getByText('Invalid routing number');
      
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id', expect.stringContaining('error'));
    });
  });

  describe('Props Handling', () => {
    it('should apply custom className', () => {
      render(<RoutingNumberInput {...defaultProps} className="custom-class" />);
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      expect(input).toHaveClass('custom-class');
    });

    it('should set custom id and name attributes', () => {
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          id="custom-routing" 
          name="customRouting" 
        />
      );
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      expect(input).toHaveAttribute('id', 'custom-routing');
      expect(input).toHaveAttribute('name', 'customRouting');
    });

    it('should handle fullWidth prop', () => {
      render(<RoutingNumberInput {...defaultProps} fullWidth={false} />);
      
      const container = screen.getByRole('textbox', { name: /bank routing number/i }).closest('.form-group');
      expect(container).not.toHaveClass('w-full');
    });
  });

  describe('Error Clearing', () => {
    it('should call onClearError when error is cleared', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(
        <RoutingNumberInput 
          {...defaultProps} 
          hasError 
          errorMessage="Error" 
          onClearError={onClearError} 
        />
      );
      
      const input = screen.getByRole('textbox', { name: /bank routing number/i });
      await user.click(input);
      
      expect(onClearError).toHaveBeenCalled();
    });
  });
});
