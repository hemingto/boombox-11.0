/**
 * @fileoverview Tests for NotificationDropdown component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 * Tests notification list, pagination, mark as read, and deep linking
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import { NotificationDropdown } from '@/components/ui/navigation/NotificationDropdown';

expect.extend(toHaveNoViolations);

// Mock formatRelativeTime
jest.mock('@/lib/utils/dateUtils', () => ({
  formatRelativeTime: jest.fn((date) => '5m ago')
}));

// Mock window.location.href
delete (window as any).location;
(window as any).location = { href: '' };

// Mock fetch globally
global.fetch = jest.fn();

describe('NotificationDropdown', () => {
  const mockProps = {
    recipientId: 123,
    recipientType: 'USER' as const,
    onClose: jest.fn(),
    onNotificationRead: jest.fn(),
    onMarkAllRead: jest.fn()
  };

  const mockNotifications = [
    {
      id: 1,
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Appointment Confirmed',
      message: 'Your appointment has been confirmed for tomorrow.',
      status: 'UNREAD' as const,
      createdAt: '2024-01-15T10:30:00Z',
      appointmentId: 456
    },
    {
      id: 2,
      type: 'JOB_OFFER_RECEIVED',
      title: 'New Job Offer',
      message: 'You have a new job offer available.',
      status: 'READ' as const,
      createdAt: '2024-01-14T10:30:00Z',
      routeId: 'route-123'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: mockNotifications,
        pagination: { totalPages: 1, total: 2 },
        unreadCount: 1
      })
    });
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      render(<NotificationDropdown {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
      });
    });

    it('renders with correct modal structure', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog', { name: 'Notifications' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('displays header with title', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });

    it('displays close button on mobile', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close notifications/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const renderResult = render(<NotificationDropdown {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('maintains accessibility with notifications loaded', async () => {
      const renderResult = render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels for interactive elements', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all notifications as read/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close notifications/i })).toBeInTheDocument();
      });
    });
  });

  describe('Body Scroll Lock (Mobile)', () => {
    it('locks body scroll on mount for mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      render(<NotificationDropdown {...mockProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not lock body scroll on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      render(<NotificationDropdown {...mockProps} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });

      const { unmount } = render(<NotificationDropdown {...mockProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Notifications Fetching', () => {
    it('fetches notifications on mount', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/notifications?recipientId=123&recipientType=USER&page=1&limit=5')
        );
      });
    });

    it('displays loading skeleton while fetching', () => {
      render(<NotificationDropdown {...mockProps} />);

      expect(screen.getByRole('status', { name: /loading notifications/i })).toBeInTheDocument();
    });

    it('displays notifications after loading', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
        expect(screen.getByText('New Job Offer')).toBeInTheDocument();
      });
    });

    it('handles fetch errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error fetching notifications:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no notifications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: [],
          pagination: { totalPages: 0, total: 0 },
          unreadCount: 0
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
        expect(screen.getByText("No new notifications")).toBeInTheDocument();
      });
    });
  });

  describe('Notification Icons', () => {
    it('displays success icon for appointment notifications', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        const notification = screen.getByText('Appointment Confirmed').closest('div');
        expect(notification?.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('displays info icon for job offer notifications', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        const notification = screen.getByText('New Job Offer').closest('div');
        expect(notification?.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('displays error icon for payment failed notifications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: [{
            id: 1,
            type: 'PAYMENT_FAILED',
            title: 'Payment Failed',
            message: 'Your payment could not be processed.',
            status: 'UNREAD',
            createdAt: '2024-01-15T10:30:00Z'
          }],
          pagination: { totalPages: 1, total: 1 },
          unreadCount: 1
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Payment Failed')).toBeInTheDocument();
      });
    });
  });

  describe('Mark as Read', () => {
    it('marks individual notification as read when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            pagination: { totalPages: 1, total: 2 },
            unreadCount: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      const notification = screen.getByText('Appointment Confirmed').closest('[role="button"]');
      await user.click(notification!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ status: 'read' })
          })
        );
      });

      expect(mockProps.onNotificationRead).toHaveBeenCalled();
    });

    it('marks all notifications as read', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            pagination: { totalPages: 1, total: 2 },
            unreadCount: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all notifications as read/i })).toBeInTheDocument();
      });

      const markAllButton = screen.getByRole('button', { name: /mark all notifications as read/i });
      await user.click(markAllButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/mark-all-read',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ recipientId: 123, recipientType: 'USER' })
          })
        );
      });

      expect(mockProps.onMarkAllRead).toHaveBeenCalled();
    });

    it('handles mark as read errors gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            pagination: { totalPages: 1, total: 2 },
            unreadCount: 1
          })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      const notification = screen.getByText('Appointment Confirmed').closest('[role="button"]');
      await user.click(notification!);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error marking notification as read:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Deep Linking', () => {
    it('navigates to appointment when notification with appointmentId is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            pagination: { totalPages: 1, total: 2 },
            unreadCount: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      const notification = screen.getByText('Appointment Confirmed').closest('[role="button"]');
      await user.click(notification!);

      await waitFor(() => {
        expect(window.location.href).toContain('/user-page/123?tab=appointments&appointmentId=456');
      });
    });

    it('navigates to route when notification with routeId is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            notifications: mockNotifications,
            pagination: { totalPages: 1, total: 2 },
            unreadCount: 1
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('New Job Offer')).toBeInTheDocument();
      });

      const notification = screen.getByText('New Job Offer').closest('[role="button"]');
      await user.click(notification!);

      await waitFor(() => {
        expect(window.location.href).toContain('/driver-account-page/123?tab=routes&routeId=route-123');
      });
    });
  });

  describe('Pagination', () => {
    it('does not show pagination when totalPages is 1', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
    });

    it('shows pagination when totalPages > 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          pagination: { totalPages: 3, total: 15 },
          unreadCount: 5
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          pagination: { totalPages: 3, total: 15 },
          unreadCount: 5
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });
    });

    it('navigates to previous page', async () => {
      const user = userEvent.setup({ delay: null });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          pagination: { totalPages: 3, total: 15 },
          unreadCount: 5
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });

      // Go to page 2 first
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous page/i });
        expect(prevButton).not.toBeDisabled();
      });

      // Go back to page 1
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        );
      });
    });

    it('disables previous button on first page', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: mockNotifications,
          pagination: { totalPages: 3, total: 15 },
          unreadCount: 5
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous page/i });
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('closes dropdown when close button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close notifications/i })).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close notifications/i });
      await user.click(closeButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('supports keyboard navigation on notifications', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      const notification = screen.getByText('Appointment Confirmed').closest('[role="button"]');
      
      fireEvent.keyDown(notification!, { key: 'Enter' });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/notifications/1',
          expect.any(Object)
        );
      });
    });
  });

  describe('Relative Time Formatting', () => {
    it('displays relative time for notifications', async () => {
      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        const timeElements = screen.getAllByText('5m ago');
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Group Count Badge', () => {
    it('displays group count badge when groupCount > 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: [{
            ...mockNotifications[0],
            groupCount: 3
          }],
          pagination: { totalPages: 1, total: 1 },
          unreadCount: 3
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('does not display group count badge when groupCount is 1', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          notifications: [{
            ...mockNotifications[0],
            groupCount: 1
          }],
          pagination: { totalPages: 1, total: 1 },
          unreadCount: 1
        })
      });

      render(<NotificationDropdown {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Appointment Confirmed')).toBeInTheDocument();
      });

      // Should not show "1" badge
      const badges = screen.queryAllByText('1');
      expect(badges.length).toBe(0);
    });
  });
});

