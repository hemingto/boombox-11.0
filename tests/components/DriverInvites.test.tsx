/**
 * @fileoverview Tests for DriverInvites component
 * Following boombox-11.0 testing standards
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import DriverInvites from '@/components/features/service-providers/drivers/DriverInvites';

expect.extend(toHaveNoViolations);

// Mock Badge component
jest.mock('@/components/ui/primitives/Badge', () => ({
  Badge: function MockBadge({ label, variant }: { label: string; variant: string }) {
    return (
      <span data-testid={`badge-${variant}`} data-variant={variant}>
        {label}
      </span>
    );
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('DriverInvites', () => {
  const mockMoverId = 'mover-123';
  const mockInvites = [
    {
      email: 'driver1@example.com',
      status: 'pending',
      createdAt: '2025-01-01T00:00:00Z',
      token: 'token-1',
    },
    {
      email: 'driver2@example.com',
      status: 'accepted',
      createdAt: '2025-01-02T00:00:00Z',
      token: 'token-2',
    },
    {
      email: 'driver3@example.com',
      status: 'expired',
      createdAt: '2025-01-03T00:00:00Z',
      token: 'token-3',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
      if (url.includes('/driver-invites') && !options) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInvites),
        });
      }
      if (url.includes('/resend-invite') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders null while loading', () => {
      const { container } = render(<DriverInvites moverId={mockMoverId} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders null when there are no invites', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const { container } = render(<DriverInvites moverId={mockMoverId} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(container.firstChild).toBeNull();
    });

    it('renders heading when invites exist', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /driver invites/i })).toBeInTheDocument();
      });
    });

    it('renders table headers', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Driver Email')).toBeInTheDocument();
      });

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date Sent')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders all invite rows', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      expect(screen.getByText('driver2@example.com')).toBeInTheDocument();
      expect(screen.getByText('driver3@example.com')).toBeInTheDocument();
    });

    it('displays formatted dates', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dates.length).toBe(3);
      });
    });
  });

  describe('API Integration', () => {
    it('fetches invites from correct endpoint', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/moving-partners/mover-123/driver-invites'
        );
      });
    });

    it('handles fetch failure gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load driver invites')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('displays error state with proper styling', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const errorContainer = screen.getByRole('alert');
        expect(errorContainer).toBeInTheDocument();
        expect(errorContainer).toHaveClass('bg-surface-primary', 'rounded-md', 'shadow-custom-shadow');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Status Badge Display', () => {
    it('displays pending status badge', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const pendingBadge = screen.getByTestId('badge-pending');
        expect(pendingBadge).toBeInTheDocument();
        expect(pendingBadge).toHaveTextContent('Pending');
      });
    });

    it('displays accepted status badge', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const successBadge = screen.getByTestId('badge-success');
        expect(successBadge).toBeInTheDocument();
        expect(successBadge).toHaveTextContent('Accepted');
      });
    });

    it('displays expired status badge', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const errorBadge = screen.getByTestId('badge-error');
        expect(errorBadge).toBeInTheDocument();
        expect(errorBadge).toHaveTextContent('Expired');
      });
    });
  });

  describe('Resend Functionality', () => {
    it('displays resend button for pending invites', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const resendButtons = screen.getAllByRole('button', { name: /resend invitation/i });
        expect(resendButtons.length).toBeGreaterThan(0);
      });
    });

    it('calls resend API when button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/moving-partners/mover-123/resend-invite',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'token-1' }),
          })
        );
      });
    });

    it('shows sending state while request is in progress', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/driver-invites')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvites),
          });
        }
        if (url.includes('/resend-invite')) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });

    it('shows "Sent" confirmation after successful resend', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Sent')).toBeInTheDocument();
      });
    });

    it('resets "Sent" state after 30 seconds', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Sent')).toBeInTheDocument();
      });

      // Fast-forward time by 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        // Check that the specific button now says "Resend" instead of "Sent"
        const button = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
        expect(button).toHaveTextContent('Resend');
        expect(screen.queryByText('Sent')).not.toBeInTheDocument();
      });
    });

    it('disables button while sending', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/driver-invites')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvites),
          });
        }
        if (url.includes('/resend-invite')) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true }),
                }),
              100
            )
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toBeDisabled();
        expect(resendButton).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('disables button for accepted invites', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver2@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver2@example.com/i });
      expect(resendButton).toBeDisabled();
    });

    it('disables button for expired invites', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver3@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver3@example.com/i });
      expect(resendButton).toBeDisabled();
    });

    it('handles resend failure gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url.includes('/driver-invites')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvites),
          });
        }
        if (url.includes('/resend-invite')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Failed' }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Unable to resend invite')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      // Use real timers for this test to avoid jest-axe timeout issues
      jest.useRealTimers();
      
      const renderResult = render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
      
      // Restore fake timers
      jest.useFakeTimers();
    });

    it('has proper ARIA labelledby for section', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const section = screen.getByRole('heading', { name: /driver invites/i }).closest('section');
        expect(section).toHaveAttribute('aria-labelledby', 'driver-invites-heading');
      });
    });

    it('uses semantic table structure with roles', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getAllByRole('columnheader')).toHaveLength(4);
      });

      expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
    });

    it('has proper ARIA labels for resend buttons', async () => {
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('has proper aria-live region for errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container classes', async () => {
      const { container } = render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const tableContainer = container.querySelector('.bg-surface-primary');
      expect(tableContainer).toHaveClass('rounded-md', 'shadow-custom-shadow');
    });

    it('uses design system color tokens', async () => {
      const { container } = render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Driver Email')).toBeInTheDocument();
      });

      const headers = container.querySelectorAll('.text-text-secondary');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('renders as 4-column grid', async () => {
      const { container } = render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const gridContainers = container.querySelectorAll('.grid-cols-4');
      expect(gridContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Button States', () => {
    it('applies correct styling for "Sent" state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(resendButton).toHaveClass('bg-status-bg-success');
      });
    });

    it('maintains hover state for enabled buttons', async () => {
      const { container } = render(<DriverInvites moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('driver1@example.com')).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend invitation to driver1@example.com/i });
      expect(resendButton).toHaveClass('hover:bg-surface-disabled');
    });
  });
});

