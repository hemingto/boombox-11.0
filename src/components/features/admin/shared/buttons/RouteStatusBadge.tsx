/**
 * @fileoverview Route status badge component (gold standard pattern)
 * @source Extracted from AdminDeliveryRoutesPage lines 710-713
 * 
 * COMPONENT FUNCTIONALITY:
 * - Route-specific status badge with semantic colors
 * - Handles in_progress, completed, failed statuses
 * - Uses badge utility classes for consistency
 * - Replaces underscores with spaces for display
 * 
 * DESIGN PATTERN:
 * - Uses badge utility classes from design system
 * - badge-info: in_progress (blue/cyan for active)
 * - badge-success: completed (green for success)
 * - badge-error: failed (red for failure)
 * 
 * @goldstandard Extracted from delivery routes page for reusability
 */

'use client';

import React from 'react';

type RouteStatus = 'in_progress' | 'completed' | 'failed';

interface RouteStatusBadgeProps {
  /** Route status (in_progress, completed, failed) */
  status: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Get badge color class for route status
 */
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'in_progress':
      return 'badge-info';
    case 'completed':
      return 'badge-success';
    case 'failed':
      return 'badge-error';
    default:
      return 'bg-slate-100 text-gray-500';
  }
};

/**
 * RouteStatusBadge - Status badge for delivery route statuses
 * 
 * @example
 * ```tsx
 * <RouteStatusBadge status="in_progress" />
 * <RouteStatusBadge status="completed" />
 * <RouteStatusBadge status="failed" />
 * ```
 */
export function RouteStatusBadge({ status, className = '' }: RouteStatusBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getStatusColor(status)} ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

