/**
 * @fileoverview Storage unit status badge component (gold standard pattern)
 * @source Extracted from AdminStorageUnitsPage
 * 
 * COMPONENT FUNCTIONALITY:
 * - Status badges for storage units
 * - Empty (green) - Unit available
 * - Occupied (blue) - Unit in use
 * - Pending Cleaning (red) - Needs cleaning
 * 
 * DESIGN PATTERN:
 * - Uses semantic colors matching admin gold standard
 * - Green for available/success states
 * - Blue for info/active states
 * - Red for error/attention-needed states
 * 
 * SEMANTIC MEANING:
 * - Empty: bg-green-50 text-green-700 (success - unit available)
 * - Occupied: bg-blue-50 text-blue-700 (info - unit in use)
 * - Pending Cleaning: bg-red-50 text-red-700 (urgent - needs attention)
 * 
 * @goldstandard Follows AdminJobsPage semantic color patterns
 */

'use client';

import React from 'react';

type StorageStatus = 'Empty' | 'Occupied' | 'Pending Cleaning';

interface StorageStatusBadgeProps {
  /** Storage unit status */
  status: StorageStatus | string;
  /** Optional className for additional styling */
  className?: string;
}

const statusClasses: Record<StorageStatus, string> = {
  'Empty': 'bg-green-50 text-green-700 ring-green-700/10',
  'Occupied': 'bg-blue-50 text-blue-700 ring-blue-700/10',
  'Pending Cleaning': 'bg-red-50 text-red-700 ring-red-700/10',
};

/**
 * StorageStatusBadge - Status badge for storage units
 * 
 * @example
 * ```tsx
 * <StorageStatusBadge status="Empty" />
 * <StorageStatusBadge status="Occupied" />
 * <StorageStatusBadge status="Pending Cleaning" />
 * ```
 */
export function StorageStatusBadge({ status, className = '' }: StorageStatusBadgeProps) {
  const statusClass = statusClasses[status as StorageStatus] || 'bg-gray-50 text-gray-700 ring-gray-700/10';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-sm rounded-md font-medium font-inter ring-1 ring-inset ${statusClass} ${className}`}
    >
      {status}
    </span>
  );
}











