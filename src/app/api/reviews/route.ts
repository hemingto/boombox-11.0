/**
 * @fileoverview Google Reviews API route
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns customer reviews with the following fallback chain:
 * 1. Database (accumulated reviews from weekly cron syncs)
 * 2. Google Places API (direct call if DB is empty, e.g., before first cron run)
 * 3. Hardcoded CUSTOMER_REVIEWS (if both DB and Google are unavailable)
 *
 * Also returns totalReviewCount (from Google) and googleMapsUrl for the
 * "Read all X reviews" button in the CustomerReviewSection component.
 *
 * CACHING:
 * Response is cached for 24 hours (s-maxage=86400) with a 1-hour
 * stale-while-revalidate window.
 *
 * RESPONSE FORMAT:
 * {
 *   reviews: CustomerReview[],
 *   source: 'database' | 'google' | 'fallback',
 *   totalReviews: number,
 *   totalReviewCount: number | null,
 *   googleMapsUrl: string | null
 * }
 */

import { NextResponse } from 'next/server';
import { getReviewsFromDatabase } from '@/lib/services/googleReviewsSyncService';
import { fetchGoogleReviews } from '@/lib/services/googleReviewsService';
import { CUSTOMER_REVIEWS } from '@/data/customerReviews';

/** Cache headers for successful responses */
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
};

/** Cache headers for fallback responses (shorter TTL) */
const FALLBACK_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
};

export async function GET() {
  // We always try to get the metadata (totalReviewCount, googleMapsUrl) from Google
  let totalReviewCount: number | null = null;
  let googleMapsUrl: string | null = null;
  let googleResult: Awaited<ReturnType<typeof fetchGoogleReviews>> | null =
    null;

  try {
    googleResult = await fetchGoogleReviews();
    totalReviewCount = googleResult.totalReviewCount;
    googleMapsUrl = googleResult.googleMapsUrl;
  } catch {
    // Google metadata unavailable — construct fallback URL from Place ID
    const placeId = process.env.GOOGLE_PLACE_ID;
    if (placeId) {
      googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    }
  }

  try {
    // 1. Try database first (accumulated reviews from cron syncs)
    const dbReviews = await getReviewsFromDatabase();

    if (dbReviews.length > 0) {
      return NextResponse.json(
        {
          reviews: dbReviews,
          source: 'database',
          totalReviews: dbReviews.length,
          totalReviewCount,
          googleMapsUrl,
        },
        { headers: CACHE_HEADERS }
      );
    }

    // 2. DB is empty — use Google reviews directly if we have them
    if (googleResult && googleResult.reviews.length > 0) {
      return NextResponse.json(
        {
          reviews: googleResult.reviews,
          source: 'google',
          totalReviews: googleResult.reviews.length,
          totalReviewCount,
          googleMapsUrl,
        },
        { headers: CACHE_HEADERS }
      );
    }

    // 3. Both DB and Google unavailable — use hardcoded fallback
    return NextResponse.json(
      {
        reviews: CUSTOMER_REVIEWS,
        source: 'fallback',
        totalReviews: CUSTOMER_REVIEWS.length,
        totalReviewCount,
        googleMapsUrl,
      },
      { headers: FALLBACK_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('Reviews API route error:', error);

    const fallbackPlaceId = process.env.GOOGLE_PLACE_ID;
    return NextResponse.json(
      {
        reviews: CUSTOMER_REVIEWS,
        source: 'fallback',
        totalReviews: CUSTOMER_REVIEWS.length,
        totalReviewCount: null,
        googleMapsUrl: fallbackPlaceId
          ? `https://www.google.com/maps/place/?q=place_id:${fallbackPlaceId}`
          : null,
      },
      { headers: FALLBACK_CACHE_HEADERS }
    );
  }
}
