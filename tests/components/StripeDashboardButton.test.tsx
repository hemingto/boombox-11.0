/**
 * @fileoverview Tests for StripeDashboardButton component
 * Tests Stripe dashboard access, account status checking, and button states
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StripeDashboardButton } from '@/components/features/service-providers/payments/StripeDashboardButton';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.open
global.open = jest.fn();

describe('StripeDashboardButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (global.open as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Loading State', () => {
    it('should display "Checking account..." while fetching account status', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<StripeDashboardButton userId="123" userType="driver" />);

      expect(screen.getByText(/checking account\.\.\./i)).toBeInTheDocument();
    });

    it('should have button disabled while checking account', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<StripeDashboardButton userId="123" userType="driver" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should have accessible ARIA label while checking', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      render(<StripeDashboardButton userId="123" userType="driver" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Checking Stripe account status'
      );
    });
  });

  describe('Account Inactive State', () => {
    it('should display "Complete Stripe Setup" when account is inactive', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: false,
          onboardingComplete: false,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/complete stripe setup/i)).toBeInTheDocument();
      });
    });

    it('should display setup message when account exists but onboarding incomplete', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: false,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/complete stripe setup/i)).toBeInTheDocument();
      });
    });

    it('should have button disabled when account is inactive', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: false,
          onboardingComplete: false,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
      });
    });

    it('should have appropriate ARIA label when inactive', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: false,
          onboardingComplete: false,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute(
          'aria-label',
          'Complete Stripe account setup to view dashboard'
        );
      });
    });
  });

  describe('Account Active State', () => {
    it('should display "View Full Dashboard" when account is active', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });
    });

    it('should have button enabled when account is active', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });

    it('should have appropriate ARIA label when active', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute(
          'aria-label',
          'Open Stripe Express Dashboard in new tab'
        );
      });
    });
  });

  describe('Dashboard Link Generation', () => {
    it('should create dashboard link and open in new tab when button clicked', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock dashboard link creation
      const mockDashboardUrl = 'https://connect.stripe.com/express/dashboard';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockDashboardUrl }),
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-dashboard-link',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: '123', userType: 'driver' }),
          }
        );
      });

      await waitFor(() => {
        expect(global.open).toHaveBeenCalledWith(mockDashboardUrl, '_blank');
      });
    });

    it('should show "Connecting to Stripe..." while generating link', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock slow dashboard link creation
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

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/connecting to stripe\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable button while generating link', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock slow dashboard link creation
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

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when account status check fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch status' }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to check stripe account status/i)
        ).toBeInTheDocument();
      });
    });

    it('should have role="alert" on error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('should display error when dashboard link generation fails', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock failed dashboard link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Link generation failed' }),
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to open dashboard/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear previous error when new request succeeds', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock failed dashboard link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' }),
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Mock successful retry
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://stripe.com' }),
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to check stripe account status/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch status with correct parameters for driver', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/stripe-status?userId=123&userType=driver'
        );
      });
    });

    it('should fetch status with correct parameters for mover', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="456" userType="mover" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/stripe-status?userId=456&userType=mover'
        );
      });
    });

    it('should create dashboard link with correct parameters for driver', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock dashboard link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://stripe.com' }),
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-dashboard-link',
          expect.objectContaining({
            body: JSON.stringify({ userId: '123', userType: 'driver' }),
          })
        );
      });
    });

    it('should create dashboard link with correct parameters for mover', async () => {
      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="456" userType="mover" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock dashboard link creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://stripe.com' }),
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/payments/connect/create-dashboard-link',
          expect.objectContaining({
            body: JSON.stringify({ userId: '456', userType: 'mover' }),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-disabled attribute when button is disabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: false,
          onboardingComplete: false,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should not have aria-busy when in active idle state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-busy', 'false');
      });
    });

    it('should have proper button role', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Console Error Logging', () => {
    it('should log errors to console when status check fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error checking Stripe account:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console when dashboard link generation fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock account status check
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasStripeAccount: true,
          onboardingComplete: true,
        }),
      });

      render(<StripeDashboardButton userId="123" userType="driver" />);

      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Mock failed dashboard link creation
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Link generation failed')
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error opening dashboard:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Button State Transitions', () => {
    it('should transition through all states correctly', async () => {
      // Initial loading state
      const slowFetch = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              hasStripeAccount: true,
              onboardingComplete: true,
            }),
          });
        }, 50);
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(slowFetch);

      render(<StripeDashboardButton userId="123" userType="driver" />);

      // Should show checking state
      expect(screen.getByText(/checking account\.\.\./i)).toBeInTheDocument();

      // Wait for active state
      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });

      // Click button
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ url: 'https://stripe.com' }),
              });
            }, 50);
          })
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should show connecting state
      await waitFor(() => {
        expect(screen.getByText(/connecting to stripe\.\.\./i)).toBeInTheDocument();
      });

      // Should return to active state after completion
      await waitFor(() => {
        expect(screen.getByText(/view full dashboard/i)).toBeInTheDocument();
      });
    });
  });
});

