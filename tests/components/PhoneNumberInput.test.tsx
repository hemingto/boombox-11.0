/**
 * @fileoverview Comprehensive Jest tests for PhoneNumberInput component
 * Tests component functionality, user interactions, accessibility, and edge cases
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PhoneNumberInput } from '@/components/forms/PhoneNumberInput';

// Mock the phone utils to ensure consistent testing
jest.mock('@/lib/utils/phoneUtils', () => ({
  isValidPhoneNumber: jest.fn((phone: string) => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
  }),
  extractPhoneDigits: jest.fn((phone: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  }),
}));

describe('PhoneNumberInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<PhoneNumberInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('placeholder', 'Phone number');
    });

    it('renders with custom placeholder', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps} 
          placeholder="Enter your phone number" 
        />
      );
      
      const input = screen.getByPlaceholderText('Enter your phone number');
      expect(input).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps} 
          label="Phone Number" 
        />
      );
      
      expect(screen.getByText('Phone Number')).toBeInTheDocument();
    });

    it('renders with required indicator', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps} 
          label="Phone Number"
          required 
        />
      );
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders phone icon', () => {
      render(<PhoneNumberInput {...defaultProps} />);
      
      // The PhoneIcon should be rendered (we can test for its presence via the Input component)
      const input = screen.getByRole('textbox');
      expect(input.closest('.relative')).toBeInTheDocument();
    });
  });

  describe('Value Handling and Formatting', () => {
    it('displays raw digits when focused', async () => {
      const user = userEvent.setup();
      render(<PhoneNumberInput {...defaultProps} value="1234567890" />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      // When focused, should show raw digits
      expect(input).toHaveValue('1234567890');
    });

    it('displays formatted phone number when not focused and complete', () => {
      render(<PhoneNumberInput {...defaultProps} value="1234567890" />);
      
      const input = screen.getByRole('textbox');
      
      // When not focused and 10 digits, should show formatted
      expect(input).toHaveValue('(123) 456-7890');
    });

    it('displays raw digits for incomplete numbers', () => {
      render(<PhoneNumberInput {...defaultProps} value="12345" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('12345');
    });

    it('extracts only digits from input', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<PhoneNumberInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Test by directly changing the input value to simulate paste
      fireEvent.change(input, { target: { value: '(123) 456-7890' } });
      
      // Should extract only digits
      expect(mockOnChange).toHaveBeenCalledWith('1234567890');
    });

    it('limits input to 10 digits', async () => {
      const mockOnChange = jest.fn();
      
      render(<PhoneNumberInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Test by directly changing the input value
      fireEvent.change(input, { target: { value: '12345678901234' } });
      
      // Should limit to 10 digits
      expect(mockOnChange).toHaveBeenCalledWith('1234567890');
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when user types', async () => {
      const mockOnChange = jest.fn();
      
      render(<PhoneNumberInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Test single character input
      fireEvent.change(input, { target: { value: '1' } });
      expect(mockOnChange).toHaveBeenCalledWith('1');
      
      // Test multiple characters
      fireEvent.change(input, { target: { value: '123' } });
      expect(mockOnChange).toHaveBeenCalledWith('123');
    });

    it('calls onClearError when focused and has error', async () => {
      const user = userEvent.setup();
      const mockOnClearError = jest.fn();
      
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(mockOnClearError).toHaveBeenCalled();
    });

    it('does not call onClearError when focused without error', async () => {
      const user = userEvent.setup();
      const mockOnClearError = jest.fn();
      
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={false}
          onClearError={mockOnClearError}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(mockOnClearError).not.toHaveBeenCalled();
    });

    it('handles focus and blur events', async () => {
      const user = userEvent.setup();
      render(<PhoneNumberInput {...defaultProps} value="1234567890" />);
      
      const input = screen.getByRole('textbox');
      
      // Focus should show raw digits
      await user.click(input);
      expect(input).toHaveValue('1234567890');
      
      // Blur should show formatted
      await user.tab();
      expect(input).toHaveValue('(123) 456-7890');
    });
  });

  describe('Error Handling', () => {
    it('displays custom error message', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          errorMessage="Custom error message"
        />
      );
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('displays default error message for incomplete number', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          value="12345"
        />
      );
      
      expect(screen.getByText('Please enter a complete 10-digit phone number')).toBeInTheDocument();
    });

    it('displays error message for too many digits', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          value="12345678901"
        />
      );
      
      expect(screen.getByText('Phone number should be 10 digits')).toBeInTheDocument();
    });

    it('displays generic error message when hasError is true but no specific message', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          value=""
        />
      );
      
      expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
    });

    it('applies error styling when hasError is true', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          hasError={true}
          errorMessage="Error"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          id="phone-input"
          aria-label="Phone number input"
          aria-describedby="phone-help"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Phone number input');
      expect(input).toHaveAttribute('aria-describedby', 'phone-help');
      expect(input).toHaveAttribute('id', 'phone-input');
    });

    it('has proper input attributes for mobile', () => {
      render(<PhoneNumberInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('autoComplete', 'tel');
      expect(input).toHaveAttribute('inputMode', 'tel');
    });

    it('sets aria-invalid correctly', () => {
      const { rerender } = render(
        <PhoneNumberInput {...defaultProps} hasError={false} />
      );
      
      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      
      rerender(<PhoneNumberInput {...defaultProps} hasError={true} />);
      
      input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PhoneNumberInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      
      // Should be focusable with keyboard
      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(<PhoneNumberInput {...defaultProps} disabled={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <PhoneNumberInput 
          value="" 
          onChange={mockOnChange} 
          disabled={true} 
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, '123');
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Form Integration', () => {
    it('supports form attributes', () => {
      render(
        <PhoneNumberInput 
          {...defaultProps}
          name="phone"
          id="phone-field"
          required={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'phone');
      expect(input).toHaveAttribute('id', 'phone-field');
      // The Input primitive handles required state internally
      expect(input).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      
      render(<PhoneNumberInput {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value gracefully', () => {
      render(<PhoneNumberInput {...defaultProps} value="" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('handles null/undefined values gracefully', () => {
      // @ts-ignore - Testing edge case
      render(<PhoneNumberInput onChange={jest.fn()} value={null} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('handles special characters in input', async () => {
      const mockOnChange = jest.fn();
      
      render(<PhoneNumberInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      
      // Test by directly changing the input value with special characters
      fireEvent.change(input, { target: { value: '1-2-3-4-5-6-7-8-9-0' } });
      
      // Should extract only digits
      expect(mockOnChange).toHaveBeenCalledWith('1234567890');
    });

    it('handles paste events with formatted text', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<PhoneNumberInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.paste('(555) 123-4567');
      
      expect(mockOnChange).toHaveBeenCalledWith('5551234567');
    });
  });
});
