/**
 * @fileoverview Feedback rating display component (gold standard)
 * @source Extracted from AdminFeedbackPage lines 303-307
 *
 * COMPONENT FUNCTIONALITY:
 * - Star emoji display for ratings (1-5 stars)
 * - Accessible with title attribute
 * - Consistent text size and styling
 *
 * DESIGN PATTERN:
 * - Extracted as reusable component
 * - Simple and semantic
 * - Can be used in any feedback context
 *
 * @goldstandard Follows gold standard pattern for badge components
 */

'use client';

import React from 'react';

interface FeedbackRatingDisplayProps {
  /** Rating value (1-5) */
  rating: number;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * FeedbackRatingDisplay - Star rating display component
 *
 * @example
 * ```tsx
 * <FeedbackRatingDisplay rating={5} />
 * // Displays: ⭐⭐⭐⭐⭐
 *
 * <FeedbackRatingDisplay rating={3} />
 * // Displays: ⭐⭐⭐
 * ```
 */
export function FeedbackRatingDisplay({
  rating,
  className = '',
}: FeedbackRatingDisplayProps) {
  return (
    <span className={`text-lg ${className}`} title={`${rating} stars`}>
      {'⭐'.repeat(rating)}
    </span>
  );
}
