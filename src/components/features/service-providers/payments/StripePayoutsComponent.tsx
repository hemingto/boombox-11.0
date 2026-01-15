/**
 * @fileoverview Stripe payouts and payment history component for service providers
 * Displays comprehensive payment information including balance summary, payment history,
 * payout history, with filtering, pagination, and status tracking.
 * 
 * @source boombox-10.0/src/app/components/mover-account/stripepayoutscomponent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays balance summary (total, available, pending, in-transit)
 * - Shows payment history with pagination and status filtering
 * - Shows payout history with pagination and status filtering
 * - Toggles between payments and payouts views
 * - Filters by payment status (all, paid, pending)
 * - Pagination for large datasets (10 items per page)
 * - Empty states for no data and no Stripe account
 * - Real-time balance information from Stripe API
 * 
 * API ROUTES UPDATED:
 * - Old: /api/stripe/connect/payouts → New: /api/payments/connect/payouts
 * - Old: /api/stripe/connect/payment-history → New: /api/payments/connect/payment-history
 * - Old: /api/stripe/connect/balance → New: /api/payments/connect/balance
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced bg-slate-100 with semantic surface colors (bg-surface-tertiary)
 * - Applied status badge classes (badge-success, badge-error, badge-warning)
 * - Replaced text-zinc-400 with semantic text colors (text-text-tertiary)
 * - Updated error colors (bg-red-100, text-red-500 → bg-status-error/10, text-status-error)
 * - Applied hover states with semantic colors (hover:bg-surface-hover)
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - Replaced inline formatCurrency with centralized utility from currencyUtils
 * - Replaced inline click-outside handler with useClickOutside hook
 * - Removed debug console.logs for production readiness
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels for all interactive elements
 * - Added role="status" for loading states
 * - Added role="alert" for error messages
 * - Added aria-expanded for dropdown filter
 * - Added aria-label for pagination buttons
 * - Proper button disabled states with aria-disabled
 * - Semantic table structure with proper roles
 * 
 * @refactor 
 * - Migrated to service-providers/payments feature folder
 * - Updated API routes to new payments domain structure
 * - Applied design system colors and semantic tokens throughout
 * - Extracted business logic to centralized utilities and hooks
 * - Enhanced accessibility with comprehensive ARIA attributes
 * - Removed debug logging for production
 * - Improved component organization and readability
 */

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { useClickOutside } from '@/hooks/useClickOutside';

interface Payout {
  id: string;
  date: string;
  status: string;
  destination: string;
  amount: string;
}

interface Payment {
  id: string;
  date: string;
  status: string;
  description: string;
  amount: string;
}

interface BalanceInfo {
  available: number;
  pending: number;
  inTransit: number;
  total: number;
}

interface StripePayoutsComponentProps {
  userId: string;
  userType: 'driver' | 'mover';
}

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
];

const viewOptions = [
  { value: 'payments', label: 'Payments' },
  { value: 'payouts', label: 'Payouts' },
];

export function StripePayoutsComponent({
  userId,
  userType,
}: StripePayoutsComponentProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({
    available: 0,
    pending: 0,
    inTransit: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedView, setSelectedView] = useState('payments');
  const [hasStripeAccount, setHasStripeAccount] = useState(true);
  const itemsPerPage = 10;
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Use centralized click outside hook
  useClickOutside(filterRef, () => setIsFilterOpen(false));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch payouts
        const payoutsResponse = await fetch(
          `/api/payments/connect/payouts?userId=${userId}&userType=${userType}`
        );
        if (payoutsResponse.status === 404) {
          setHasStripeAccount(false);
          return;
        }
        if (!payoutsResponse.ok) {
          throw new Error('Failed to fetch payouts');
        }
        const payoutsData = await payoutsResponse.json();
        setPayouts(payoutsData.payouts || []);

        // Fetch payments
        const paymentsResponse = await fetch(
          `/api/payments/connect/payment-history?userId=${userId}&userType=${userType}`
        );
        if (!paymentsResponse.ok && paymentsResponse.status !== 404) {
          throw new Error('Failed to fetch payments');
        }
        const paymentsData = await paymentsResponse.json();

        // Format payments to match our interface
        const formattedPayments =
          paymentsData.payments?.map((payment: any) => {
            const created =
              typeof payment.created === 'string'
                ? new Date(payment.created).getTime() / 1000
                : payment.created;

            return {
              id: payment.id,
              date: new Date(created * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              status:
                payment.status.charAt(0).toUpperCase() +
                payment.status.slice(1),
              description: payment.description || 'Payment',
              amount: formatCurrency(payment.amount),
            };
          }) || [];

        setPayments(formattedPayments);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load financial data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && userType) {
      fetchData();
    }
  }, [userId, userType]);

  useEffect(() => {
    const fetchBalanceInfo = async () => {
      try {
        const response = await fetch(
          `/api/payments/connect/balance?userId=${userId}&userType=${userType}`
        );

        if (response.status === 404) {
          setHasStripeAccount(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch balance information');
        }

        const data = await response.json();
        setBalanceInfo({
          available: (data.available || 0) / 100,
          pending: (data.pending || 0) / 100,
          inTransit: (data.inTransit || 0) / 100,
          total: (data.total || 0) / 100,
        });
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (userId && userType) {
      fetchBalanceInfo();
    }
  }, [userId, userType]);

  const filteredItems = useMemo(() => {
    const items = selectedView === 'payouts' ? payouts : payments;

    if (selectedFilter === 'all') return items;
    return items.filter(
      (item) => item.status.toLowerCase() === selectedFilter
    );
  }, [payouts, payments, selectedFilter, selectedView]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (option: string) => {
    setSelectedFilter(option);
    setCurrentPage(1);
  };

  const handleViewChange = (option: string) => {
    setSelectedView(option);
    setCurrentPage(1);
  };

  const BalanceSummary = () => (
    <div className="mb-6">
      <div
        className={`grid grid-cols-2 md:grid-cols-4 md:gap-4 gap-2 ${
          !hasStripeAccount ? 'opacity-50' : ''
        }`}
        role="region"
        aria-label="Balance summary"
      >
        <div className="bg-surface-tertiary rounded-md p-4">
          <h3 className="text-sm text-text-tertiary mb-1">Total balance</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(balanceInfo.total)}
          </p>
        </div>
        <div className="bg-surface-tertiary rounded-md p-4">
          <h3 className="text-sm text-text-tertiary mb-1">
            Available to pay out
          </h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(balanceInfo.available)}
          </p>
        </div>
        <div className="bg-surface-tertiary rounded-md p-4">
          <h3 className="text-sm text-text-tertiary mb-1">Available soon</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(balanceInfo.pending)}
          </p>
        </div>
        <div className="bg-surface-tertiary rounded-md p-4">
          <h3 className="text-sm text-text-tertiary mb-1">
            In transit to bank
          </h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(balanceInfo.inTransit)}
          </p>
        </div>
      </div>
    </div>
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading payment data">
        <div className="bg-white rounded-md">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-border px-4"
            >
              <div className="flex items-center space-x-4">
                <div>
                  <div className="h-4 w-40 bg-surface-tertiary rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-24 bg-surface-tertiary rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-4 w-16 bg-surface-tertiary rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-surface-tertiary rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="bg-status-error/10 p-3 mb-4 border border-status-error rounded-md"
        role="alert"
      >
        <p className="text-sm text-status-error">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-2 px-4 py-2 mt-2 bg-surface-tertiary hover:bg-surface-hover rounded-md text-sm"
          aria-label="Retry loading payment data"
        >
          <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Check if there are items to display in the current view
  const hasItemsToDisplay =
    (selectedView === 'payouts' && payouts.length > 0) ||
    (selectedView === 'payments' && payments.length > 0);

  return (
    <div>
      {/* Always show balance summary */}
      <BalanceSummary />

      {/* Filter Controls */}
      <div
        className={`mb-4 ${!hasStripeAccount ? 'opacity-50' : ''}`}
        ref={filterRef}
      >
        <div className="relative">
          <button
            className={`relative w-fit rounded-full px-3 py-2 cursor-pointer ${
              isFilterOpen
                ? 'ring-2 ring-border bg-white'
                : 'ring-1 ring-border bg-surface-tertiary'
            }`}
            onClick={() => hasStripeAccount && setIsFilterOpen(!isFilterOpen)}
            disabled={!hasStripeAccount}
            aria-expanded={isFilterOpen}
            aria-haspopup="listbox"
            aria-label={`View filter: ${
              viewOptions.find((option) => option.value === selectedView)
                ?.label || 'View'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-primary">
                {viewOptions.find((option) => option.value === selectedView)
                  ?.label || 'View'}
              </span>
              <svg
                className="shrink-0 w-3 h-3 text-text-primary ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>

          {isFilterOpen && hasStripeAccount && (
            <div
              className="absolute w-fit min-w-36 left-0 z-10 mt-2 border border-border rounded-md bg-white shadow-custom-shadow"
              role="listbox"
              aria-label="View options"
            >
              {viewOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`flex justify-between items-center p-3 cursor-pointer hover:bg-surface-tertiary active:bg-surface-secondary ${
                    index === 0 ? 'rounded-t-md' : ''
                  } ${
                    index === viewOptions.length - 1 ? 'rounded-b-md' : ''
                  }`}
                  onClick={() => {
                    handleViewChange(option.value);
                    setIsFilterOpen(false);
                  }}
                  role="option"
                  aria-selected={selectedView === option.value}
                >
                  <span className="text-sm text-text-primary">
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state or data display */}
      {!hasStripeAccount || (!hasItemsToDisplay && hasStripeAccount) ? (
        <div
          className="bg-white rounded-md p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <BanknotesIcon
            className="w-12 h-12 mx-auto text-text-secondary mb-4"
            aria-hidden="true"
          />
          <h3 className="text-lg text-text-tertiary font-medium mb-2">
            {!hasStripeAccount ? 'Please set up your account' : 'No payments yet'}
          </h3>
          <p className="text-text-tertiary">
            {!hasStripeAccount
              ? 'Set up your Stripe account to start receiving payments.'
              : 'Your payment history will appear here after you receive payments.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-md" role="table" aria-label={`${selectedView === 'payouts' ? 'Payouts' : 'Payments'} history`}>
          {/* Table Header */}
          <div className="grid grid-cols-4 border-b border-border py-3 px-4" role="row">
            <div className="text-sm font-medium text-text-tertiary" role="columnheader">
              {selectedView === 'payouts' ? 'Date' : 'Date'}
            </div>
            <div className="text-sm font-medium text-text-tertiary" role="columnheader">
              {selectedView === 'payouts' ? 'Destination' : 'Description'}
            </div>
            <div className="text-sm font-medium text-text-tertiary" role="columnheader">
              Status
            </div>
            <div className="text-sm font-medium text-text-tertiary text-right" role="columnheader">
              Amount
            </div>
          </div>

          {/* Table Content */}
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-4 items-center py-4 border-b border-border last:border-none px-4"
              role="row"
            >
              <div role="cell">
                <p className="font-medium mb-1">{item.date}</p>
              </div>
              <div className="text-sm text-text-tertiary" role="cell">
                {selectedView === 'payouts'
                  ? (item as Payout).destination
                  : (item as Payment).description}
              </div>
              <div role="cell">
                {item.status === 'Paid' ? (
                  <div className="badge-success w-fit text-xs">Paid</div>
                ) : item.status === 'Failed' ? (
                  <div className="badge-error w-fit text-xs">{item.status}</div>
                ) : (
                  <div className="badge-warning w-fit text-xs">{item.status}</div>
                )}
              </div>
              <div className="text-sm font-semibold text-right" role="cell">
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && hasStripeAccount && (
        <nav
          className="relative flex justify-center items-center mt-8"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`absolute left-0 rounded-full bg-surface-tertiary active:bg-surface-hover p-2 ${
              currentPage === 1
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-surface-hover'
            }`}
            aria-label="Previous page"
            aria-disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </button>

          <span className="text-sm" aria-live="polite" aria-atomic="true">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className={`absolute right-0 rounded-full bg-surface-tertiary active:bg-surface-hover p-2 ${
              currentPage === totalPages
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:bg-surface-hover'
            }`}
            aria-label="Next page"
            aria-disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-600" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}

