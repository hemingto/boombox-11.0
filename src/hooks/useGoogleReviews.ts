/**
 * @fileoverview Custom hook for fetching Google Places reviews
 *
 * Follows the same useState + useEffect pattern used by useBlogData,
 * useCustomerHomePageData, and other hooks in this project.
 *
 * BEHAVIOUR:
 * - Returns hardcoded fallback reviews immediately (no loading flash)
 * - Fetches real Google reviews from /api/reviews in the background
 * - Swaps in real reviews once loaded
 * - Falls back gracefully if the fetch fails
 * - Returns totalReviewCount and googleMapsUrl for the "Read all reviews" button
 */

'use client';

import { useState, useEffect } from 'react';
import { CUSTOMER_REVIEWS, type CustomerReview } from '@/data/customerReviews';

interface UseGoogleReviewsReturn {
  /** Current list of reviews (starts with fallback, updates to Google data) */
  reviews: CustomerReview[];
  /** True while the initial fetch is in-flight */
  loading: boolean;
  /** Error message if the fetch failed (reviews still populated with fallback) */
  error: string | null;
  /** Whether the current reviews come from Google or hardcoded data */
  source: 'google' | 'database' | 'fallback';
  /** Total number of reviews on the Google Business Profile (null if unavailable) */
  totalReviewCount: number | null;
  /** Google Maps URL for the business listing (null if unavailable) */
  googleMapsUrl: string | null;
}

/**
 * Fetches customer reviews from the /api/reviews endpoint.
 * Immediately returns hardcoded fallback data so the UI never shows a
 * loading skeleton, then seamlessly replaces it with real Google reviews.
 */
export function useGoogleReviews(): UseGoogleReviewsReturn {
  const [reviews, setReviews] = useState<CustomerReview[]>(CUSTOMER_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'google' | 'database' | 'fallback'>(
    'fallback'
  );
  const [totalReviewCount, setTotalReviewCount] = useState<number | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch('/api/reviews');
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }

        const data = await response.json();
        setReviews(data.reviews);
        setSource(data.source);
        setTotalReviewCount(data.totalReviewCount ?? null);
        setGoogleMapsUrl(data.googleMapsUrl ?? null);
        setError(null);
      } catch (err) {
        // Keep the fallback reviews in state — don't clear them
        setError('Failed to fetch Google reviews');
        console.error('Error fetching Google reviews:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return { reviews, loading, error, source, totalReviewCount, googleMapsUrl };
}
