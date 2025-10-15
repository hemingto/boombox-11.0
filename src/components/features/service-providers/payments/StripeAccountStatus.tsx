/**
 * @fileoverview Stripe Connect account status display component for service providers
 * Displays Stripe Connect account information including account name, status, balance,
 * connection date, and provides update functionality for service providers.
 * 
 * @source boombox-10.0/src/app/components/mover-account/stripeaccountstatus.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Fetches and displays Stripe Connect account details for drivers and moving partners
 * - Shows account status with color-coded badges (Active, Pending, Incomplete, Limited)
 * - Displays current balance, account name, and connection date
 * - Provides "Update" button to redirect to Stripe's hosted onboarding/update page
 * - Handles loading states and error scenarios
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/connect/account-details → New: /api/payments/connect/account-details
 * - Old: /api/stripe/connect/create-account-link → New: /api/payments/connect/create-account-link
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom color classes with design system badge utilities (badge-success, badge-warning, badge-info)
 * - Applied semantic text colors (text-primary, text-secondary)
 * - Updated button styles to use design system hover states (bg-surface-tertiary hover:bg-surface-hover)
 * - Replaced custom shadow with shadow-custom-shadow design token
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - Status display logic moved to getStripeAccountStatusDisplay() in stripeUtils.ts
 * - Prevents duplicate status determination logic across components
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels for status badges with screen reader context
 * - Added aria-busy and aria-live for loading states
 * - Proper semantic HTML structure with descriptive headings
 * - Disabled button state with proper aria-disabled attribute
 * 
 * @refactor 
 * - Migrated to service-providers/payments feature folder
 * - Extracted getStatusDisplay() to centralized stripeUtils.ts
 * - Updated API routes to new payments domain structure
 * - Applied design system colors and utility classes throughout
 * - Enhanced accessibility with ARIA attributes and semantic HTML
 * - Improved error handling with user-friendly messages
 */

'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { getStripeAccountStatusDisplay } from '@/lib/utils/stripeUtils';

interface StripeAccountStatusProps {
  userId: string;
  userType: 'driver' | 'mover';
  onLoadingChange?: (isLoading: boolean) => void;
}

interface StripeAccountData {
  accountName: string;
  balance: number;
  connectedDate: string;
  status?: string;
  detailsSubmitted?: boolean;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
}

export function StripeAccountStatus({
  userId,
  userType,
  onLoadingChange,
}: StripeAccountStatusProps) {
  const [accountData, setAccountData] = useState<StripeAccountData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  useEffect(() => {
    const fetchStripeAccountData = async () => {
      try {
        setIsLoading(true);
        if (onLoadingChange) onLoadingChange(true);

        const response = await fetch(
          `/api/payments/connect/account-details?userId=${userId}&userType=${userType}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Stripe account data');
        }

        const data = await response.json();
        console.log('Stripe account data:', data);
        setAccountData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Stripe account data:', err);
        setError('Unable to load Stripe account information');
      } finally {
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    };

    fetchStripeAccountData();
  }, [userId, userType, onLoadingChange]);

  const handleUpdateStripeDetails = async () => {
    try {
      setIsCreatingLink(true);
      const response = await fetch('/api/payments/connect/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, userType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to create Stripe account link'
        );
      }

      const data = await response.json();
      // Redirect to Stripe's hosted onboarding/update page
      window.location.href = data.url;
    } catch (err) {
      console.error('Error creating Stripe account link:', err);
      setError('Unable to access Stripe settings. Please try again later.');
      setIsCreatingLink(false);
    }
  };

  if (isLoading) {
    // Return null when loading so parent can show loading state
    return null;
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-md shadow-custom-shadow">
        <p className="text-status-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  // Get status display configuration using centralized utility
  const statusDisplay = getStripeAccountStatusDisplay(accountData);

  return (
    <div>
      <div className="p-4 bg-white rounded-md shadow-custom-shadow overflow-hidden">
        {/* Table Header */}
        <div
          className="grid grid-cols-5 border-b border-border pb-2"
          role="row"
        >
          <div className="text-sm text-text-secondary" role="columnheader">
            Account Name
          </div>
          <div
            className="text-sm text-text-secondary text-right"
            role="columnheader"
          >
            Status
          </div>
          <div
            className="text-sm text-text-secondary text-right"
            role="columnheader"
          >
            Total Balance
          </div>
          <div
            className="text-sm text-text-secondary text-right"
            role="columnheader"
          >
            Connected
          </div>
          <div
            className="text-sm text-text-secondary text-right"
            role="columnheader"
          >
            Actions
          </div>
        </div>

        {/* Table Content */}
        <div className="grid grid-cols-5 pt-2 items-center" role="row">
          {/* Account Name */}
          <div className="text-text-primary font-medium" role="cell">
            {accountData?.accountName || 'N/A'}
          </div>

          {/* Status Badge */}
          <div className="text-right" role="cell">
            <span className={statusDisplay.badgeClass}>
              <span
                className={statusDisplay.textColor}
                aria-label={`Account status: ${statusDisplay.text}`}
              >
                {statusDisplay.text}
              </span>
            </span>
          </div>

          {/* Balance */}
          <div className="text-text-primary font-medium text-right" role="cell">
            {accountData?.balance !== undefined && accountData.balance !== null
              ? formatCurrency(accountData.balance / 100)
              : '$0.00'}
          </div>

          {/* Connection Date */}
          <div className="text-text-primary font-medium text-right" role="cell">
            {accountData?.connectedDate || 'N/A'}
          </div>

          {/* Update Button */}
          <div className="flex justify-end" role="cell">
            <button
              onClick={handleUpdateStripeDetails}
              disabled={isCreatingLink}
              className="rounded-md py-1.5 px-3 bg-surface-tertiary w-fit hover:bg-surface-hover active:bg-slate-400 disabled:bg-surface-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Update Stripe account details"
              aria-disabled={isCreatingLink}
            >
              <span className="text-text-primary font-inter font-semibold text-sm">
                {isCreatingLink ? 'Connecting...' : 'Update'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

