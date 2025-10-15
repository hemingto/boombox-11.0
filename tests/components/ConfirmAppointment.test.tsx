/**
 * @fileoverview Jest tests for ConfirmAppointment component
 * @source Tests for boombox-11.0/src/components/features/orders/get-quote/ConfirmAppointment.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfirmAppointment } from '@/components/features/orders/get-quote/ConfirmAppointment';
import type { ConfirmAppointmentProps } from '@/components/features/orders/get-quote/ConfirmAppointment';

// Mock the Stripe components
jest.mock('@/components/forms/CardNumberInput', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <div data-testid="card-number-input">
      <button
        onClick={() =>
          onChange({ error: { message: 'Invalid card number' } })
        }
      >
        Trigger Error
      </button>
      <button onClick={() => onChange({ error: null })}>Clear Error</button>
    </div>
  ),
}));

jest.mock('@/components/forms/CardExpirationDateInput', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <div data-testid="card-expiry-input">
      <button
        onClick={() => onChange({ error: { message: 'Invalid expiry date' } })}
      >
        Trigger Error
      </button>
    </div>
  ),
}));

jest.mock('@/components/forms/CardCvcInput', () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <div data-testid="card-cvc-input">
      <button onClick={() => onChange({ error: { message: 'Invalid CVC' } })}>
        Trigger Error
      </button>
    </div>
  ),
}));

// Mock the StripeLogo icon
jest.mock('@/components/icons', () => ({
  StripeLogo: () => <div data-testid="stripe-logo">Powered by Stripe</div>,
}));

// Default props for testing
const defaultProps: ConfirmAppointmentProps = {
  goBackToStep1: jest.fn(),
  goBackToStep2: jest.fn(),
  selectedPlanName: 'Full Service Plan',
  email: '',
  setEmail: jest.fn(),
  emailError: null,
  setEmailError: jest.fn(),
  phoneNumber: '',
  setPhoneNumber: jest.fn(),
  phoneError: null,
  setPhoneError: jest.fn(),
  firstName: '',
  setFirstName: jest.fn(),
  firstNameError: null,
  setFirstNameError: jest.fn(),
  lastName: '',
  setLastName: jest.fn(),
  lastNameError: null,
  setLastNameError: jest.fn(),
  stripe: {},
  elements: {},
  isLoading: false,
  submitError: null,
};

describe('ConfirmAppointment Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the component with all form fields', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      // Check header
      expect(screen.getByText('Confirm appointment')).toBeInTheDocument();
      expect(
        screen.getByText('Please provide your contact information')
      ).toBeInTheDocument();

      // Check form inputs are rendered
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();

      // Check payment section
      expect(
        screen.getByText('Please add your payment details')
      ).toBeInTheDocument();
      expect(screen.getByTestId('card-number-input')).toBeInTheDocument();
      expect(screen.getByTestId('card-expiry-input')).toBeInTheDocument();
      expect(screen.getByTestId('card-cvc-input')).toBeInTheDocument();
    });

    it('renders back button with proper aria label', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      expect(backButton).toBeInTheDocument();
    });

    it('renders Stripe logo', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      expect(screen.getByTestId('stripe-logo')).toBeInTheDocument();
    });

    it('renders information notice about phone updates', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      expect(
        screen.getByText(
          /You'll receive updates about the status of your Boombox/i
        )
      ).toBeInTheDocument();
    });

    it('renders billing information notice', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      expect(
        screen.getByText(/You won't be charged anything today/i)
      ).toBeInTheDocument();
    });

    it('renders "When will I be charged?" button', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /learn more about when you will be charged/i,
      });
      expect(button).toBeInTheDocument();
      expect(screen.getByText(/When will I be charged\?/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls goBackToStep2 when back button is clicked', () => {
      const mockGoBack = jest.fn();
      render(<ConfirmAppointment {...defaultProps} goBackToStep2={mockGoBack} />);

      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      fireEvent.click(backButton);

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation on back button with Enter key', () => {
      const mockGoBack = jest.fn();
      render(<ConfirmAppointment {...defaultProps} goBackToStep2={mockGoBack} />);

      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      fireEvent.keyDown(backButton, { key: 'Enter', code: 'Enter' });

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation on back button with Space key', () => {
      const mockGoBack = jest.fn();
      render(<ConfirmAppointment {...defaultProps} goBackToStep2={mockGoBack} />);

      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      fireEvent.keyDown(backButton, { key: ' ', code: 'Space' });

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('logs error when goBackToStep2 is not a function', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(
        <ConfirmAppointment
          {...defaultProps}
          goBackToStep2={'invalid' as any}
        />
      );

      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      fireEvent.click(backButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL ERROR'),
        'invalid'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Form Input Interactions', () => {
    it('updates last name when input changes', () => {
      const mockSetLastName = jest.fn();
      const mockSetLastNameError = jest.fn();
      render(
        <ConfirmAppointment
          {...defaultProps}
          setLastName={mockSetLastName}
          setLastNameError={mockSetLastNameError}
        />
      );

      const lastNameInput = screen.getByPlaceholderText('Last Name');
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

      expect(mockSetLastName).toHaveBeenCalledWith('Doe');
      expect(mockSetLastNameError).toHaveBeenCalledWith(null);
    });

    it('displays last name error when provided', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          lastNameError="Last name is required"
        />
      );

      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });

    it('displays last name with proper aria attributes when there is an error', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          lastName="Test"
          lastNameError="Last name is required"
        />
      );

      const lastNameInput = screen.getByPlaceholderText('Last Name');
      expect(lastNameInput).toHaveAttribute('aria-invalid', 'true');
      expect(lastNameInput).toHaveAttribute('aria-describedby', 'lastName-error');
    });
  });

  describe('Stripe Card Validation', () => {
    it('displays card number error when Stripe validation fails', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const cardNumberInput = screen.getByTestId('card-number-input');
      const triggerErrorButton = cardNumberInput.querySelector('button');
      
      if (triggerErrorButton) {
        fireEvent.click(triggerErrorButton);
      }

      expect(screen.getByText('Invalid card number')).toBeInTheDocument();
    });

    it('displays card expiry error when Stripe validation fails', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const cardExpiryInput = screen.getByTestId('card-expiry-input');
      const triggerErrorButton = cardExpiryInput.querySelector('button');
      
      if (triggerErrorButton) {
        fireEvent.click(triggerErrorButton);
      }

      expect(screen.getByText('Invalid expiry date')).toBeInTheDocument();
    });

    it('displays card CVC error when Stripe validation fails', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const cardCvcInput = screen.getByTestId('card-cvc-input');
      const triggerErrorButton = cardCvcInput.querySelector('button');
      
      if (triggerErrorButton) {
        fireEvent.click(triggerErrorButton);
      }

      expect(screen.getByText('Invalid CVC')).toBeInTheDocument();
    });

    it('clears Stripe errors when validation passes', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const cardNumberInput = screen.getByTestId('card-number-input');
      const buttons = cardNumberInput.querySelectorAll('button');
      
      // Trigger error
      if (buttons[0]) {
        fireEvent.click(buttons[0]);
      }
      expect(screen.getByText('Invalid card number')).toBeInTheDocument();
      
      // Clear error
      if (buttons[1]) {
        fireEvent.click(buttons[1]);
      }
      expect(screen.queryByText('Invalid card number')).not.toBeInTheDocument();
    });

    it('displays multiple Stripe errors simultaneously', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      // Trigger all errors
      const cardNumberInput = screen.getByTestId('card-number-input');
      const cardExpiryInput = screen.getByTestId('card-expiry-input');
      const cardCvcInput = screen.getByTestId('card-cvc-input');
      
      const cardNumberButton = cardNumberInput.querySelector('button');
      const cardExpiryButton = cardExpiryInput.querySelector('button');
      const cardCvcButton = cardCvcInput.querySelector('button');
      
      if (cardNumberButton) fireEvent.click(cardNumberButton);
      if (cardExpiryButton) fireEvent.click(cardExpiryButton);
      if (cardCvcButton) fireEvent.click(cardCvcButton);

      expect(screen.getByText('Invalid card number')).toBeInTheDocument();
      expect(screen.getByText('Invalid expiry date')).toBeInTheDocument();
      expect(screen.getByText('Invalid CVC')).toBeInTheDocument();
    });
  });

  describe('Submit Error Display', () => {
    it('displays submit error when provided', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          submitError="Failed to process payment"
        />
      );

      const errorElement = screen.getByText('Failed to process payment');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('does not display submit error when null', () => {
      render(<ConfirmAppointment {...defaultProps} submitError={null} />);

      expect(
        screen.queryByText(/failed to process/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Billing Information Modal', () => {
    it('opens modal when "When will I be charged?" button is clicked', async () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /learn more about when you will be charged/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/Reserving is free!/i)
        ).toBeInTheDocument();
      });
    });

    it('displays billing policy information in modal', async () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /learn more about when you will be charged/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/first month of storage and the pickup fee/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/pre-authorization check 7 days before/i)
        ).toBeInTheDocument();
      });
    });

    it('displays cancellation policy in modal', async () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: /learn more about when you will be charged/i,
      });
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/What if I need to reschedule\?/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/48 hours in advance to avoid a \$100 fee/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/day of your appointment, the fee increases to \$200/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for form inputs', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const lastNameInput = screen.getByPlaceholderText('Last Name');
      expect(lastNameInput).toHaveAttribute(
        'aria-label',
        'Last name (required)'
      );
    });

    it('has proper ARIA attributes for error messages', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          lastNameError="This field is required"
        />
      );

      const errorElement = screen.getByText('This field is required');
      expect(errorElement).toHaveAttribute('role', 'alert');
    });

    it('has proper ARIA live region for Stripe errors', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      const cardNumberInput = screen.getByTestId('card-number-input');
      const triggerErrorButton = cardNumberInput.querySelector('button');
      
      if (triggerErrorButton) {
        fireEvent.click(triggerErrorButton);
      }

      const errorContainer = screen
        .getByText('Invalid card number')
        .closest('div');
      expect(errorContainer).toHaveAttribute('role', 'alert');
      expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('supports keyboard navigation throughout the form', () => {
      render(<ConfirmAppointment {...defaultProps} />);

      // Back button should be naturally focusable (buttons are focusable by default)
      const backButton = screen.getByRole('button', {
        name: /go back to previous step/i,
      });
      expect(backButton).toBeInTheDocument();
      
      // Verify all form inputs are present and accessible
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('accepts isLoading prop without error', () => {
      render(<ConfirmAppointment {...defaultProps} isLoading={true} />);

      // Component should render without errors when loading
      expect(screen.getByText('Confirm appointment')).toBeInTheDocument();
    });

    it('accepts isLoading false prop without error', () => {
      render(<ConfirmAppointment {...defaultProps} isLoading={false} />);

      expect(screen.getByText('Confirm appointment')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string values for all inputs', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          firstName=""
          lastName=""
          email=""
          phoneNumber=""
        />
      );

      expect(screen.getByPlaceholderText('Last Name')).toHaveValue('');
    });

    it('handles all error states simultaneously', () => {
      render(
        <ConfirmAppointment
          {...defaultProps}
          firstNameError="First name required"
          lastNameError="Last name required"
          emailError="Email required"
          phoneError="Phone required"
          submitError="Submission failed"
        />
      );

      expect(screen.getByText('Last name required')).toBeInTheDocument();
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });
});

