/**
 * @fileoverview Tests for StripeAccountStatus component
 * Tests Stripe Connect account status display, API integration, and user interactions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock utilities before importing component
jest.mock('@/lib/utils/currencyUtils', () => ({
  formatCurrency: jest.fn((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }),
}));

jest.mock('@/lib/utils/stripeUtils', () => ({
  getStripeAccountStatusDisplay: jest.fn((accountData) => {
    if (!accountData) {
      return {
        text: 'Unknown',
        badgeClass: 'badge-info',
        textColor: 'text-zinc-500',
      };
    }

    if (!accountData.detailsSubmitted) {
      return {
        text: 'Incomplete',
        badgeClass: 'badge-warning',
        textColor: 'text-amber-600',
      };
    }

    if (!accountData.payoutsEnabled) {
      return {
        text: 'Pending',
        badgeClass: 'badge-info',
        textColor: 'text-blue-600',
      };
    }

    if (accountData.payoutsEnabled && accountData.chargesEnabled) {
      return {
        text: 'Active',
        badgeClass: 'badge-success',
        textColor: 'text-emerald-600',
      };
    }

    return {
      text: 'Limited',
      badgeClass: 'badge-warning',
      textColor: 'text-amber-600',
    };
  }),
}));

import { StripeAccountStatus } from '@/components/features/service-providers/payments/StripeAccountStatus';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.location - simple approach for JSDOM compatibility
delete (window as any).location;
(window as any).location = {
  href: 'http://localhost/',
  origin: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  pathname: '/',
  search: '',
  hash: '',
};

describe('StripeAccountStatus', () => {
  const mockAccountData = {
    accountName: 'John Doe',
    balance: 150000, // $1,500.00 in cents
    connectedDate: '2024-01-15',
    detailsSubmitted: true,
    payoutsEnabled: true,
    chargesEnabled: true,
  };

  const mockOnLoadingChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render nothing (null) while loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      const { container } = render(
        <StripeAccountStatus userId="123" userType="driver" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display account information after successful fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    });

    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch' }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load Stripe account information')
        ).toBeInTheDocument();
      });
    });

    it('should render table headers correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Account Name')).toBeInTheDocument();
      });

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Status Display Logic', () => {
    it('should display "Active" status for complete account with payouts enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          detailsSubmitted: true,
          payoutsEnabled: true,
          chargesEnabled: true,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });

      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveClass('text-emerald-600');
    });

    it('should display "Incomplete" status when details not submitted', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          detailsSubmitted: false,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
      });

      const statusBadge = screen.getByText('Incomplete');
      expect(statusBadge).toHaveClass('text-amber-600');
    });

    it('should display "Pending" status when payouts not enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          detailsSubmitted: true,
          payoutsEnabled: false,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });

      const statusBadge = screen.getByText('Pending');
      expect(statusBadge).toHaveClass('text-blue-600');
    });

    it('should display "Limited" status when charges disabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          detailsSubmitted: true,
          payoutsEnabled: true,
          chargesEnabled: false,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Limited')).toBeInTheDocument();
      });

      const statusBadge = screen.getByText('Limited');
      expect(statusBadge).toHaveClass('text-amber-600');
    });

    it('should display "N/A" for missing account data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          balance: 0,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        const accountNames = screen.getAllByText('N/A');
        expect(accountNames.length).toBeGreaterThan(0);
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch account details with correct URL parameters for driver', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-details?userId=123&userType=driver'
        );
      });
    });

    it('should fetch account details with correct URL parameters for mover', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="456" userType="mover" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-details?userId=456&userType=mover'
        );
      });
    });

    it('should call onLoadingChange callback with loading states', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(
        <StripeAccountStatus
          userId="123"
          userType="driver"
          onLoadingChange={mockOnLoadingChange}
        />
      );

      // Should be called with true when loading starts
      expect(mockOnLoadingChange).toHaveBeenCalledWith(true);

      await waitFor(() => {
        // Should be called with false when loading completes
        expect(mockOnLoadingChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Update Stripe Details Button', () => {
    it('should display Update button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      });
    });

    it('should create account link when Update button is clicked', async () => {
      const mockUrl = 'https://connect.stripe.com/setup/test';

      // Mock initial data fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      // Mock account link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockUrl }),
      });

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Verify API call was made with correct parameters
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-account-link',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: '123', userType: 'driver' }),
          }
        );
      });

      // Verify button shows Connecting... text while processing
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /update stripe account details/i });
        expect(button).toBeDisabled();
      });
    });

    it('should show "Connecting..." text while creating link', async () => {
      // Mock initial data fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      // Mock slow account link creation
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ url: 'https://stripe.com' }),
              });
            }, 100);
          })
      );

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      // Button text should change while loading
      await waitFor(() => {
        expect(screen.getByText('Connecting...')).toBeInTheDocument();
      });
    });

    it('should disable button while creating link', async () => {
      // Mock initial data fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      // Mock slow account link creation
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ url: 'https://stripe.com' }),
              });
            }, 100);
          })
      );

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(updateButton).toBeDisabled();
      });
    });

    it('should show error message when account link creation fails', async () => {
      // Mock initial data fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      // Mock failed account link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Link creation failed' }),
      });

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/unable to access stripe settings/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Balance Display', () => {
    it('should format balance correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          balance: 150000, // $1,500.00
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('$1,500.00')).toBeInTheDocument();
      });
    });

    it('should display $0.00 for zero balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          balance: 0,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });

    it('should display $0.00 for null balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          balance: null,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });

    it('should display $0.00 for undefined balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockAccountData,
          balance: undefined,
        }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for status badge', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        const statusLabel = screen.getByLabelText(/account status: active/i);
        expect(statusLabel).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(
          'Unable to load Stripe account information'
        );
      });
    });

    it('should have aria-disabled on disabled button', async () => {
      // Mock initial data fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText('Update')).toBeInTheDocument();
      });

      // Mock slow account link creation
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ url: 'https://stripe.com' }),
              });
            }, 100);
          })
      );

      const updateButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(updateButton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should have proper table structure with roles', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountData,
      });

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(0);
      });

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5);

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to load Stripe account information')
        ).toBeInTheDocument();
      });
    });

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StripeAccountStatus userId="123" userType="driver" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching Stripe account data:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

