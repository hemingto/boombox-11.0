/**
 * @fileoverview Unit tests for CardNumberInput component
 * Tests component functionality, accessibility, error handling, icon behavior, and design system integration
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';
import CardNumberInput from '@/components/forms/CardNumberInput';

// Mock Stripe for testing
const mockStripe = loadStripe('pk_test_mock_key');

// Mock the CardNumberElement
jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  CardNumberElement: ({ onChange, onFocus, onBlur, options, ...props }: any) => (
    <div
      data-testid="card-number-element"
      data-placeholder={options?.placeholder || 'Card Number'}
      data-disabled={options?.disabled}
      onClick={(e) => {
        const mockEvent: Partial<StripeElementChangeEvent> = {
          complete: (e.target as any).dataset.value?.length >= 16,
          empty: !(e.target as any).dataset.value?.length,
          error: (e.target as any).dataset.value === 'error' ? { message: 'Test error', type: 'validation_error', code: 'incomplete_number' } : undefined,
          elementType: 'cardNumber',
        };
        onChange?.(mockEvent as StripeElementChangeEvent);
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    >
      Stripe CardNumber Element Mock
    </div>
  ),
}));

// Mock Heroicons
jest.mock('@heroicons/react/20/solid', () => ({
  CreditCardIcon: ({ className, ...props }: any) => (
    <svg
      data-testid="credit-card-icon"
      className={className}
      {...props}
    >
      <path d="credit-card-icon" />
    </svg>
  ),
}));

const renderWithStripe = (ui: React.ReactElement) => {
  return render(
    <Elements stripe={mockStripe}>
      {ui}
    </Elements>
  );
};

describe('CardNumberInput', () => {
  const mockOnChange = jest.fn();
  const mockOnFocus = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component correctly', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      expect(screen.getByTestId('card-number-element')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-icon')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default placeholder text', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      expect(screen.getByTestId('card-number-element')).toHaveAttribute('data-placeholder', 'Card Number');
    });

    it('applies custom className to container', () => {
      renderWithStripe(
        <CardNumberInput 
          onChange={mockOnChange} 
          className="custom-class"
        />
      );

      const container = screen.getByRole('textbox').closest('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Credit Card Icon', () => {
    it('renders credit card icon with correct default styling', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const icon = screen.getByTestId('credit-card-icon');
      expect(icon).toHaveClass('w-5', 'h-5', 'transition-colors', 'duration-200', 'text-text-secondary');
    });

    it('updates icon color on focus', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const icon = screen.getByTestId('credit-card-icon');

      fireEvent.focus(input);
      expect(icon).toHaveClass('text-primary');
    });

    it('updates icon color on error', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const icon = screen.getByTestId('credit-card-icon');

      (input as any).dataset.value = 'error';
      fireEvent.click(input);
      expect(icon).toHaveClass('text-status-error');
    });

    it('updates icon styling when disabled', () => {
      renderWithStripe(
        <CardNumberInput 
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const icon = screen.getByTestId('credit-card-icon');
      expect(icon).toHaveClass('text-text-secondary', 'opacity-60');
    });

    it('has proper accessibility attributes', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const iconContainer = screen.getByTestId('credit-card-icon').closest('span');
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes by default', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const container = screen.getByRole('textbox', { name: /credit card number/i });
      expect(container).toHaveAttribute('aria-label', 'Credit card number');
      expect(container).toHaveAttribute('tabindex', '-1');
    });

    it('accepts custom ARIA attributes', () => {
      renderWithStripe(
        <CardNumberInput
          onChange={mockOnChange}
          aria-label="Custom card label"
          aria-describedby="card-error"
        />
      );

      const container = screen.getByRole('textbox', { name: /custom card label/i });
      expect(container).toHaveAttribute('aria-label', 'Custom card label');
      expect(container).toHaveAttribute('aria-describedby', 'card-error');
    });

    it('updates aria-invalid when error occurs', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });

      (input as any).dataset.value = 'error';
      fireEvent.click(input);
      expect(container).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when Stripe element changes', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      (input as any).dataset.value = '4242424242424242';
      fireEvent.click(input);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          complete: true,
          empty: false,
          elementType: 'cardNumber',
        })
      );
    });

    it('calls onFocus when element receives focus', () => {
      renderWithStripe(
        <CardNumberInput 
          onChange={mockOnChange}
          onFocus={mockOnFocus}
        />
      );

      const input = screen.getByTestId('card-number-element');
      fireEvent.focus(input);

      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('calls onBlur when element loses focus', () => {
      renderWithStripe(
        <CardNumberInput 
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByTestId('card-number-element');
      fireEvent.blur(input);

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('handles focus state correctly', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });
      const icon = screen.getByTestId('credit-card-icon');

      // Focus should add focus styling
      fireEvent.focus(input);
      expect(container).toHaveClass('ring-border-focus', 'bg-surface-primary');
      expect(icon).toHaveClass('text-primary');

      // Blur should remove focus styling
      fireEvent.blur(input);
      expect(container).not.toHaveClass('ring-border-focus');
      expect(icon).toHaveClass('text-text-secondary');
    });

    it('handles error state correctly', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });
      const icon = screen.getByTestId('credit-card-icon');

      // Trigger error
      (input as any).dataset.value = 'error';
      fireEvent.click(input);
      expect(container).toHaveClass('ring-border-error', 'bg-red-50');
      expect(icon).toHaveClass('text-status-error');

      // Clear error
      (input as any).dataset.value = '4242424242424242';
      fireEvent.click(input);
      expect(container).not.toHaveClass('ring-border-error');
      expect(icon).not.toHaveClass('text-status-error');
    });
  });

  describe('Disabled State', () => {
    it('handles disabled state correctly', () => {
      renderWithStripe(
        <CardNumberInput 
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });
      const icon = screen.getByTestId('credit-card-icon');

      expect(input).toHaveAttribute('data-disabled', 'true');
      expect(container).toHaveClass('bg-surface-disabled', 'cursor-not-allowed', 'opacity-60');
      expect(icon).toHaveClass('text-text-secondary', 'opacity-60');
    });
  });

  describe('Layout and Positioning', () => {
    it('positions icon correctly within container', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const iconContainer = screen.getByTestId('credit-card-icon').closest('span');
      expect(iconContainer).toHaveClass('absolute', 'top-3', 'left-3', 'z-10');
    });

    it('provides proper spacing for icon in input area', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const inputArea = screen.getByTestId('card-number-element').closest('div')?.parentElement;
      expect(inputArea).toHaveClass('pl-10', 'py-2.5', 'px-3');
    });

    it('maintains relative positioning for container', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const outerContainer = screen.getByRole('textbox').closest('div')?.parentElement;
      expect(outerContainer).toHaveClass('relative', 'w-full');
    });
  });

  describe('Design System Integration', () => {
    it('applies correct default styling classes', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const container = screen.getByRole('textbox', { name: /credit card number/i });
      expect(container).toHaveClass(
        'relative',
        'rounded-md',
        'transition-all',
        'duration-200',
        'bg-surface-tertiary'
      );
    });

    it('applies focus styling when focused', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });

      fireEvent.focus(input);
      expect(container).toHaveClass(
        'ring-2',
        'ring-border-focus',
        'bg-surface-primary'
      );
    });

    it('applies error styling when error occurs', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      const container = screen.getByRole('textbox', { name: /credit card number/i });

      (input as any).dataset.value = 'error';
      fireEvent.click(input);
      expect(container).toHaveClass(
        'ring-2',
        'ring-border-error',
        'bg-red-50',
        'border-border-error'
      );
    });
  });

  describe('Stripe Integration', () => {
    it('passes correct options to Stripe element', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');
      expect(input).toHaveAttribute('data-placeholder', 'Card Number');
    });

    it('handles Stripe element state changes', () => {
      renderWithStripe(
        <CardNumberInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-number-element');

      // Test empty state
      (input as any).dataset.value = '';
      fireEvent.click(input);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          empty: true,
          complete: false,
        })
      );

      // Test complete state with Visa card
      (input as any).dataset.value = '4242424242424242';
      fireEvent.click(input);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          empty: false,
          complete: true,
        })
      );
    });
  });
});
