/**
 * @fileoverview Error state component for admin tables (gold standard pattern)
 * @source Extracted from AdminJobsPage line 538
 * 
 * COMPONENT FUNCTIONALITY:
 * - Simple red error message display
 * - Optional retry action
 * - Clean and direct
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Simple red text for errors
 * - Can be enhanced with retry button
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';

interface AdminErrorStateProps {
  /** Error message to display */
  error: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional className for container */
  className?: string;
}

/**
 * AdminErrorState - Gold standard error state for admin tables
 * 
 * @example
 * ```tsx
 * {error && (
 *   <AdminErrorState error={error} onRetry={refetch} />
 * )}
 * ```
 */
export function AdminErrorState({ error, onRetry, className = '' }: AdminErrorStateProps) {
  return (
    <div className={`text-red-600 ${className}`}>
      {error}
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 text-sm underline hover:text-red-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}

