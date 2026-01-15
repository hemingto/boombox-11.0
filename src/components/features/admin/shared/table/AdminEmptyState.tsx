/**
 * @fileoverview Empty state component for admin tables (gold standard pattern)
 * @source Extracted from AdminJobsPage lines 540-543
 * 
 * COMPONENT FUNCTIONALITY:
 * - Large icon display
 * - Customizable message
 * - Centered layout with proper spacing
 * - Clean responsive design
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Slate icon color for consistency
 * - Proper vertical spacing (mt-12 sm:mt-24)
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';
import { ListBulletIcon } from '@heroicons/react/24/outline';

interface AdminEmptyStateProps {
  /** Message to display */
  message: string;
  /** Optional icon component (defaults to ListBulletIcon) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional className for container */
  className?: string;
}

/**
 * AdminEmptyState - Gold standard empty state for admin tables
 * 
 * @example
 * ```tsx
 * {data.length === 0 && (
 *   <AdminEmptyState message="No jobs booked for today" />
 * )}
 * ```
 */
export function AdminEmptyState({ 
  message, 
  icon: Icon = ListBulletIcon,
  className = ''
}: AdminEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center mt-12 sm:mt-24 py-12 bg-white rounded-b-lg ${className}`}>
      <Icon className="h-24 w-24 text-slate-200 mb-4" />
      <p className="text-gray-900 text-lg">{message}</p>
    </div>
  );
}

