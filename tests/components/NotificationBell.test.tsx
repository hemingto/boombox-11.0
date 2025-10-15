/**
 * @fileoverview Tests for NotificationBell component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * Tests notification bell functionality, unread count, polling, and dropdown toggle
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { NotificationBell } from '@/components/ui/navigation/NotificationBell';

expect.extend(toHaveNoViolations);

// Mock NotificationDropdown component
jest.mock('@/components/ui/navigation/NotificationDropdown', () => ({
  NotificationDropdown: function MockNotificationDropdown(props: any) {
    return (
      <div data-testid="notification-dropdown" role="dialog">
        Mock Notification Dropdown
        <button onClick={props.onClose}>Close</button>
        <button onClick={props.onNotificationRead}>Mark Read</button>
        <button onClick={props.onMarkAllRead}>Mark All Read</button>
      </div>
    );
  }
}));

// Mock useClickOutside hook
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn()
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('NotificationBell', () => {
  const mockProps = {
    recipientId: 123,
    recipientType: 'USER' as const,
    isDarkTheme: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ unreadCount: 5 })
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<NotificationBell {...mockProps} />);
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    it('renders with correct theme classes for dark theme', () => {
      render(<NotificationBell {...mockProps} isDarkTheme={true} />);
      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveClass('text-text-inverse');
    });

    it('renders with correct theme classes for light theme', () => {
      render(<NotificationBell {...mockProps} isDarkTheme={false} />);
      const button = screen.getByRole('button', { name: /notifications/i });
      expect(button).toHaveClass('text-text-primary');
    });

    it('displays outline bell icon when unread count is 0', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ unreadCount: 0 })
      });

      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /notifications/i });
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<NotificationBell {...mockProps} />);
      await testAccessibility(renderResult);
    });

    it('has proper aria-label without unread count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ unreadCount: 0 })
      });

      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
      });
    });

    it('has proper aria-label with unread count', async () => {
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications \(5 unread\)/i })).toBeInTheDocument();
      });
    });

    it('has proper aria-expanded attribute', async () => {
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /notifications/i });
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('has proper aria-haspopup attribute', async () => {
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /notifications/i });
        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      });
    });
  });

  describe('Unread Count Fetching', () => {
    it('fetches unread count on mount', async () => {
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/notifications?recipientId=123&recipientType=USER&status=UNREAD&limit=1')
        );
      });
    });

    it('displays unread count badge when count > 0', async () => {
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('caps unread count at 25', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ unreadCount: 30 })
      });

      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('25+')).toBeInTheDocument();
      });
    });

    it('does not display badge when count is 0', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ unreadCount: 0 })
      });

      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument();
      });
    });

    it('polls for updates every 30 seconds', async () => {
      render(<NotificationBell {...mockProps} />);

      // Initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // Fast-forward another 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    it('cleans up interval on unmount', async () => {
      const { unmount } = render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Fast-forward time - should not trigger additional fetches
      jest.advanceTimersByTime(30000);

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles fetch errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error fetching unread count:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('User Interactions', () => {
    it('opens dropdown when bell is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);

      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    });

    it('closes dropdown when bell is clicked again', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /notifications/i });
      
      // Open dropdown
      await user.click(button);
      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

      // Close dropdown
      await user.click(button);
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });

    it('decrements unread count when notification is read', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      // Open dropdown
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);

      // Trigger onNotificationRead
      const markReadButton = screen.getByText('Mark Read');
      await user.click(markReadButton);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('sets unread count to 0 when mark all as read', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      // Open dropdown
      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);

      // Trigger onMarkAllRead
      const markAllReadButton = screen.getByText('Mark All Read');
      await user.click(markAllReadButton);

      await waitFor(() => {
        expect(screen.queryByText('5')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Close Handler', () => {
    it('closes dropdown when onClose is called', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationBell {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /notifications/i });
      await user.click(button);

      expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

      // Trigger onClose from dropdown
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Recipient Type Variations', () => {
    it('handles DRIVER recipient type', async () => {
      render(<NotificationBell {...mockProps} recipientType="DRIVER" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('recipientType=DRIVER')
        );
      });
    });

    it('handles MOVER recipient type', async () => {
      render(<NotificationBell {...mockProps} recipientType="MOVER" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('recipientType=MOVER')
        );
      });
    });

    it('handles ADMIN recipient type', async () => {
      render(<NotificationBell {...mockProps} recipientType="ADMIN" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('recipientType=ADMIN')
        );
      });
    });
  });
});

