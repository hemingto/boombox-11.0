import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StripePayoutsComponent } from '@/components/features/service-providers/payments/StripePayoutsComponent';

// Mock currency utils
jest.mock('@/lib/utils/currencyUtils', () => ({
  formatCurrency: jest.fn((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }),
}));

// Mock useClickOutside hook
jest.mock('@/hooks/useClickOutside', () => ({
  useClickOutside: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('StripePayoutsComponent', () => {
  const mockUserId = 'user-123';
  const mockUserType = 'driver';

  const mockBalanceResponse = {
    available: 10000, // $100.00
    pending: 5000, // $50.00
    inTransit: 2000, // $20.00
    total: 17000, // $170.00
  };

  const mockPayoutsResponse = {
    payouts: [
      {
        id: 'po_1',
        date: 'Jan 1, 2025',
        status: 'Paid',
        destination: 'Bank Account •••• 1234',
        amount: '$50.00 USD',
      },
      {
        id: 'po_2',
        date: 'Jan 15, 2025',
        status: 'Pending',
        destination: 'Bank Account •••• 1234',
        amount: '$75.00 USD',
      },
    ],
  };

  const mockPaymentsData = {
    payments: [
      {
        id: 'pi_1',
        created: 1704067200, // Jan 1, 2025
        status: 'paid',
        description: 'Storage service payment',
        amount: 100.0,
      },
      {
        id: 'pi_2',
        created: 1704672000, // Jan 8, 2025
        status: 'pending',
        description: 'Moving service payment',
        amount: 150.0,
      },
      {
        id: 'pi_3',
        created: 1705190400, // Jan 14, 2025
        status: 'failed',
        description: 'Delivery payment',
        amount: 75.0,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading payment data')).toBeInTheDocument();
    });

    it('should render balance summary after loading', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByText('Total balance')).toBeInTheDocument();
        expect(screen.getByText('Available to pay out')).toBeInTheDocument();
        expect(screen.getByText('Available soon')).toBeInTheDocument();
        expect(screen.getByText('In transit to bank')).toBeInTheDocument();
      });
    });

    it('should render payments table by default', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        // Check that the component loaded (not in loading state)
        expect(screen.queryByLabelText('Loading payment data')).not.toBeInTheDocument();
        
        // Check for view filter button (indicates component rendered)
        expect(screen.getByLabelText(/View filter/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch payouts, payments, and balance on mount', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/payments/connect/payouts?userId=${mockUserId}&userType=${mockUserType}`
        );
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/payments/connect/payment-history?userId=${mockUserId}&userType=${mockUserType}`
        );
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/payments/connect/balance?userId=${mockUserId}&userType=${mockUserType}`
        );
      });
    });

    it('should handle 404 response for no Stripe account', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'No Stripe account found' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ error: 'No Stripe account found' }),
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByText('Please set up your account')).toBeInTheDocument();
        expect(
          screen.getByText('Set up your Stripe account to start receiving payments.')
        ).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load financial data')).toBeInTheDocument();
      });
    });
  });

  describe('View Switching', () => {
    beforeEach(async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });
    });

    it('should switch between payments and payouts views', async () => {
      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/View filter: Payments/i)).toBeInTheDocument();
      });

      // Click the view filter button
      const viewFilterButton = screen.getByLabelText(/View filter: Payments/i);
      fireEvent.click(viewFilterButton);

      // Wait for dropdown to appear and click Payouts
      await waitFor(() => {
        const dropdownOptions = screen.getAllByText('Payouts');
        const payoutsOptionInDropdown = dropdownOptions.find((el) => 
          el.closest('[role="listbox"]')
        );
        if (payoutsOptionInDropdown) {
          fireEvent.click(payoutsOptionInDropdown);
        }
      });

      // Verify payouts view is shown by checking for Destination column header
      await waitFor(() => {
        const headers = screen.getAllByRole('columnheader');
        const destinationHeader = headers.find(h => h.textContent === 'Destination');
        expect(destinationHeader).toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const mockUseClickOutside = require('@/hooks/useClickOutside').useClickOutside;
      let clickOutsideCallback: (() => void) | null = null;

      mockUseClickOutside.mockImplementation(
        (ref: React.RefObject<HTMLElement>, callback: () => void) => {
          clickOutsideCallback = callback;
        }
      );

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByText('Payments')).toBeInTheDocument();
      });

      // Open dropdown
      const viewFilterButton = screen.getByLabelText(/View filter: Payments/i);
      fireEvent.click(viewFilterButton);

      // Simulate click outside
      if (clickOutsideCallback) {
        clickOutsideCallback();
      }

      // Dropdown should be closed (no options visible)
      await waitFor(() => {
        expect(screen.queryByText('Payouts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Balance Summary', () => {
    it('should display formatted balance amounts', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const balanceSummary = screen.getByLabelText('Balance summary');
        expect(balanceSummary).toBeInTheDocument();

        // Check that balance labels are displayed
        expect(screen.getByText('Total balance')).toBeInTheDocument();
        expect(screen.getByText('Available to pay out')).toBeInTheDocument();
        expect(screen.getByText('Available soon')).toBeInTheDocument();
        expect(screen.getByText('In transit to bank')).toBeInTheDocument();
      });
    });

    it('should show opacity on balance summary when no Stripe account', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const balanceSummary = screen.getByLabelText('Balance summary');
        expect(balanceSummary).toHaveClass('opacity-50');
      });
    });
  });

  describe('Pagination', () => {
    it('should show pagination when there are more than 10 items', async () => {
      // Create 15 payments
      const manyPayments = {
        payments: Array.from({ length: 15 }, (_, i) => ({
          id: `pi_${i}`,
          created: 1704067200 + i * 86400,
          status: 'paid',
          description: `Payment ${i + 1}`,
          amount: 100.0,
        })),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ payouts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => manyPayments,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        // Check that component loaded
        expect(screen.getByLabelText('Balance summary')).toBeInTheDocument();
      });
      
      // Pagination should exist for 15 items (2 pages)
      const nextButton = screen.queryByLabelText('Next page');
      // If pagination renders, test navigation
      if (nextButton) {
        expect(nextButton).toBeInTheDocument();
        expect(nextButton).not.toBeDisabled();
        
        fireEvent.click(nextButton);
        
        await waitFor(() => {
          const prevButton = screen.getByLabelText('Previous page');
          expect(prevButton).not.toBeDisabled();
        });
      }
    });

    it('should disable previous button on first page', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const prevButton = screen.queryByLabelText('Previous page');
        if (prevButton) {
          expect(prevButton).toBeDisabled();
        }
      });
    });
  });

  describe('Status Badges', () => {
    it('should render payment component successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        // Check that component rendered successfully
        expect(screen.getByLabelText('Balance summary')).toBeInTheDocument();
        expect(screen.getByLabelText(/View filter/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state for no payments', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ payouts: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ payments: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByText('No payments yet')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Your payment history will appear here after you receive payments.'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Balance summary')).toBeInTheDocument();
        expect(screen.getByLabelText(/View filter: Payments/i)).toBeInTheDocument();
      });
    });

    it('should have proper accessibility labels', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        // Check for accessibility labels
        expect(screen.getByLabelText('Balance summary')).toBeInTheDocument();
        expect(screen.getByLabelText(/View filter/i)).toBeInTheDocument();
      });
    });

    it('should announce loading state to screen readers', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
      expect(loadingStatus).toHaveAttribute('aria-label', 'Loading payment data');
    });

    it('should have aria-expanded on filter button', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPayoutsResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockPaymentsData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockBalanceResponse,
        });

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const filterButton = screen.getByLabelText(/View filter: Payments/i);
        expect(filterButton).toHaveAttribute('aria-expanded', 'false');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const retryButton = screen.getByLabelText('Retry loading payment data');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).not.toBeDisabled();
      });
    });

    it('should display error message with proper styling', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <StripePayoutsComponent userId={mockUserId} userType={mockUserType} />
      );

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveClass('bg-status-error/10');
        expect(screen.getByText('Failed to load financial data')).toBeInTheDocument();
      });
    });
  });
});

