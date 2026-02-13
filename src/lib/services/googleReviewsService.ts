/**
 * @fileoverview Google Places API Reviews Service
 * Fetches real customer reviews from Google Business Profile via the Places API (New).
 *
 * USAGE:
 * Called by the /api/reviews route handler to retrieve up to 5 reviews
 * for the Boombox Storage Google Business Profile. Results are cached
 * at the API route level (24h) so this service is called infrequently.
 *
 * API REFERENCE:
 * https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * FIELD MASK:
 * Uses the "reviews" field which triggers the Place Details Enterprise + Atmosphere SKU.
 * Cost is ~$25 per 1,000 requests, but with 24h caching this is negligible.
 */

import { z } from 'zod';
import type { CustomerReview } from '@/data/customerReviews';

// ---------------------------------------------------------------------------
// Google Places API response validation schemas
// ---------------------------------------------------------------------------

const GoogleReviewAuthorSchema = z.object({
  displayName: z.string(),
  uri: z.string().optional(),
  photoUri: z.string().optional(),
});

const GoogleReviewTextSchema = z.object({
  text: z.string(),
  languageCode: z.string().optional(),
});

const GoogleReviewSchema = z.object({
  name: z.string().optional(),
  relativePublishTimeDescription: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  text: GoogleReviewTextSchema.optional(),
  originalText: GoogleReviewTextSchema.optional(),
  authorAttribution: GoogleReviewAuthorSchema.optional(),
  publishTime: z.string().optional(),
  googleMapsUri: z.string().optional(),
});

const GooglePlaceDetailsResponseSchema = z.object({
  reviews: z.array(GoogleReviewSchema).optional(),
  userRatingCount: z.number().optional(),
  googleMapsUri: z.string().optional(),
});

type GoogleReview = z.infer<typeof GoogleReviewSchema>;

/**
 * Result from fetchGoogleReviews including metadata about the business listing.
 */
export interface GoogleReviewsResult {
  reviews: CustomerReview[];
  /** Total number of reviews on the Google Business Profile */
  totalReviewCount: number | null;
  /** Google Maps URL for the business listing */
  googleMapsUrl: string | null;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1/places';
const FIELD_MASK = 'reviews,userRatingCount,googleMapsUri';

/** Only show reviews with this rating or higher */
const MIN_RATING = 4;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Fetches reviews from the Google Places API (New) for the configured Place ID.
 *
 * @returns GoogleReviewsResult with filtered reviews and business metadata
 * @throws Error if API key or Place ID is not configured, or if the API call fails
 */
export async function fetchGoogleReviews(): Promise<GoogleReviewsResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    throw new Error(
      'Google Reviews: GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID must be configured'
    );
  }

  const url = `${PLACES_API_BASE_URL}/${placeId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Google Places API error (${response.status}):`, errorBody);
    throw new Error(
      `Google Places API returned ${response.status}: ${response.statusText}`
    );
  }

  const rawData = await response.json();
  const parsed = GooglePlaceDetailsResponseSchema.safeParse(rawData);

  if (!parsed.success) {
    console.error(
      'Google Places API response validation failed:',
      parsed.error
    );
    throw new Error('Invalid response shape from Google Places API');
  }

  const reviews = parsed.data.reviews ?? [];

  // Filter: must have written text, meet minimum rating, and have a profile photo
  const filtered = reviews.filter(review => {
    const hasText = Boolean(review.originalText?.text || review.text?.text);
    const meetsRating = (review.rating ?? 0) >= MIN_RATING;
    const hasPhoto = Boolean(review.authorAttribution?.photoUri);
    return hasText && meetsRating && hasPhoto;
  });

  return {
    reviews: filtered.map(mapGoogleReviewToCustomerReview),
    totalReviewCount: parsed.data.userRatingCount ?? null,
    googleMapsUrl: parsed.data.googleMapsUri ?? null,
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps a single Google Places API review to the app's CustomerReview interface.
 */
function mapGoogleReviewToCustomerReview(
  review: GoogleReview,
  index: number
): CustomerReview {
  const authorName = review.authorAttribution?.displayName ?? 'Anonymous';
  const reviewText = review.originalText?.text ?? review.text?.text ?? '';
  const publishDate = review.publishTime
    ? formatPublishTime(review.publishTime)
    : (review.relativePublishTimeDescription ?? '');

  return {
    id: `google-review-${index}`,
    customer: authorName,
    date: publishDate,
    description: reviewText,
    rating: review.rating,
    photoUrl: normalizePhotoUri(review.authorAttribution?.photoUri),
    googleMapsUrl: review.googleMapsUri,
  };
}

/**
 * Normalizes a Google Places API photoUri to a full HTTPS URL.
 * The API sometimes returns protocol-relative URLs (e.g. "//lh3.googleusercontent.com/...")
 * which need the "https:" prefix to load reliably in all contexts.
 */
function normalizePhotoUri(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  if (uri.startsWith('//')) return `https:${uri}`;
  return uri;
}

/**
 * Formats an ISO 8601 timestamp into a human-readable month + year string.
 * Example: "2024-03-15T10:30:00Z" -> "March 2024"
 */
function formatPublishTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}
