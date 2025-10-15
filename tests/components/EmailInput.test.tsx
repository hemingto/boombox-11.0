/**
 * @fileoverview Comprehensive Jest tests for EmailInput component
 * @source boombox-10.0/src/app/components/reusablecomponents/emailinput.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailInput, { EmailInputProps } from '@/components/forms/EmailInput';
import { ValidationMessages } from '@/lib/utils/validationUtils';

// Mock Heroicons
jest.mock('@heroicons/react/20/solid', () => ({
  EnvelopeIcon: ({ className }: { className: string }) => (
    <svg data-testid="envelope-icon" className={className}>
      <title>Email Icon</title>
    </svg>
  ),
}));

describe('EmailInput Component', () => {
  const defaultProps: EmailInputProps = {
    value: '',
    onEmailChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders email input with default props', () => {
      render(<EmailInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox', { name: /email address/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'Enter your email address');
    });

    it('renders with custom placeholder', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          placeholder="Enter company email" 
        />
      );
      
      const input = screen.getByPlaceholderText('Enter company email');
      expect(input).toBeInTheDocument();
    });

    it('renders envelope icon', () => {
      render(<EmailInput {...defaultProps} />);
      
      const icon = screen.getByTestId('envelope-icon');
      expect(icon).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          className="custom-class" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('renders with custom id', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          id="custom-email-id" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-email-id');
    });
  });

  describe('Value and Change Handling', () => {
    it('displays provided value', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          value="test@example.com" 
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test@example.com');
    });

    it('calls onEmailChange when user types', async () => {
      const user = userEvent.setup();
      const onEmailChange = jest.fn();
      
      render(
        <EmailInput 
          {...defaultProps} 
          onEmailChange={onEmailChange} 
        />
      );
      
      const input = screen.getByRole('textbox');
      
      // Type a single character first
      await user.type(input, 't');
      expect(onEmailChange).toHaveBeenCalledWith('t');
      
      // Clear and type a complete email using fireEvent
      await user.clear(input);
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(onEmailChange).toHaveBeenCalledWith('test@example.com');
    });

    it('handles clear input', async () => {
      const user = userEvent.setup();
      const onEmailChange = jest.fn();
      
      render(
        <EmailInput 
          {...defaultProps} 
          value="test@example.com"
          onEmailChange={onEmailChange} 
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.clear(input);
      
      expect(onEmailChange).toHaveBeenCalledWith('');
    });
  });

  describe('Focus and Blur Handling', () => {
    it('applies focus styles when focused', async () => {
      const user = userEvent.setup();
      
      render(<EmailInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(input).toHaveFocus();
    });

    it('calls onClearError when focused', async () => {
      const user = userEvent.setup();
      const onClearError = jest.fn();
      
      render(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
          onClearError={onClearError}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      
      expect(onClearError).toHaveBeenCalled();
    });

    it('validates email on blur when value exists', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          value="invalid-email"
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText(ValidationMessages.INVALID_EMAIL)).toBeInTheDocument();
      });
    });

    it('shows required error on blur when field is required and empty', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          required={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText(ValidationMessages.REQUIRED)).toBeInTheDocument();
      });
    });
  });

  describe('Error State Handling', () => {
    it('displays error state when hasError is true', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
          errorMessage="Email is required"
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('Email is required');
      
      expect(input).toHaveClass('input-field--error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMessage).toBeInTheDocument();
    });

    it('updates error state when hasError prop changes', () => {
      const { rerender } = render(
        <EmailInput 
          {...defaultProps} 
          hasError={false}
        />
      );
      
      let input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('input-field--error');
      
      rerender(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
          errorMessage="Invalid email"
        />
      );
      
      input = screen.getByRole('textbox');
      expect(input).toHaveClass('input-field--error');
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('applies error styling to icon when in error state', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
        />
      );
      
      const icon = screen.getByTestId('envelope-icon');
      expect(icon).toHaveClass('text-status-error');
    });
  });

  describe('Real-time Validation', () => {
    it('validates email in real-time when validateOnChange is true', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          validateOnChange={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByText(ValidationMessages.INVALID_EMAIL)).toBeInTheDocument();
      });
    });

    it('clears error when typing valid email with validateOnChange', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          validateOnChange={true}
          hasError={true}
          errorMessage="Previous error"
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'valid@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Previous error')).not.toBeInTheDocument();
      });
    });

    it('does not validate in real-time when validateOnChange is false', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          validateOnChange={false}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-email');
      
      // Should not show error immediately
      expect(screen.queryByText(ValidationMessages.INVALID_EMAIL)).not.toBeInTheDocument();
    });
  });

  describe('Custom Validation', () => {
    it('uses custom validator when provided', async () => {
      const customValidator = jest.fn().mockReturnValue({
        isValid: false,
        message: 'Custom validation error',
      });
      
      render(
        <EmailInput 
          {...defaultProps} 
          customValidator={customValidator}
          validateOnChange={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      
      // Use fireEvent to change the complete value at once
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      // Custom validator should be called with the complete email
      expect(customValidator).toHaveBeenCalledWith('test@example.com');
      
      await waitFor(() => {
        expect(screen.getByText('Custom validation error')).toBeInTheDocument();
      });
    });

    it('clears error when custom validator returns valid', async () => {
      const user = userEvent.setup();
      const customValidator = jest.fn().mockReturnValue({
        isValid: true,
      });
      
      render(
        <EmailInput 
          {...defaultProps} 
          customValidator={customValidator}
          validateOnChange={true}
          hasError={true}
          errorMessage="Previous error"
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'valid@example.com');
      
      await waitFor(() => {
        expect(screen.queryByText('Previous error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          disabled={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not respond to user input when disabled', async () => {
      const user = userEvent.setup();
      const onEmailChange = jest.fn();
      
      render(
        <EmailInput 
          {...defaultProps} 
          disabled={true}
          onEmailChange={onEmailChange}
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test@example.com');
      
      expect(onEmailChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('validates email when Enter key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <EmailInput 
          {...defaultProps} 
          value="invalid-email"
        />
      );
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText(ValidationMessages.INVALID_EMAIL)).toBeInTheDocument();
      });
    });

    it('handles Tab navigation correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <input data-testid="before" />
          <EmailInput {...defaultProps} />
          <input data-testid="after" />
        </div>
      );
      
      const beforeInput = screen.getByTestId('before');
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const afterInput = screen.getByTestId('after');
      
      beforeInput.focus();
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(afterInput).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          required={true}
          hasError={true}
          errorMessage="Error message"
        />
      );
      
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('aria-label', 'Email address (required)');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('associates error message with input', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
          errorMessage="Error message"
        />
      );
      
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('email-error'));
      expect(errorMessage).toHaveAttribute('id', 'email-error');
    });

    it('uses custom ARIA label when provided', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          aria-label="Custom email label"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Custom email label');
    });

    it('has proper autocomplete attribute', () => {
      render(<EmailInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('disables autocorrect and spellcheck for email input', () => {
      render(<EmailInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocorrect', 'off');
      expect(input).toHaveAttribute('spellcheck', 'false');
      expect(input).toHaveAttribute('autocapitalize', 'none');
    });
  });

  describe('Icon Color States', () => {
    it('shows secondary color when input is empty and not focused', () => {
      render(<EmailInput {...defaultProps} />);
      
      const icon = screen.getByTestId('envelope-icon');
      expect(icon).toHaveClass('text-text-secondary');
    });

    it('shows primary color when input has value', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          value="test@example.com"
        />
      );
      
      const icon = screen.getByTestId('envelope-icon');
      expect(icon).toHaveClass('text-primary');
    });

    it('shows primary color when input is focused', async () => {
      const user = userEvent.setup();
      
      render(<EmailInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const icon = screen.getByTestId('envelope-icon');
      
      await user.click(input);
      
      expect(icon).toHaveClass('text-primary');
    });

    it('shows error color when in error state', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          hasError={true}
        />
      );
      
      const icon = screen.getByTestId('envelope-icon');
      expect(icon).toHaveClass('text-status-error');
    });
  });

  describe('Required Field Handling', () => {
    it('shows required in aria-label when required', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          required={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Email address (required)');
    });

    it('has required attribute when required prop is true', () => {
      render(
        <EmailInput 
          {...defaultProps} 
          required={true}
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });
  });
});
