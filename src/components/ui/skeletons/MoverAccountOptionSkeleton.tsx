/**
 * @fileoverview Skeleton loader component for MoverAccountOptions
 * 
 * COMPONENT FUNCTIONALITY:
 * Loading placeholder that matches the dimensions and styling of MoverAccountOptions.
 * Provides visual feedback during data loading to prevent layout shift.
 * 
 * DESIGN SYSTEM:
 * - Uses semantic surface colors for skeleton background
 * - Implements smooth pulse animation
 * - Maintains same dimensions as actual component (h-40 sm:h-48)
 */

import React from 'react';

/**
 * Skeleton loading placeholder for MoverAccountOptions
 * 
 * Displays an animated placeholder card that reserves space during data loading,
 * preventing layout shift when conditional options are rendered.
 * 
 * @example
 * ```tsx
 * {isLoading && <MoverAccountOptionSkeleton />}
 * ```
 */
export function MoverAccountOptionSkeleton() {
  return (
    <div
      className="w-full h-40 sm:h-48 rounded-2xl bg-surface-primary shadow-custom-shadow p-6 flex flex-col items-start"
      role="status"
      aria-label="Loading option"
    >
      {/* Icon skeleton */}
      <div className="mb-2 w-8 h-8 bg-surface-tertiary rounded animate-pulse" />
      
      {/* Title skeleton */}
      <div className="w-3/4 h-6 bg-surface-tertiary rounded mb-2 animate-pulse" />
      
      {/* Description skeleton - two lines */}
      <div className="w-full space-y-2">
        <div className="w-full h-4 bg-surface-tertiary rounded animate-pulse" />
        <div className="w-5/6 h-4 bg-surface-tertiary rounded animate-pulse" />
      </div>
      
      <span className="sr-only">Loading...</span>
    </div>
  );
}

