/**
 * @fileoverview Tests for StripeConnectSetup component
 * Tests Stripe Connect setup flow, account creation, onboarding, and status transitions
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the StripeAccountStatus component before importing StripeConnectSetup
jest.mock(
  '@/components/features/service-providers/payments/StripeAccountStatus',
  () => ({
    StripeAccountStatus: jest.fn(({ onLoadingChange }) => {
      // Simulate immediate loading completion
      React.useEffect(() => {
        if (onLoadingChange) {
          onLoadingChange(false);
        }
      }, [onLoadingChange]);
      return <div data-testid="stripe-account-status">Stripe Account Status Component</div>;
    }),
  })
);

import { StripeConnectSetup } from '@/components/features/service-providers/payments/StripeConnectSetup';

// Mock fetch globally
global.fetch = jest.fn();

// Create mock functions
const mockReload = jest.fn();
const mockReplaceState = jest.fn();

// Mock window.location for redirects and URL params
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
  reload: mockReload,
};

// Mock window.history
(window as any).history = {
  replaceState: mockReplaceState,
};

describe('StripeConnectSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockReload.mockClear();
    mockReplaceState.mockClear();
    window.location.href = 'http://localhost/';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching account status', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<StripeConnectSetup userId="123" userType="driver" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading stripe account status/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('should have accessible loading state attributes', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<StripeConnectSetup userId="123" userType="driver" />);

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute('aria-busy', 'true');
      expect(loadingElement).toHaveAttribute(
        'aria-label',
        'Loading Stripe account status'
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Network error' }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to check account status/i)
        ).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const errorContainer = screen.getByRole('alert');
        expect(errorContainer).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should display retry button with correct attributes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toHaveAttribute('aria-label', 'Retry loading account status');
      });
    });

    it('should show error when userId is not provided', async () => {
      render(<StripeConnectSetup userId="" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/user id is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('No Account State', () => {
    it('should display setup prompt when no account exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/stripe account setup/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/to receive payments for completed jobs/i)
      ).toBeInTheDocument();
    });

    it('should display "Set Up Stripe Account" button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /set up stripe account/i })
        ).toBeInTheDocument();
      });
    });

    it('should create account and generate link when button clicked', async () => {
      // Mock initial status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set up stripe account/i })).toBeInTheDocument();
      });

      // Mock account creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Mock status refresh
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: false,
        }),
      });

      // Mock link generation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://stripe.com/onboarding' }),
      });

      const setupButton = screen.getByRole('button', {
        name: /set up stripe account/i,
      });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-account',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ userId: '123', userType: 'driver' }),
          })
        );
      });
    });

    it('should show connecting text while creating account', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set up stripe account/i })).toBeInTheDocument();
      });

      // Mock slow account creation
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              });
            }, 100);
          })
      );

      const setupButton = screen.getByRole('button', {
        name: /set up stripe account/i,
      });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(screen.getByText(/connecting to stripe\.\.\./i)).toBeInTheDocument();
      });
    });
  });

  describe('Onboarding Incomplete State', () => {
    it('should display continue setup prompt when account created but incomplete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText(/complete your stripe account setup/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/providing your banking information/i)
      ).toBeInTheDocument();
    });

    it('should display "Continue Account Setup" button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/continue account setup/i)).toBeInTheDocument();
      });
    });

    it('should generate onboarding link when continue button clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/continue account setup/i)).toBeInTheDocument();
      });

      // Mock link generation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://stripe.com/onboarding' }),
      });

      const continueButton = screen.getByText(/continue account setup/i).closest('button')!;
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-account-link',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ userId: '123', userType: 'driver' }),
          })
        );
      });
    });
  });

  describe('Account Under Review State', () => {
    it('should display review message when details submitted but payouts not enabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/account under review/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/typically takes 1-2 business days/i)
      ).toBeInTheDocument();
    });

    it('should display requirements when present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
          requirements: {
            currently_due: ['individual.id_number'],
            eventually_due: [],
            past_due: ['business.tax_id'],
          },
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText(/additional information required/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/individual id number/i)).toBeInTheDocument();
      expect(screen.getByText(/business tax id/i)).toBeInTheDocument();
    });

    it('should display both update and check status buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/update account information/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/check status/i)).toBeInTheDocument();
    });

    it('should display check status button with correct attributes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/check status/i)).toBeInTheDocument();
      });

      const checkButton = screen.getByText(/check status/i).closest('button')!;
      expect(checkButton).toBeInTheDocument();
      expect(checkButton).toHaveAttribute('aria-label', 'Check current account status');
    });
  });

  describe('Account Fully Setup State', () => {
    it('should render StripeAccountStatus component when account is fully setup', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: true,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-account-status')).toBeInTheDocument();
      });
    });

    it('should not display loading skeleton when StripeAccountStatus is not loading', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: true,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-account-status')).toBeInTheDocument();
      });

      // Loading skeleton should not be present since the mock immediately sets loading to false
      await waitFor(() => {
        expect(screen.queryByLabelText(/loading account details/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch account status with correct parameters for driver', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-status?userId=123&userType=driver'
        );
      });
    });

    it('should fetch account status with correct parameters for mover', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="456" userType="mover" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-status?userId=456&userType=mover'
        );
      });
    });

    it('should handle account creation errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set up stripe account/i })).toBeInTheDocument();
      });

      // Mock failed account creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Account creation failed' }),
      });

      const setupButton = screen.getByRole('button', {
        name: /set up stripe account/i,
      });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to create stripe account/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle link generation errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/continue account setup/i)).toBeInTheDocument();
      });

      // Mock failed link generation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Link generation failed' }),
      });

      const continueButton = screen.getByText(/continue account setup/i).closest('button')!;
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to generate onboarding link/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should fetch account status on load even with success parameter', async () => {
      // Set URL with success parameter
      window.location.href = 'http://localhost/?success=true';
      (window.location as any).search = '?success=true';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-status?userId=123&userType=driver'
        );
      });
    });

    it('should fetch account status on load even with refresh parameter', async () => {
      // Set URL with refresh parameter
      window.location.href = 'http://localhost/?refresh=true';
      (window.location as any).search = '?refresh=true';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/account-status?userId=123&userType=driver'
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /set up stripe account to receive payments/i,
        });
        expect(button).toBeInTheDocument();
      });
    });

    it('should have aria-disabled on disabled buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set up stripe account/i })).toBeInTheDocument();
      });

      // Mock slow account creation
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              });
            }, 100);
          })
      );

      const setupButton = screen.getByRole('button', {
        name: /set up stripe account/i,
      });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(setupButton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should have aria-live on review status message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have role="list" on requirements list', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasAccount: true,
          detailsSubmitted: true,
          payoutsEnabled: false,
          requirements: {
            currently_due: ['individual.id_number'],
            eventually_due: [],
            past_due: [],
          },
        }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        const list = screen.getByRole('list', { name: /required information/i });
        expect(list).toBeInTheDocument();
      });
    });
  });

  describe('Console Error Logging', () => {
    it('should log errors to console when account status check fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking account status:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console when account creation fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasAccount: false }),
      });

      render(<StripeConnectSetup userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /set up stripe account/i })).toBeInTheDocument();
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Create failed')
      );

      const setupButton = screen.getByRole('button', {
        name: /set up stripe account/i,
      });
      fireEvent.click(setupButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error creating account:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

