/**
 * @fileoverview Tests for MoverPartnerDriver component
 * Following boombox-11.0 testing standards (97→0 failure learnings)
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { testAccessibility } from '../utils/accessibility';
import MoverPartnerDriver from '@/components/features/service-providers/drivers/MoverPartnerDriver';

expect.extend(toHaveNoViolations);

// Mock fetch
global.fetch = jest.fn();

// Mock Modal component (named export)
jest.mock('@/components/ui/primitives/Modal/Modal', () => ({
  Modal: function MockModal({ open, onClose, title, children }: any) {
    if (!open) return null;
    return (
      <div data-testid="mock-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">{title}</h2>
        <button onClick={onClose} aria-label="Close modal">Close</button>
        <div>{children}</div>
      </div>
    );
  }
}));

// Mock useClickOutside hook
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn((callback) => {
    // Return a ref object
    return { current: null };
  })
}));

describe('MoverPartnerDriver', () => {
  const mockMoverId = 'mover-123';
  const mockDrivers = [
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '415-555-0001',
      isActive: true,
      isApproved: true,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phoneNumber: '415-555-0002',
      isActive: false,
      isApproved: false,
      createdAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 3,
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      phoneNumber: '415-555-0003',
      isActive: true,
      isApproved: true,
      createdAt: '2024-01-25T10:00:00Z',
    },
  ];

  // REQUIRED: Test cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  // REQUIRED: Basic rendering
  describe('Rendering', () => {
    it('renders without crashing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading drivers/i })).not.toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<MoverPartnerDriver moverId={mockMoverId} />);
      
      expect(screen.getByRole('status', { name: /loading drivers/i })).toBeInTheDocument();
    });

    it('fetches drivers on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(`/api/moving-partners/${mockMoverId}/drivers`);
      });
    });

    it('displays drivers list when loaded', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('displays driver information correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('415-555-0001')).toBeInTheDocument();
      });
    });
  });

  // MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      const renderResult = render(<MoverPartnerDriver moverId={mockMoverId} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      await testAccessibility(renderResult);
    });

    it('has proper ARIA labels for controls', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/search drivers by name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/filter drivers/i)).toBeInTheDocument();
      });
    });

    it('uses semantic HTML structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /drivers list/i })).toBeInTheDocument();
      });
    });

    it('has proper table structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getAllByRole('columnheader')).toHaveLength(5);
        expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 3 drivers
      });
    });
  });

  // Search functionality
  describe('Search Functionality', () => {
    it('filters drivers by name', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search drivers by name/i);
      await user.type(searchInput, 'jane');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search drivers by name/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText(/no drivers found matching your search/i)).toBeInTheDocument();
      });
    });

    it('search is case insensitive', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search drivers by name/i);
      await user.type(searchInput, 'JOHN');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });
  });

  // Filter functionality
  describe('Filter Functionality', () => {
    it('opens filter dropdown when clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const filterButton = screen.getByLabelText(/filter drivers/i);
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /filter options/i })).toBeInTheDocument();
      });
    });

    it('filters by approved status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open filter
      const filterButton = screen.getByLabelText(/filter drivers/i);
      await user.click(filterButton);

      // Select "Approved" filter
      const approvedOption = screen.getByRole('menuitem', { name: /^approved$/i });
      await user.click(approvedOption);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters by unapproved status', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Open filter
      const filterButton = screen.getByLabelText(/filter drivers/i);
      await user.click(filterButton);

      // Select "Unapproved" filter
      const unapprovedOption = screen.getByRole('menuitem', { name: /unapproved/i });
      await user.click(unapprovedOption);

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('resets to page 1 when filter changes', async () => {
      const user = userEvent.setup();
      // Create 25 drivers: 13 approved (2 pages), 12 unapproved
      const manyDrivers = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        firstName: `Driver${i + 1}`,
        lastName: 'Test',
        email: `driver${i + 1}@example.com`,
        phoneNumber: `415-555-${String(i + 1).padStart(4, '0')}`,
        isActive: i % 2 === 0,
        isApproved: i % 2 === 0,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByLabelText(/next page/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
      });

      // Change filter to approved - should reset to page 1 and show pagination (13 approved = 2 pages)
      const filterButton = screen.getByLabelText(/filter drivers/i);
      await user.click(filterButton);

      const approvedOption = screen.getByRole('menuitem', { name: /^approved$/i });
      await user.click(approvedOption);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      });
    });
  });

  // Status badges
  describe('Status Badges', () => {
    it('displays approved badge for approved drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        const approvedBadges = screen.getAllByText('Approved');
        expect(approvedBadges).toHaveLength(2); // John and Bob
        expect(approvedBadges[0]).toHaveClass('text-status-success');
      });
    });

    it('displays pending badge for unapproved drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        const pendingBadge = screen.getByText('Pending Approval');
        expect(pendingBadge).toBeInTheDocument();
        expect(pendingBadge).toHaveClass('text-status-warning');
      });
    });
  });

  // Remove driver functionality
  describe('Remove Driver', () => {
    it('opens confirmation modal when remove is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
        expect(screen.getByText(/remove driver/i)).toBeInTheDocument();
      });
    });

    it('removes driver when confirmed', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers.filter(d => d.id !== 1),
        });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click remove on first driver
      const removeButtons = screen.getAllByRole('button', { name: /remove john doe/i });
      await user.click(removeButtons[0]);

      // Confirm removal
      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm removing driver/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/moving-partners/${mockMoverId}/drivers/1`,
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel removing driver/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      });
    });

    it('shows loading state during removal', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers,
        })
        .mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true }),
          }), 100))
        );

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm removing driver/i });
      await user.click(confirmButton);

      expect(screen.getByText(/removing\.\.\./i)).toBeInTheDocument();
    });
  });

  // Pagination
  describe('Pagination', () => {
    it('displays pagination when drivers exceed page size', async () => {
      const manyDrivers = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        firstName: `Driver${i + 1}`,
        lastName: 'Test',
        email: `driver${i + 1}@example.com`,
        phoneNumber: `415-555-${String(i + 1).padStart(4, '0')}`,
        isActive: true,
        isApproved: true,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/drivers pagination/i)).toBeInTheDocument();
        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      });
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      const manyDrivers = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        firstName: `Driver${i + 1}`,
        lastName: 'Test',
        email: `driver${i + 1}@example.com`,
        phoneNumber: `415-555-${String(i + 1).padStart(4, '0')}`,
        isActive: true,
        isApproved: true,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Driver1 Test')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next page/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
        expect(screen.getByText('Driver11 Test')).toBeInTheDocument();
      });
    });

    it('disables previous button on first page', async () => {
      const manyDrivers = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        firstName: `Driver${i + 1}`,
        lastName: 'Test',
        email: `driver${i + 1}@example.com`,
        phoneNumber: `415-555-${String(i + 1).padStart(4, '0')}`,
        isActive: true,
        isApproved: true,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Driver1 Test')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText(/previous page/i);
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', async () => {
      const user = userEvent.setup();
      const manyDrivers = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        firstName: `Driver${i + 1}`,
        lastName: 'Test',
        email: `driver${i + 1}@example.com`,
        phoneNumber: `415-555-${String(i + 1).padStart(4, '0')}`,
        isActive: true,
        isApproved: true,
        createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => manyDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText('Driver1 Test')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next page/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
      });

      expect(nextButton).toBeDisabled();
    });
  });

  // Error state
  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
      });
    });

    it('provides retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry loading drivers/i })).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers,
        });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry loading drivers/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  // Empty state
  describe('Empty State', () => {
    it('displays empty state when no drivers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByText(/no drivers yet/i)).toBeInTheDocument();
        expect(screen.getByText(/your drivers will appear here/i)).toBeInTheDocument();
      });
    });
  });

  // Callbacks
  describe('Callbacks', () => {
    it('calls onDriversRefresh after successful fetch', async () => {
      const mockOnDriversRefresh = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} onDriversRefresh={mockOnDriversRefresh} />);

      await waitFor(() => {
        expect(mockOnDriversRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onDriversRefresh after removing driver', async () => {
      const user = userEvent.setup();
      const mockOnDriversRefresh = jest.fn();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers.filter(d => d.id !== 1),
        });

      render(<MoverPartnerDriver moverId={mockMoverId} onDriversRefresh={mockOnDriversRefresh} />);

      await waitFor(() => {
        expect(mockOnDriversRefresh).toHaveBeenCalledTimes(1);
      });

      mockOnDriversRefresh.mockClear();

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm removing driver/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDriversRefresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  // Design System Integration
  describe('Design System Integration', () => {
    it('uses semantic color classes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        const approvedBadges = screen.getAllByText('Approved');
        expect(approvedBadges[0]).toHaveClass('text-status-success');
        expect(approvedBadges[0]).toHaveClass('bg-status-bg-success');
      });
    });

    it('applies transition classes for smooth interactions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        const searchInput = screen.getByLabelText(/search drivers by name/i);
        expect(searchInput).toHaveClass('transition-colors');
        expect(searchInput).toHaveClass('duration-200');
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('applies custom className', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      });

      const { container } = render(<MoverPartnerDriver moverId={mockMoverId} className="custom-class" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('custom-class');
    });

    it('handles API returning non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      render(<MoverPartnerDriver moverId={mockMoverId} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/failed to fetch drivers/i);
      });
    });
  });
});

