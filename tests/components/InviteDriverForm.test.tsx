/**
 * @fileoverview Tests for InviteDriverForm component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import InviteDriverForm from '@/components/features/service-providers/drivers/InviteDriverForm';

expect.extend(toHaveNoViolations);

// Mock fetch globally
global.fetch = jest.fn();

describe('InviteDriverForm', () => {
  const mockMoverId = 'mover-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InviteDriverForm moverId={mockMoverId} />);
      expect(screen.getByRole('heading', { name: /invite a driver/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/driver's email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send invite/i })).toBeInTheDocument();
    });

    it('renders form with proper structure', () => {
      const { container } = render(<InviteDriverForm moverId={mockMoverId} />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('displays helper text about invitation expiration', () => {
      render(<InviteDriverForm moverId={mockMoverId} />);
      expect(screen.getByText(/expires in 15 days/i)).toBeInTheDocument();
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<InviteDriverForm moverId={mockMoverId} />);
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with error state', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email address' }),
      });

      const renderResult = render(<InviteDriverForm moverId={mockMoverId} />);
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      // Enter email first to enable button
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      await testAccessibility(renderResult);
    });

    it('maintains accessibility with success state', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const renderResult = render(<InviteDriverForm moverId={mockMoverId} />);
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels and roles', () => {
      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const section = screen.getByRole('region', { name: /invite a driver/i });
      expect(section).toBeInTheDocument();
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  // REQUIRED: User interaction testing
  describe('User Interactions', () => {
    it('handles email input changes', async () => {
      const user = userEvent.setup();
      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('enables submit button when email is entered', async () => {
      const user = userEvent.setup();
      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      // Initially disabled (no email)
      expect(submitButton).toBeDisabled();
      
      // Enter email
      await user.type(emailInput, 'driver@example.com');
      
      // Should be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('prevents submission with empty email', async () => {
      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // Form submission and API integration
  describe('Form Submission', () => {
    it('submits form with correct data', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverId}/invite-driver`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'driver@example.com',
              expiresInDays: 15,
            }),
          })
        );
      });
    });

    it('displays loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (global.fetch as jest.Mock).mockImplementation(() => fetchPromise);

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      
      await user.type(emailInput, 'driver@example.com');
      
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      await user.click(submitButton);
      
      // Check loading state immediately after click
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending invitation/i })).toBeInTheDocument();
      });
      
      const loadingButton = screen.getByRole('button', { name: /sending invitation/i });
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
      expect(emailInput).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it('displays success message on successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/invitation sent successfully/i);
      });
    });

    it('clears form after successful submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(emailInput).toHaveValue('');
      });
    });

    it('displays error message on submission failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Driver already invited' }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/driver already invited/i);
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
      });
    });
  });

  // Design system integration
  describe('Design System Integration', () => {
    it('uses semantic color classes for error state', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      const { container } = render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Check that error container has correct classes
      const errorContainer = container.querySelector('.bg-status-bg-error');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('border-border-error');
    });

    it('uses semantic color classes for success state', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { container } = render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Check that success container has correct classes
      const successContainer = container.querySelector('.bg-status-bg-success');
      expect(successContainer).toBeInTheDocument();
    });

    it('applies form-group, form-label, and input-field classes', () => {
      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const label = screen.getByText(/driver's email/i);
      expect(label).toHaveClass('form-label');
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      expect(emailInput).toHaveClass('input-field');
      
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      expect(submitButton).toHaveClass('btn-primary');
    });
  });

  // Error state management
  describe('Error Handling', () => {
    it('connects error message to input with aria-describedby', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid email' }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'invalid@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Verify aria attributes are set when error is present
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('clears error when form is resubmitted', async () => {
      const user = userEvent.setup();
      
      // First submission fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      // Second submission succeeds
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  // Props and state
  describe('Props and State Management', () => {
    it('uses provided moverId in API request', async () => {
      const user = userEvent.setup();
      const customMoverId = 'custom-mover-id';
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<InviteDriverForm moverId={customMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${customMoverId}/invite-driver`,
          expect.any(Object)
        );
      });
    });

    it('includes expiresInDays in request body', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<InviteDriverForm moverId={mockMoverId} />);
      
      const emailInput = screen.getByLabelText(/driver's email/i);
      const submitButton = screen.getByRole('button', { name: /send invite/i });
      
      await user.type(emailInput, 'driver@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              email: 'driver@example.com',
              expiresInDays: 15,
            }),
          })
        );
      });
    });
  });
});

