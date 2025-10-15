/**
 * @fileoverview Jest tests for BankAccountName component
 * Tests all functionality including error states, callbacks, accessibility, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BankAccountName } from '@/components/forms/BankAccountName';

// Mock the Input component to isolate BankAccountName logic
jest.mock('@/components/ui/primitives/Input', () => ({
  Input: jest.fn().mockImplementation(({ 
    onChange, 
    onFocus, 
    value, 
    placeholder, 
    'aria-label': ariaLabel,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    variant,
    error,
    fullWidth,
    autoComplete,
    type,
    id,
    ...props 
  }) => (
    <div>
      <input
        {...props}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        autoComplete={autoComplete}
        data-testid="bank-account-name-input"
        data-variant={variant}
        data-error={error}
        data-full-width={fullWidth}
      />
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  ))
}));

describe('BankAccountName Component', () => {
  const defaultProps = {
    value: '',
    onBankAccountHolderChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<BankAccountName {...defaultProps} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Bank Account Holder Name');
      expect(input).toHaveAttribute('autoComplete', 'name');
      expect(input).toHaveAttribute('id', 'bank-account-holder-name');
    });

    it('renders with provided value', () => {
      const testValue = 'John Doe';
      render(<BankAccountName {...defaultProps} value={testValue} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue(testValue);
    });

    it('passes through additional props', () => {
      const customId = 'custom-bank-name';
      render(<BankAccountName {...defaultProps} id={customId} data-custom="test" />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('id', customId);
      expect(input).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('Error States', () => {
    it('displays error state when hasError is true', () => {
      const errorMessage = 'Account holder name is required';
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={true} 
          errorMessage={errorMessage} 
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('data-variant', 'error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      const errorElement = screen.getByTestId('error-message');
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    it('does not display error when hasError is false', () => {
      render(<BankAccountName {...defaultProps} hasError={false} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('data-variant', 'default');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('handles missing errorMessage gracefully', () => {
      render(<BankAccountName {...defaultProps} hasError={true} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('data-variant', 'error');
      // When errorMessage is undefined, the data-error attribute should not be set
      expect(input).not.toHaveAttribute('data-error');
    });
  });

  describe('User Interactions', () => {
    it('calls onBankAccountHolderChange when input value changes', () => {
      const mockOnChange = jest.fn();
      
      render(<BankAccountName {...defaultProps} onBankAccountHolderChange={mockOnChange} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      
      // Simulate typing a complete name
      fireEvent.change(input, { target: { value: 'Jane Smith' } });
      
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('Jane Smith');
    });

    it('calls onClearError when input receives focus and has error', async () => {
      const mockOnClearError = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={true} 
          onClearError={mockOnClearError} 
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      await user.click(input);
      
      expect(mockOnClearError).toHaveBeenCalledTimes(1);
    });

    it('does not call onClearError when no error exists', async () => {
      const mockOnClearError = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={false} 
          onClearError={mockOnClearError} 
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      await user.click(input);
      
      expect(mockOnClearError).not.toHaveBeenCalled();
    });

    it('calls additional onChange handler when provided', async () => {
      const mockOnChange = jest.fn();
      const mockCustomOnChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          onBankAccountHolderChange={mockOnChange}
          onChange={mockCustomOnChange}
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      await user.type(input, 'Test');
      
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockCustomOnChange).toHaveBeenCalled();
    });

    it('calls additional onFocus handler when provided', async () => {
      const mockOnFocus = jest.fn();
      const user = userEvent.setup();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          onFocus={mockOnFocus}
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      await user.click(input);
      
      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes by default', () => {
      render(<BankAccountName {...defaultProps} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('aria-label', 'Bank account holder name');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('has proper ARIA attributes in error state', () => {
      const errorMessage = 'Error message';
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={true} 
          errorMessage={errorMessage} 
          id="test-input"
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });

    it('supports keyboard navigation', () => {
      render(<BankAccountName {...defaultProps} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      
      // Should be focusable
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Should support keyboard input
      fireEvent.keyDown(input, { key: 'Tab' });
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'Escape' });
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to Input component', () => {
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={false}
          className="custom-class"
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveAttribute('data-full-width', 'true');
      expect(input).toHaveAttribute('data-variant', 'default');
    });

    it('maintains controlled component behavior', () => {
      const { rerender } = render(<BankAccountName {...defaultProps} value="Initial" />);
      
      let input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue('Initial');
      
      rerender(<BankAccountName {...defaultProps} value="Updated" />);
      
      input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue('Updated');
    });
  });

  describe('Event Handling', () => {
    it('handles focus event properly with error clearing', async () => {
      const mockOnClearError = jest.fn();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          hasError={true}
          onClearError={mockOnClearError}
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(mockOnClearError).toHaveBeenCalledTimes(1);
      });
    });

    it('handles change event with proper value extraction', () => {
      const mockOnChange = jest.fn();
      
      render(
        <BankAccountName 
          {...defaultProps} 
          onBankAccountHolderChange={mockOnChange}
        />
      );
      
      const input = screen.getByTestId('bank-account-name-input');
      const testValue = 'John Doe';
      
      fireEvent.change(input, { target: { value: testValue } });
      
      expect(mockOnChange).toHaveBeenCalledWith(testValue);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value gracefully', () => {
      render(<BankAccountName {...defaultProps} value="" />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue('');
    });

    it('handles very long names', () => {
      const longName = 'A'.repeat(1000);
      render(<BankAccountName {...defaultProps} value={longName} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue(longName);
    });

    it('handles special characters in names', () => {
      const specialName = "John O'Doe-Smith Jr.";
      render(<BankAccountName {...defaultProps} value={specialName} />);
      
      const input = screen.getByTestId('bank-account-name-input');
      expect(input).toHaveValue(specialName);
    });

    it('works without optional callbacks', () => {
      // Should not throw errors when optional props are not provided
      expect(() => {
        render(
          <BankAccountName 
            value="Test Name" 
            onBankAccountHolderChange={jest.fn()} 
          />
        );
      }).not.toThrow();
    });
  });
});
