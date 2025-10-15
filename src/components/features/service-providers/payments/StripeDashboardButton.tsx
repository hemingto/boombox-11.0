/**
 * @fileoverview Stripe Dashboard access button for service providers
 * Provides direct access to Stripe Express Dashboard for drivers and moving partners
 * to view their payment details, balances, and account information.
 * 
 * @source boombox-10.0/src/app/components/mover-account/stripedashboardbutton.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Checks if user has an active Stripe Connect account with completed onboarding
 * - Generates secure Stripe dashboard login link
 * - Opens Stripe Express Dashboard in new browser tab
 * - Shows appropriate button states: checking, inactive, loading, active
 * - Handles errors with user-friendly messages
 * 
 * BUTTON STATES:
 * 1. Checking account... → Initial state while verifying Stripe account
 * 2. Complete Stripe Setup → Account not active or onboarding incomplete
 * 3. Connecting to Stripe... → Loading state while generating dashboard link
 * 4. View Full Dashboard → Ready to open dashboard (active state)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/connect/stripe-status → New: /api/payments/connect/stripe-status
 * - Old: /api/stripe/connect/create-dashboard-link → New: /api/payments/connect/create-dashboard-link
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-zinc-950 with semantic primary color (bg-primary)
 * - Applied hover:bg-primary-hover for consistent hover states
 * - Replaced disabled colors (bg-slate-100, text-zinc-300) with semantic surface colors
 * - Applied text-text-inverse for button text on dark backgrounds
 * - Replaced text-red-500 with semantic error color (text-status-error)
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added aria-label with descriptive button purpose
 * - Added aria-busy for loading states
 * - Added aria-disabled for disabled state communication
 * - Added role="alert" for error messages
 * - Proper button disabled attribute management
 * 
 * @refactor 
 * - Migrated to service-providers/payments feature folder
 * - Updated API routes to new payments domain structure
 * - Applied design system colors and semantic tokens throughout
 * - Enhanced accessibility with comprehensive ARIA attributes
 * - Improved error handling with user-friendly messages
 */

'use client';

import { useState, useEffect } from 'react';

interface StripeDashboardButtonProps {
  userId: string;
  userType: 'driver' | 'mover';
}

export function StripeDashboardButton({
  userId,
  userType,
}: StripeDashboardButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccountActive, setIsAccountActive] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);

  // Fetch user data to check if Stripe account is active
  useEffect(() => {
    async function checkStripeAccount() {
      try {
        setIsCheckingAccount(true);
        const response = await fetch(
          `/api/payments/connect/stripe-status?userId=${userId}&userType=${userType}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch Stripe account status');
        }

        // Check if user has a connected Stripe account and has completed onboarding
        setIsAccountActive(!!data.hasStripeAccount && data.onboardingComplete);
      } catch (error) {
        console.error('Error checking Stripe account:', error);
        setError('Failed to check Stripe account status');
      } finally {
        setIsCheckingAccount(false);
      }
    }

    checkStripeAccount();
  }, [userId, userType]);

  const handleOpenDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/payments/connect/create-dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate dashboard link');
      }

      // Open the dashboard in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Error opening dashboard:', error);
      setError('Failed to open dashboard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if button should be disabled
  const isDisabled = isLoading || !isAccountActive || isCheckingAccount;

  // Determine button text based on state
  const getButtonText = () => {
    if (isLoading) return 'Connecting to Stripe...';
    if (isCheckingAccount) return 'Checking account...';
    if (!isAccountActive) return 'Complete Stripe Setup';
    return 'View Full Dashboard';
  };

  return (
    <div>
      <button
        onClick={handleOpenDashboard}
        disabled={isDisabled}
        className={`block rounded-md py-2.5 px-6 font-semibold text-md basis-1/2 font-inter ${
          isDisabled
            ? 'bg-surface-tertiary text-text-disabled cursor-not-allowed'
            : 'bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700'
        }`}
        aria-label={
          isCheckingAccount
            ? 'Checking Stripe account status'
            : !isAccountActive
            ? 'Complete Stripe account setup to view dashboard'
            : 'Open Stripe Express Dashboard in new tab'
        }
        aria-busy={isLoading || isCheckingAccount}
        aria-disabled={isDisabled}
      >
        <span>{getButtonText()}</span>
      </button>
      {error && (
        <p className="text-status-error text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

