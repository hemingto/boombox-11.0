/**
 * @fileoverview Tests for DriverContent component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import DriverContent from '@/components/features/service-providers/drivers/DriverContent';

expect.extend(toHaveNoViolations);

// Mock fetch
global.fetch = jest.fn();

// Mock DriverInvites component
jest.mock('@/components/features/service-providers/drivers/DriverInvites', () => ({
  DriverInvites: function MockDriverInvites({ moverId }: any) {
    return <div data-testid="mock-driver-invites">Driver Invites for {moverId}</div>;
  }
}));

// Mock MoverPartnerDriver component (default export)
jest.mock('@/components/features/service-providers/drivers/MoverPartnerDriver', () => {
  const MockMoverPartnerDriver = ({ moverId }: any) => {
    return <div data-testid="mock-mover-partner-driver">Driver list for {moverId}</div>;
  };
  MockMoverPartnerDriver.displayName = 'MockMoverPartnerDriver';
  return {
    __esModule: true,
    default: MockMoverPartnerDriver
  };
});

// Mock Modal component (named export)
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: function MockModal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
      <div data-testid="mock-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {title && <h2 id="modal-title">{title}</h2>}
        <button onClick={onClose} aria-label="Close modal">Close</button>
        <div>{children}</div>
      </div>
    );
  }
}));

// Mock EmailInput component (default export)
jest.mock('@/components/forms/EmailInput', () => {
  const MockEmailInput = ({ value, onEmailChange, hasError, errorMessage, placeholder, 'aria-label': ariaLabel }: any) => {
    return (
      <div data-testid="mock-email-input">
        <input
          type="email"
          value={value}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel || placeholder}
          aria-invalid={hasError}
        />
        {hasError && errorMessage && <div role="alert">{errorMessage}</div>}
      </div>
    );
  };
  MockEmailInput.displayName = 'MockEmailInput';
  return {
    __esModule: true,
    default: MockEmailInput
  };
});

// Mock PhoneNumberInput component (default export)
jest.mock('@/components/forms/PhoneNumberInput', () => {
  const MockPhoneNumberInput = ({ value, onChange, hasError, errorMessage, placeholder, label }: any) => {
    return (
      <div data-testid="mock-phone-input">
        {label && <label>{label}</label>}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label || placeholder}
          aria-invalid={hasError}
        />
        {hasError && errorMessage && <div role="alert">{errorMessage}</div>}
      </div>
    );
  };
  MockPhoneNumberInput.displayName = 'MockPhoneNumberInput';
  return {
    __esModule: true,
    default: MockPhoneNumberInput
  };
});

describe('DriverContent', () => {
  const mockMoverId = 'mover-123';

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.getByRole('region', { name: /driver management/i })).toBeInTheDocument();
    });

    it('displays heading', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.getByRole('heading', { name: /your drivers/i })).toBeInTheDocument();
    });

    it('renders Add Driver button', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.getByRole('button', { name: /add new driver/i })).toBeInTheDocument();
    });

    it('renders DriverInvites component with moverId', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.getByTestId('mock-driver-invites')).toBeInTheDocument();
      expect(screen.getByText(/driver invites for mover-123/i)).toBeInTheDocument();
    });

    it('renders MoverPartnerDriver component', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.getByTestId('mock-mover-partner-driver')).toBeInTheDocument();
      expect(screen.getByText(/driver list for mover-123/i)).toBeInTheDocument();
    });

    it('modal is closed by default', () => {
      render(<DriverContent moverId={mockMoverId} />);
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<DriverContent moverId={mockMoverId} />);
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels', () => {
      render(<DriverContent moverId={mockMoverId} />);
      
      expect(screen.getByRole('region', { name: /driver management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new driver/i })).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<DriverContent moverId={mockMoverId} />);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('maintains accessibility with modal open', async () => {
      const user = userEvent.setup();
      const renderResult = render(<DriverContent moverId={mockMoverId} />);
      
      const addButton = screen.getByRole('button', { name: /add new driver/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });
      
      await testAccessibility(renderResult);
    });
  });

  // REQUIRED: User interaction testing
  describe('Modal Interactions', () => {
    it('opens modal when Add Driver button is clicked', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      const addButton = screen.getByRole('button', { name: /add new driver/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
        expect(screen.getByText(/send driver invite/i)).toBeInTheDocument();
      });
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      // Open modal
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });

    it('resets form when modal is opened', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      // Open modal
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });
      
      // Email input should be empty
      const emailInput = screen.getByLabelText(/driver email/i);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Input Method Toggle', () => {
    it('displays email input by default', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-email-input')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-phone-input')).not.toBeInTheDocument();
      });
    });

    it('toggles to phone input when text link is clicked', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-email-input')).toBeInTheDocument();
      });
      
      // Click toggle button
      const toggleButton = screen.getByRole('button', { name: /switch to phone invitation/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-email-input')).not.toBeInTheDocument();
        expect(screen.getByTestId('mock-phone-input')).toBeInTheDocument();
      });
    });

    it('toggles back to email input', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      // Switch to phone
      await user.click(screen.getByRole('button', { name: /switch to phone invitation/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-phone-input')).toBeInTheDocument();
      });
      
      // Switch back to email
      const toggleButton = screen.getByRole('button', { name: /switch to email invitation/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-email-input')).toBeInTheDocument();
        expect(screen.queryByTestId('mock-phone-input')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits invitation with email', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      // Enter email
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverId}/invite-driver`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'driver@example.com',
              phone: undefined,
              expiresInDays: 15,
            }),
          })
        );
      });
    });

    it('submits invitation with phone', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      // Switch to phone input
      await user.click(screen.getByRole('button', { name: /switch to phone invitation/i }));
      
      // Enter phone
      const phoneInput = screen.getByLabelText(/driver phone/i);
      await user.type(phoneInput, '4155551234');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverId}/invite-driver`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: undefined,
              phone: '4155551234',
              expiresInDays: 15,
            }),
          })
        );
      });
    });

    it('displays success message after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/success!/i)).toBeInTheDocument();
        expect(screen.getByText(/the invitation has been sent successfully/i)).toBeInTheDocument();
      });
    });

    it('displays error message on failed submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email address' }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email address/i);
      });
    });

    it('disables submit button when email is empty', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when phone is empty', async () => {
      const user = userEvent.setup();
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      // Switch to phone
      await user.click(screen.getByRole('button', { name: /switch to phone invitation/i }));
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      expect(submitButton).toBeDisabled();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100))
      );
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      // Check for loading text
      expect(screen.getByText(/sending\.\.\./i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/success!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Callbacks', () => {
    it('calls onDriverInvited after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnDriverInvited = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} onDriverInvited={mockOnDriverInvited} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnDriverInvited).toHaveBeenCalledTimes(1);
      });
    });

    it('does not throw error when callback not provided', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/success!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Design System Integration', () => {
    it('uses semantic color classes for buttons', () => {
      render(<DriverContent moverId={mockMoverId} />);
      
      const addButton = screen.getByRole('button', { name: /add new driver/i });
      expect(addButton).toHaveClass('bg-primary');
      expect(addButton).toHaveClass('text-text-inverse');
      expect(addButton).toHaveClass('hover:bg-primary-hover');
    });

    it('applies transition classes for smooth interactions', () => {
      render(<DriverContent moverId={mockMoverId} />);
      
      const addButton = screen.getByRole('button', { name: /add new driver/i });
      expect(addButton).toHaveClass('transition-colors');
      expect(addButton).toHaveClass('duration-200');
    });

    it('uses proper focus styles', () => {
      render(<DriverContent moverId={mockMoverId} />);
      
      const addButton = screen.getByRole('button', { name: /add new driver/i });
      expect(addButton).toHaveClass('focus:outline-none');
      expect(addButton).toHaveClass('focus:ring-2');
      expect(addButton).toHaveClass('focus:ring-border-focus');
    });
  });

  describe('Edge Cases', () => {
    it('applies custom className', () => {
      const { container } = render(<DriverContent moverId={mockMoverId} className="custom-class" />);
      
      const region = screen.getByRole('region');
      expect(region).toHaveClass('custom-class');
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send driver invitation/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
      });
    });

    it('closes modal from success state', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      render(<DriverContent moverId={mockMoverId} />);
      
      await user.click(screen.getByRole('button', { name: /add new driver/i }));
      
      const emailInput = screen.getByLabelText(/driver email/i);
      await user.type(emailInput, 'driver@example.com');
      
      await user.click(screen.getByRole('button', { name: /send driver invitation/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/success!/i)).toBeInTheDocument();
      });
      
      // Click Done button
      const doneButton = screen.getByRole('button', { name: /close success message/i });
      await user.click(doneButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });
  });
});

