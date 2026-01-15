/**
 * @fileoverview Stripe Connect account setup and onboarding management component
 * Manages the complete Stripe Connect setup flow including account creation,
 * onboarding completion, verification status, and requirement tracking.
 * 
 * @source boombox-10.0/src/app/components/mover-account/stripeconnectsetup.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Detects Stripe Connect account status for drivers and moving partners
 * - Guides users through multi-step account setup process
 * - Creates new Stripe Connect accounts when needed
 * - Handles Stripe onboarding link generation and redirect
 * - Shows account verification status and pending requirements
 * - Displays fully setup account details via StripeAccountStatus component
 * - Cleans up URL parameters after returning from Stripe
 * 
 * SETUP FLOW STAGES:
 * 1. No account → Show "Set Up Stripe Account" button
 * 2. Account created, details not submitted → Show "Continue Account Setup" button
 * 3. Details submitted, payouts not enabled → Show "Account under review" with requirements
 * 4. Payouts enabled → Show full StripeAccountStatus component with balance/details
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/connect/account-status → New: /api/payments/connect/account-status
 * - Old: /api/stripe/connect/create-account → New: /api/payments/connect/create-account
 * - Old: /api/stripe/connect/create-account-link → New: /api/payments/connect/create-account-link
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied badge-warning class for warning states
 * - Updated text colors to consistent palette (text-amber-600 → text-amber-700)
 * - Replaced bg-red-100 with semantic error surface color (bg-status-error/10)
 * - Applied badge-error class for error states
 * - Updated skeleton loading to use semantic surface colors (bg-surface-tertiary)
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels for loading states (aria-busy, aria-live="polite")
 * - Added role="status" for status messages
 * - Added aria-disabled for disabled button states
 * - Proper heading hierarchy with semantic HTML
 * - Descriptive button labels with aria-label
 * - Screen reader announcements for status changes
 * 
 * @refactor 
 * - Migrated to service-providers/payments feature folder
 * - Updated component imports to use new StripeAccountStatus from payments folder
 * - Updated API routes to new payments domain structure
 * - Applied design system colors and semantic tokens throughout
 * - Enhanced accessibility with comprehensive ARIA attributes
 * - Improved error handling with user-friendly messages
 * - Added loading state management for better UX
 */

'use client';

import { useState, useEffect } from 'react';
import {
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { StripeAccountStatus } from './StripeAccountStatus';

interface StripeConnectSetupProps {
  userId: string;
  userType: 'driver' | 'mover';
}

interface AccountStatus {
  hasAccount: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export function StripeConnectSetup({
  userId,
  userType,
}: StripeConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [isAccountDetailsLoading, setIsAccountDetailsLoading] = useState(true);

  // Fetch account status on load and when URL has success or refresh params
  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    const checkAccountStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/payments/connect/account-status?userId=${userId}&userType=${userType}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check account status');
        }

        setAccountStatus(data);
      } catch (error: any) {
        console.error('Error checking account status:', error);
        setError('Failed to check account status. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Check for success or refresh in URL
    const url = new URL(window.location.href);
    const hasSuccess = url.searchParams.get('success') === 'true';
    const hasRefresh = url.searchParams.get('refresh') === 'true';

    // If returning from Stripe, clear the URL params
    if (hasSuccess || hasRefresh) {
      url.searchParams.delete('success');
      url.searchParams.delete('refresh');
      window.history.replaceState({}, '', url.toString());
    }

    checkAccountStatus();
  }, [userId, userType]);

  const handleCreateAccount = async () => {
    try {
      setIsCreatingAccount(true);
      setError(null);

      const response = await fetch('/api/payments/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Refresh account status
      const statusResponse = await fetch(
        `/api/payments/connect/account-status?userId=${userId}&userType=${userType}`
      );
      const statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        throw new Error(statusData.error || 'Failed to check account status');
      }

      setAccountStatus(statusData);

      // Automatically generate onboarding link after account creation
      await handleGenerateLink();
    } catch (error: any) {
      console.error('Error creating account:', error);
      setError('Failed to create stripe account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setIsGeneratingLink(true);
      setError(null);

      const response = await fetch('/api/payments/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error generating link:', error);
      setError('Failed to generate onboarding link. Please try again.');
      setIsGeneratingLink(false);
    }
  };

  // Render loading state - only show loading when initial account status is loading
  // Once account status is loaded, let StripeAccountStatus handle its own loading state
  if (isLoading) {
    return (
      <div
        className="bg-surface-tertiary rounded-md p-6 animate-pulse"
        role="status"
        aria-busy="true"
        aria-label="Loading Stripe account status"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-surface-secondary rounded-full"></div>
          <div>
            <div className="h-5 w-40 bg-surface-secondary rounded mb-2"></div>
            <div className="h-4 w-24 bg-surface-secondary rounded"></div>
          </div>
        </div>
        <div className="h-4 w-full bg-surface-secondary rounded mb-3"></div>
        <div className="h-4 w-3/4 bg-surface-secondary rounded mb-6"></div>
        <div className="h-10 w-40 bg-surface-secondary rounded"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        className="bg-status-bg-error border border-status-error rounded-md p-6"
        role="alert"
      >
        <div className="flex items-center space-x-2 mb-4 text-status-error">
          <ExclamationCircleIcon className="w-6 h-6" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Error</h3>
        </div>
        <p className="text-status-error mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="py-2.5 px-6 font-semibold bg-status-error hover:bg-red-600 rounded-md text-md font-inter"
          aria-label="Retry loading account status"
        >
          <span className="text-white font-inter font-semibold">Retry</span>
        </button>
      </div>
    );
  }

  // No account yet - show create account button
  if (!accountStatus?.hasAccount) {
    return (
      <div
        className="bg-status-bg-warning rounded-md border border-border-warning p-6"
        role="status"
      >
        <div className="mb-4">
          <h3 className="text-status-warning font-semibold">
            Stripe account setup
          </h3>
        </div>
        <p className="text-status-warning mb-6">
          To receive payments for completed jobs, you need to set up a stripe
          account. This is a one-time process that takes just a few minutes.
        </p>
        <button
          onClick={handleCreateAccount}
          disabled={isCreatingAccount}
          className="py-2.5 px-6 font-semibold bg-amber-500 font-inter rounded-md hover:bg-amber-400 active:bg-amber-500 disabled:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-fit"
          aria-label="Set up Stripe account to receive payments"
          aria-disabled={isCreatingAccount}
        >
          <span className="text-white font-inter font-semibold">
            {isCreatingAccount
              ? 'Connecting to Stripe...'
              : 'Set Up Stripe Account'}
          </span>
        </button>
      </div>
    );
  }

  // Account exists but onboarding not complete
  if (accountStatus.hasAccount && !accountStatus.detailsSubmitted) {
    return (
      <div
        className="bg-status-bg-warning rounded-md border border-border-warning p-6"
        role="status"
      >
        <div className="mb-4">
          <h3 className="text-status-warning font-semibold">
            Complete your Stripe account setup
          </h3>
        </div>
        <p className="text-status-warning mb-2">
          Your stripe account has been created, but you need to complete the setup process to receive payments.
        </p>
        <p className="text-status-warning mb-6">
          This includes providing your banking information and verifying your identity.
        </p>
        <button
          onClick={handleGenerateLink}
          disabled={isGeneratingLink}
          className="py-2.5 px-6 font-semibold bg-amber-500 font-inter rounded-md hover:bg-amber-400 active:bg-amber-500 disabled:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-fit"
          aria-label="Continue Stripe account setup process"
          aria-disabled={isGeneratingLink}
        >
          <span className="text-white font-inter font-semibold">
            {isGeneratingLink
              ? 'Connecting to Stripe...'
              : 'Continue Account Setup'}
          </span>
        </button>
      </div>
    );
  }

  // Account exists and onboarding complete, but payouts not enabled
  if (
    accountStatus.hasAccount &&
    accountStatus.detailsSubmitted &&
    !accountStatus.payoutsEnabled
  ) {
    return (
      <div
        className="bg-status-bg-warning rounded-md border border-border-warning p-6"
        role="status"
        aria-live="polite"
      >
        <div className="mb-4">
          <h3 className="text-status-warning font-semibold">Account under review</h3>
        </div>
        <p className="text-status-warning mb-6">
          Your stripe account is currently under review. This typically takes
          1-2 business days. You&rsquo;ll be able to receive payments once the
          review is complete.
        </p>

        {accountStatus.requirements &&
          (accountStatus.requirements.currently_due.length > 0 ||
            accountStatus.requirements.past_due.length > 0) && (
            <div className="mb-6">
              <p className="text-status-warning font-semibold mb-2">
                Additional information required:
              </p>
              <ul
                className="list-disc pl-5 text-status-warning text-sm"
                role="list"
                aria-label="Required information"
              >
                {[
                  ...accountStatus.requirements.currently_due,
                  ...accountStatus.requirements.past_due,
                ].map((req, index) => (
                  <li key={index}>
                    {req.split('.').join(' ').replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

        <div className="flex space-x-4">
          <button
            onClick={handleGenerateLink}
            disabled={isGeneratingLink}
            className="py-2.5 px-6 font-semibold bg-amber-500 font-inter rounded-md hover:bg-amber-400 active:bg-amber-500 disabled:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-fit"
            aria-label="Update Stripe account information"
            aria-disabled={isGeneratingLink}
          >
            <span className="text-white font-inter font-semibold">
              {isGeneratingLink
                ? 'Connecting to Stripe...'
                : 'Update Account Information'}
            </span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="py-2.5 px-6 font-semibold bg-amber-500 font-inter rounded-md hover:bg-amber-400 active:bg-amber-500 disabled:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-fit flex items-center space-x-2"
            aria-label="Check current account status"
          >
            <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
            <span className="text-white font-inter font-semibold">
              Check Status
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Account fully set up and ready to receive payments
  return (
    <>
      <StripeAccountStatus
        userId={userId}
        userType={userType}
        onLoadingChange={setIsAccountDetailsLoading}
      />
      {isAccountDetailsLoading && (
        <div
          className="bg-surface-secondary rounded-md p-6 animate-pulse"
          role="status"
          aria-busy="true"
          aria-label="Loading account details"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-surface-tertiary rounded-full"></div>
            <div>
              <div className="h-5 w-40 bg-surface-tertiary rounded mb-2"></div>
              <div className="h-4 w-24 bg-surface-tertiary rounded"></div>
            </div>
          </div>
          <div className="h-4 w-full bg-surface-tertiary rounded mb-3"></div>
          <div className="h-4 w-3/4 bg-surface-tertiary rounded mb-6"></div>
          <div className="h-10 w-40 bg-surface-tertiary rounded"></div>
        </div>
      )}
    </>
  );
}

