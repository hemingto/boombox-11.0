/**
 * @fileoverview Status badge component with semantic colors (gold standard)
 * @source Extracted from AdminJobsPage lines 600-603
 * 
 * COMPONENT FUNCTIONALITY:
 * - Status badge with rounded pill design
 * - Uses existing getStatusBadgeColor utility
 * - Semantic colors per status
 * - Font medium weight
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Integrates with existing adminStyles utility
 * - Consistent with boombox-10.0 admin portal styling
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';
import { getStatusBadgeColor } from '@/lib/utils/adminStyles';

interface AdminStatusBadgeProps {
  /** Status text to display */
  status: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * AdminStatusBadge - Gold standard status badge with semantic colors
 * 
 * @example
 * ```tsx
 * <AdminStatusBadge status="scheduled" />
 * <AdminStatusBadge status="complete" />
 * <AdminStatusBadge status="canceled" />
 * ```
 */
export function AdminStatusBadge({ status, className = '' }: AdminStatusBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getStatusBadgeColor(status)} ${className}`}
    >
      {status}
    </span>
  );
}

