/**
 * @fileoverview Comprehensive tests for CardCvcInput component
 * Tests component functionality, accessibility, state management, and Stripe integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardCvcInput } from '@/components/forms';
import { StripeElementChangeEvent } from '@stripe/stripe-js';

// Mock Stripe Elements
jest.mock('@stripe/react-stripe-js', () => ({
  CardCvcElement: jest.fn(({ onChange, onFocus, onBlur, options }) => (
    <input
      data-testid="mock-cvc-element"
      placeholder={options?.placeholder || 'CVC'}
      disabled={options?.disabled}
      onChange={(e) => {
        // Simulate Stripe event structure
        const mockEvent: Partial<StripeElementChangeEvent> = {
          complete: e.target.value.length === 3,
          empty: e.target.value.length === 0,
          error: e.target.value.length > 0 && e.target.value.length < 3 
            ? { type: 'validation_error', code: 'incomplete_cvc', message: 'Your card\'s security code is incomplete.' }
            : undefined,
          value: { cvc: e.target.value },
          elementType: 'cardCvc',
          brand: 'unknown'
        };
        onChange && onChange(mockEvent as StripeElementChangeEvent);
      }}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )),
}));

describe('CardCvcInput', () => {
  const mockOnChange = jest.fn();
  const mockOnFocus = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      expect(screen.getByTestId('mock-cvc-element')).toBeInTheDocument();
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          placeholder="Security Code"
        />
      );
      
      expect(screen.getByPlaceholderText('Security Code')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('custom-class');
    });

    it('renders as disabled when disabled prop is true', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          disabled={true}
        />
      );
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('cursor-not-allowed', 'opacity-60');
      expect(screen.getByTestId('mock-cvc-element')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('aria-label', 'Card security code');
      expect(container).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates aria-invalid when there is an error', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      // Trigger an error by entering incomplete CVC
      fireEvent.change(input, { target: { value: '12' } });
      
      await waitFor(() => {
        expect(container).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('provides error announcement for screen readers', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      
      // Trigger an error
      fireEvent.change(input, { target: { value: '12' } });
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent('Invalid security code');
        expect(errorElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('associates error message with input using aria-describedby', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      // Trigger an error
      fireEvent.change(input, { target: { value: '12' } });
      
      await waitFor(() => {
        expect(container).toHaveAttribute('aria-describedby', 'cvc-error');
        expect(screen.getByRole('alert')).toHaveAttribute('id', 'cvc-error');
      });
    });

    it('uses custom aria label when provided', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          ariaLabel="Custom security code label"
        />
      );
      
      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('aria-label', 'Custom security code label');
    });
  });

  describe('State Management', () => {
    it('manages focus state correctly', async () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
        />
      );
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      // Test focus
      fireEvent.focus(input);
      await waitFor(() => {
        expect(container).toHaveClass('ring-2', 'ring-border-focus');
        expect(mockOnFocus).toHaveBeenCalledTimes(1);
      });
      
      // Test blur
      fireEvent.blur(input);
      await waitFor(() => {
        expect(container).not.toHaveClass('ring-2', 'ring-border-focus');
        expect(mockOnBlur).toHaveBeenCalledTimes(1);
      });
    });

    it('manages error state correctly', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      // Initially no error
      expect(container).not.toHaveClass('input-field--error');
      
      // Trigger error with incomplete CVC
      fireEvent.change(input, { target: { value: '12' } });
      
      await waitFor(() => {
        expect(container).toHaveClass('input-field--error');
      });
      
      // Clear error with valid CVC
      fireEvent.change(input, { target: { value: '123' } });
      
      await waitFor(() => {
        expect(container).not.toHaveClass('input-field--error');
      });
    });
  });

  describe('Event Handling', () => {
    it('calls onChange callback with Stripe event', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      
      fireEvent.change(input, { target: { value: '123' } });
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            complete: true,
            empty: false,
            elementType: 'cardCvc'
          })
        );
      });
    });

    it('handles focus and blur callbacks', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          onFocus={mockOnFocus}
          onBlur={mockOnBlur}
        />
      );
      
      const input = screen.getByTestId('mock-cvc-element');
      
      fireEvent.focus(input);
      expect(mockOnFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(input);
      expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });

    it('works without optional callbacks', () => {
      expect(() => {
        render(<CardCvcInput onChange={mockOnChange} />);
        
        const input = screen.getByTestId('mock-cvc-element');
        fireEvent.focus(input);
        fireEvent.blur(input);
      }).not.toThrow();
    });
  });

  describe('Design System Integration', () => {
    it('applies correct base styling classes', () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('py-2.5', 'px-3', 'rounded-md', 'input-field');
    });

    it('applies focus styles when focused', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(container).toHaveClass('bg-surface-primary', 'ring-2', 'ring-border-focus');
      });
    });

    it('applies error styles when there is an error', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      const container = screen.getByRole('group');
      
      fireEvent.change(input, { target: { value: '12' } });
      
      await waitFor(() => {
        expect(container).toHaveClass('input-field--error');
      });
    });

    it('applies disabled styles when disabled', () => {
      render(<CardCvcInput onChange={mockOnChange} disabled={true} />);
      
      const container = screen.getByRole('group');
      expect(container).toHaveClass('bg-surface-disabled', 'cursor-not-allowed', 'opacity-60');
    });
  });

  describe('Stripe Integration', () => {
    it('passes correct options to CardCvcElement', () => {
      render(
        <CardCvcInput
          onChange={mockOnChange}
          placeholder="Custom CVC"
          disabled={true}
        />
      );
      
      const input = screen.getByTestId('mock-cvc-element');
      expect(input).toHaveAttribute('placeholder', 'Custom CVC');
      expect(input).toBeDisabled();
    });

    it('handles Stripe element options for styling', () => {
      // This test verifies that the component sets up proper Stripe styling options
      render(<CardCvcInput onChange={mockOnChange} />);
      
      // The styling options are passed to the actual Stripe element
      // We verify the component renders without errors, indicating proper setup
      expect(screen.getByTestId('mock-cvc-element')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty input correctly', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      
      // Start with value, then clear it
      fireEvent.change(input, { target: { value: '123' } });
      fireEvent.change(input, { target: { value: '' } });
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            empty: true,
            complete: false
          })
        );
      });
    });

    it('handles complete input correctly', async () => {
      render(<CardCvcInput onChange={mockOnChange} />);
      
      const input = screen.getByTestId('mock-cvc-element');
      
      fireEvent.change(input, { target: { value: '123' } });
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            complete: true,
            empty: false,
            error: undefined
          })
        );
      });
    });
  });
});
