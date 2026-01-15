/**
 * @fileoverview Payout status badge component (gold standard pattern)
 * @source Extracted from AdminDeliveryRoutesPage lines 714-717
 * 
 * COMPONENT FUNCTIONALITY:
 * - Payout-specific status badge with semantic colors
 * - Handles pending, processing, completed, failed statuses
 * - Uses badge utility classes for consistency
 * 
 * DESIGN PATTERN:
 * - Uses badge utility classes from design system
 * - badge-warning: pending (yellow/amber for waiting)
 * - badge-processing: processing (blue for in-progress)
 * - badge-success: completed (green for success)
 * - badge-error: failed (red for failure)
 * 
 * @goldstandard Extracted from delivery routes page for reusability
 */

'use client';

import React from 'react';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface PayoutStatusBadgeProps {
  /** Payout status (pending, processing, completed, failed) */
  status: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Get badge color class for payout status
 */
const getPayoutStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'badge-warning';
    case 'processing':
      return 'badge-processing';
    case 'completed':
      return 'badge-success';
    case 'failed':
      return 'badge-error';
    default:
      return 'bg-slate-100 text-gray-500';
  }
};

/**
 * PayoutStatusBadge - Status badge for payout statuses
 * 
 * @example
 * ```tsx
 * <PayoutStatusBadge status="pending" />
 * <PayoutStatusBadge status="processing" />
 * <PayoutStatusBadge status="completed" />
 * <PayoutStatusBadge status="failed" />
 * ```
 */
export function PayoutStatusBadge({ status, className = '' }: PayoutStatusBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getPayoutStatusColor(status)} ${className}`}
    >
      {status}
    </span>
  );
}

