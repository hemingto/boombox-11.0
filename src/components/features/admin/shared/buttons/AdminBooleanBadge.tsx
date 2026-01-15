/**
 * @fileoverview Boolean badge component (gold standard pattern)
 * @source Extracted from AdminDriversPage lines 486-492
 * 
 * COMPONENT FUNCTIONALITY:
 * - Boolean status badge with semantic colors
 * - Handles true/false values with Yes/No display
 * - Green badge for true (Yes), Red badge for false (No)
 * - Uses getBooleanBadgeColor utility for consistency
 * 
 * DESIGN PATTERN:
 * - Uses badge utility colors from design system
 * - bg-emerald-200 text-emerald-700: true (Yes)
 * - bg-red-200 text-red-700: false (No)
 * 
 * @goldstandard Extracted from drivers page for reusability
 */

'use client';

import React from 'react';
import { getBooleanBadgeColor } from '@/lib/utils/adminStyles';

interface AdminBooleanBadgeProps {
  /** Boolean value to display */
  value: boolean;
  /** Optional custom labels (defaults to Yes/No) */
  trueLabel?: string;
  falseLabel?: string;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * AdminBooleanBadge - Status badge for boolean values
 * 
 * @example
 * ```tsx
 * <AdminBooleanBadge value={driver.isApproved} />
 * <AdminBooleanBadge value={driver.applicationComplete} />
 * <AdminBooleanBadge value={isActive} trueLabel="Active" falseLabel="Inactive" />
 * ```
 */
export function AdminBooleanBadge({ 
  value, 
  trueLabel = 'Yes', 
  falseLabel = 'No',
  className = '' 
}: AdminBooleanBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getBooleanBadgeColor(value)} ${className}`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

