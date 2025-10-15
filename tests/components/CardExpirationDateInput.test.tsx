/**
 * @fileoverview Unit tests for CardExpirationDateInput component
 * Tests component functionality, accessibility, error handling, and design system integration
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StripeElementChangeEvent } from '@stripe/stripe-js';
import CardExpirationDateInput from '@/components/forms/CardExpirationDateInput';

// Mock Stripe for testing
const mockStripe = loadStripe('pk_test_mock_key');

// Mock the CardExpiryElement
jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  CardExpiryElement: ({ onChange, onFocus, onBlur, options, ...props }: any) => (
    <div
      data-testid="card-expiry-element"
      data-placeholder={options?.placeholder || 'MM / YY'}
      data-disabled={options?.disabled}
      onClick={(e) => {
        const mockEvent: Partial<StripeElementChangeEvent> = {
          complete: (e.target as any).dataset.value?.length >= 5,
          empty: !(e.target as any).dataset.value?.length,
          error: (e.target as any).dataset.value === 'error' ? { message: 'Test error', type: 'validation_error' } : undefined,
          elementType: 'cardExpiry',
        };
        onChange?.(mockEvent as StripeElementChangeEvent);
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    >
      Stripe CardExpiry Element Mock
    </div>
  ),
}));

const renderWithStripe = (ui: React.ReactElement) => {
  return render(
    <Elements stripe={mockStripe}>
      {ui}
    </Elements>
  );
};

describe('CardExpirationDateInput', () => {
  const mockOnChange = jest.fn();
  const mockOnFocus = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the component correctly', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      expect(screen.getByTestId('card-expiry-element')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default placeholder text', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      expect(screen.getByTestId('card-expiry-element')).toHaveAttribute('data-placeholder', 'MM / YY');
    });

    it('applies custom className', () => {
      renderWithStripe(
        <CardExpirationDateInput 
          onChange={mockOnChange} 
          className="custom-class"
        />
      );

      const container = screen.getByRole('textbox', { name: /card expiration date/i });
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes by default', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const container = screen.getByRole('textbox', { name: /card expiration date/i });
      expect(container).toHaveAttribute('aria-label', 'Card expiration date');
      expect(container).toHaveAttribute('tabindex', '-1');
    });

    it('accepts custom ARIA attributes', () => {
      renderWithStripe(
        <CardExpirationDateInput
          onChange={mockOnChange}
          aria-label="Custom expiry label"
          aria-describedby="error-message"
        />
      );

      const container = screen.getByRole('textbox', { name: /custom expiry label/i });
      expect(container).toHaveAttribute('aria-label', 'Custom expiry label');
      expect(container).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('updates aria-invalid when error occurs', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

      // Trigger error state
      (input as any).dataset.value = 'error';
      fireEvent.click(input);

      expect(container).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Event Handling', () => {
    it('calls onChange when Stripe element changes', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      (input as any).dataset.value = '12/25';
      fireEvent.click(input);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          complete: true,
          empty: false,
          elementType: 'cardExpiry',
        })
      );
    });

    it('calls onFocus when element receives focus', () => {
      renderWithStripe(
        <CardExpirationDateInput 
          onChange={mockOnChange}
          onFocus={mockOnFocus}
        />
      );

      const input = screen.getByTestId('card-expiry-element');
      fireEvent.focus(input);

      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('calls onBlur when element loses focus', () => {
      renderWithStripe(
        <CardExpirationDateInput 
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByTestId('card-expiry-element');
      fireEvent.blur(input);

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('handles focus state correctly', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

      // Focus should add focus styling
      fireEvent.focus(input);
      expect(container).toHaveClass('ring-border-focus');

      // Blur should remove focus styling
      fireEvent.blur(input);
      expect(container).not.toHaveClass('ring-border-focus');
    });

    it('handles error state correctly', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

      // Trigger error
      (input as any).dataset.value = 'error';
      fireEvent.click(input);
      expect(container).toHaveClass('ring-border-error');

      // Clear error
      (input as any).dataset.value = '12/25';
      fireEvent.click(input);
      expect(container).not.toHaveClass('ring-border-error');
    });
  });

  describe('Disabled State', () => {
    it('handles disabled state correctly', () => {
      renderWithStripe(
        <CardExpirationDateInput 
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

      expect(input).toHaveAttribute('data-disabled', 'true');
      expect(container).toHaveClass('bg-surface-disabled', 'cursor-not-allowed', 'opacity-60');
    });
  });

  describe('Design System Integration', () => {
    it('applies correct default styling classes', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const container = screen.getByRole('textbox', { name: /card expiration date/i });
      expect(container).toHaveClass(
        'py-2.5',
        'px-3',
        'rounded-md',
        'transition-all',
        'duration-200',
        'bg-surface-tertiary'
      );
    });

    it('applies focus styling when focused', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

      fireEvent.focus(input);
      expect(container).toHaveClass(
        'ring-2',
        'ring-border-focus',
        'bg-surface-primary'
      );
    });

    it('applies error styling when error occurs', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      const container = screen.getByRole('textbox', { name: /card expiration date/i });

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
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');
      expect(input).toHaveAttribute('data-placeholder', 'MM / YY');
    });

    it('handles Stripe element state changes', () => {
      renderWithStripe(
        <CardExpirationDateInput onChange={mockOnChange} />
      );

      const input = screen.getByTestId('card-expiry-element');

      // Test empty state
      (input as any).dataset.value = '';
      fireEvent.click(input);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          empty: true,
          complete: false,
        })
      );

      // Test complete state
      (input as any).dataset.value = '12/25';
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
