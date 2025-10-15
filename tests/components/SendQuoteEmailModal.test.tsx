/**
 * @fileoverview Comprehensive tests for SendQuoteEmailModal component
 * @source boombox-11.0/src/components/forms/SendQuoteEmailModal.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendQuoteEmail, { SendQuoteEmailModal, SendQuoteEmailTrigger } from '@/components/forms/SendQuoteEmailModal';
import { QuoteService } from '@/lib/services/quoteService';
import type { QuoteData } from '@/lib/services/quoteService';

// Mock dependencies
jest.mock('@/lib/services/quoteService');
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: ({ children, open, title, onClose }: any) => 
    open ? (
      <div data-testid="modal" role="dialog">
        {title && <h2>{title}</h2>}
        <button onClick={onClose} data-testid="modal-close">Close</button>
        {children}
      </div>
    ) : null
}));

jest.mock('@/components/forms/EmailInput', () => ({
  __esModule: true,
  default: ({ value, onEmailChange, hasError, errorMessage, disabled, placeholder }: any) => (
    <div>
      <input
        data-testid="email-input"
        type="email"
        value={value}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
      {hasError && errorMessage && (
        <div data-testid="email-error">{errorMessage}</div>
      )}
    </div>
  )
}));

jest.mock('@/components/ui/primitives/Button/Button', () => ({
  Button: ({ children, onClick, disabled, loading, type, variant, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      data-testid={`button-${variant || 'default'}`}
      data-loading={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}));

jest.mock('@/components/ui/feedback/SuccessState', () => ({
  SuccessState: ({ title, message }: any) => (
    <div data-testid="success-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}));

const mockQuoteService = QuoteService as jest.Mocked<typeof QuoteService>;

const mockQuoteData: QuoteData = {
  address: '123 Test St, Test City, CA 90210',
  scheduledDate: new Date('2024-02-15T10:00:00Z'),
  scheduledTimeSlot: '10:00 AM - 12:00 PM',
  storageUnitCount: 2,
  storageUnitText: '2 storage units',
  selectedPlanName: 'Standard Plan',
  loadingHelpPrice: '$50.00',
  loadingHelpDescription: 'Loading help included',
  selectedInsurance: {
    label: 'Basic Coverage',
    price: '$10.00'
  },
  accessStorageUnitCount: 0,
  totalPrice: 150.00,
  isAccessStorage: false,
  zipCode: '90210'
};

describe('SendQuoteEmailModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    quoteData: mockQuoteData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuoteService.sendQuoteEmail.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Quote email sent successfully' }
    });
    mockQuoteService.validateQuoteData.mockReturnValue({ isValid: true });
  });

  describe('Rendering', () => {
    it('renders modal with email form when open', () => {
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Email your quote')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('button-ghost')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('button-primary')).toHaveTextContent('Send');
    });

    it('does not render modal when closed', () => {
      render(<SendQuoteEmailModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders helper text for email input', () => {
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      expect(screen.getByText("We'll send a copy of your quote to this email address.")).toBeInTheDocument();
    });

    it('disables send button when no email is entered', () => {
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const sendButton = screen.getByTestId('button-primary');
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when no quote data is provided', () => {
      render(<SendQuoteEmailModal {...defaultProps} quoteData={undefined} />);
      
      const sendButton = screen.getByTestId('button-primary');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Email Input Interaction', () => {
    it('enables send button when valid email is entered', async () => {
      const user = userEvent.setup();
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      
      expect(sendButton).not.toBeDisabled();
    });

    it('updates email value when typing', async () => {
      const user = userEvent.setup();
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput.value).toBe('test@example.com');
    });
  });

  describe('Form Submission', () => {
    it('calls QuoteService.sendQuoteEmail on form submission', async () => {
      const user = userEvent.setup();
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      expect(mockQuoteService.sendQuoteEmail).toHaveBeenCalledWith(
        'test@example.com',
        mockQuoteData
      );
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockQuoteService.sendQuoteEmail.mockReturnValue(pendingPromise as any);
      
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      expect(sendButton).toHaveAttribute('data-loading', 'true');
      expect(sendButton).toHaveTextContent('Loading...');
      
      // Resolve the promise to clean up
      resolvePromise!({ success: true, data: { success: true } });
    });

    it('shows success state after successful submission', async () => {
      const user = userEvent.setup();
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('success-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('A copy of your quote has been sent to your email address.')).toBeInTheDocument();
    });

    it('calls onSuccess callback after successful submission', async () => {
      const onSuccess = jest.fn();
      const user = userEvent.setup();
      
      render(<SendQuoteEmailModal {...defaultProps} onSuccess={onSuccess} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when API call fails', async () => {
      const user = userEvent.setup();
      mockQuoteService.sendQuoteEmail.mockResolvedValue({
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to send email'
        }
      });
      
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Failed to send email');
      });
    });

    it('calls onError callback when submission fails', async () => {
      const onError = jest.fn();
      const user = userEvent.setup();
      
      mockQuoteService.sendQuoteEmail.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error'
        }
      });
      
      render(<SendQuoteEmailModal {...defaultProps} onError={onError} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows validation error for invalid quote data', async () => {
      const user = userEvent.setup();
      mockQuoteService.validateQuoteData.mockReturnValue({
        isValid: false,
        error: 'Missing required field: address'
      });
      
      render(<SendQuoteEmailModal {...defaultProps} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Missing required field: address');
      });
    });
  });

  describe('Modal Interaction', () => {
    it('calls onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<SendQuoteEmailModal {...defaultProps} onClose={onClose} />);
      
      const cancelButton = screen.getByTestId('button-ghost');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when modal close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<SendQuoteEmailModal {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTestId('modal-close');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('prevents closing during loading state', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockQuoteService.sendQuoteEmail.mockReturnValue(pendingPromise as any);
      
      render(<SendQuoteEmailModal {...defaultProps} onClose={onClose} />);
      
      const emailInput = screen.getByTestId('email-input');
      const sendButton = screen.getByTestId('button-primary');
      const cancelButton = screen.getByTestId('button-ghost');
      
      await user.type(emailInput, 'test@example.com');
      await user.click(sendButton);
      
      // Try to close during loading
      await user.click(cancelButton);
      
      expect(onClose).not.toHaveBeenCalled();
      
      // Resolve the promise to clean up
      resolvePromise!({ success: true, data: { success: true } });
    });
  });
});

describe('SendQuoteEmailTrigger', () => {
  const defaultProps = {
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders trigger button', () => {
    render(<SendQuoteEmailTrigger {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Email your quote' });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    
    render(<SendQuoteEmailTrigger {...defaultProps} onClick={onClick} />);
    
    const button = screen.getByRole('button', { name: 'Email your quote' });
    await user.click(button);
    
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<SendQuoteEmailTrigger {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: 'Email your quote' });
    expect(button).toBeDisabled();
  });

  it('applies custom icon className', () => {
    render(<SendQuoteEmailTrigger {...defaultProps} iconClassName="custom-class" />);
    
    const icon = screen.getByRole('button').querySelector('svg');
    expect(icon).toHaveClass('custom-class');
  });
});

describe('SendQuoteEmail (Complete Component)', () => {
  const defaultProps = {
    quoteData: mockQuoteData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuoteService.sendQuoteEmail.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Quote email sent successfully' }
    });
    mockQuoteService.validateQuoteData.mockReturnValue({ isValid: true });
  });

  it('renders trigger button initially', () => {
    render(<SendQuoteEmail {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: 'Email your quote' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('opens modal when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<SendQuoteEmail {...defaultProps} />);
    
    const triggerButton = screen.getByRole('button', { name: 'Email your quote' });
    await user.click(triggerButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Email your quote')).toBeInTheDocument();
  });

  it('closes modal when close is triggered', async () => {
    const user = userEvent.setup();
    render(<SendQuoteEmail {...defaultProps} />);
    
    // Open modal
    const triggerButton = screen.getByRole('button', { name: 'Email your quote' });
    await user.click(triggerButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByTestId('modal-close');
    await user.click(closeButton);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('disables trigger when no quote data is provided', () => {
    render(<SendQuoteEmail quoteData={undefined} />);
    
    const button = screen.getByRole('button', { name: 'Email your quote' });
    expect(button).toBeDisabled();
  });

  it('passes callbacks to modal component', async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const user = userEvent.setup();
    
    render(<SendQuoteEmail {...defaultProps} onSuccess={onSuccess} onError={onError} />);
    
    // Open modal and submit
    const triggerButton = screen.getByRole('button', { name: 'Email your quote' });
    await user.click(triggerButton);
    
    const emailInput = screen.getByTestId('email-input');
    const sendButton = screen.getByTestId('button-primary');
    
    await user.type(emailInput, 'test@example.com');
    await user.click(sendButton);
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('test@example.com');
    });
  });
});
