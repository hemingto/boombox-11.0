/**
 * @fileoverview Google Reviews Sync Service
 * Fetches reviews from Google Places API and upserts them into the database.
 *
 * Called by the /api/cron/sync-google-reviews cron route on a weekly schedule.
 * Each run fetches up to 5 reviews from Google. Over time, as Google rotates
 * which reviews it returns, unique reviews accumulate in the database beyond
 * the 5-review API limit.
 *
 * DEDUPLICATION:
 * Google Places API (New) does not return stable review IDs. We use a SHA-256
 * hash of (authorName + "|" + reviewText) as a content-based unique key.
 */

import { createHash } from 'crypto';
import { prisma } from '@/lib/database/prismaClient';
import { fetchGoogleReviews } from '@/lib/services/googleReviewsService';
import type { CustomerReview } from '@/data/customerReviews';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncResult {
  success: boolean;
  totalInDb: number;
  newReviews: number;
  updatedReviews: number;
  fetchedFromGoogle: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/**
 * Generates a SHA-256 content hash for deduplication.
 * Uses author name + review text as the composite key.
 */
function generateContentHash(customer: string, description: string): string {
  return createHash('sha256')
    .update(`${customer}|${description}`)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Sync logic
// ---------------------------------------------------------------------------

/**
 * Fetches reviews from Google Places API and upserts them into the database.
 *
 * @returns SyncResult with counts of new, updated, and total reviews
 */
export async function syncGoogleReviews(): Promise<SyncResult> {
  try {
    // Fetch filtered reviews from Google (4+ stars, has text, has photo)
    const { reviews: googleReviews } = await fetchGoogleReviews();

    let newReviews = 0;
    let updatedReviews = 0;

    for (const review of googleReviews) {
      const contentHash = generateContentHash(
        review.customer,
        review.description
      );
      const publishTime = parsePublishTime(review.date);

      const existing = await prisma.googleReview.findUnique({
        where: { contentHash },
      });

      if (existing) {
        // Update if any fields changed (photo URL, rating, etc.)
        await prisma.googleReview.update({
          where: { contentHash },
          data: {
            customer: review.customer,
            date: review.date,
            publishTime,
            description: review.description,
            rating: review.rating ?? 5,
            photoUrl: review.photoUrl,
            googleMapsUrl: review.googleMapsUrl,
          },
        });
        updatedReviews++;
      } else {
        // New review — insert
        await prisma.googleReview.create({
          data: {
            customer: review.customer,
            date: review.date,
            publishTime,
            description: review.description,
            rating: review.rating ?? 5,
            photoUrl: review.photoUrl,
            googleMapsUrl: review.googleMapsUrl,
            contentHash,
          },
        });
        newReviews++;
      }
    }

    const totalInDb = await prisma.googleReview.count();

    console.log(
      `Google Reviews sync complete: ${newReviews} new, ${updatedReviews} updated, ${totalInDb} total in DB`
    );

    return {
      success: true,
      totalInDb,
      newReviews,
      updatedReviews,
      fetchedFromGoogle: googleReviews.length,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Google Reviews sync failed:', errorMessage);

    return {
      success: false,
      totalInDb: 0,
      newReviews: 0,
      updatedReviews: 0,
      fetchedFromGoogle: 0,
      error: errorMessage,
    };
  }
}

/**
 * Retrieves all reviews from the database, ordered by publish time (newest first).
 * Maps them to the CustomerReview interface used by the frontend.
 */
export async function getReviewsFromDatabase(): Promise<CustomerReview[]> {
  const dbReviews = await prisma.googleReview.findMany({
    orderBy: { publishTime: 'desc' },
  });

  return dbReviews.map(review => ({
    id: `db-review-${review.id}`,
    customer: review.customer,
    date: review.date,
    description: review.description,
    rating: review.rating,
    photoUrl: review.photoUrl ?? undefined,
    googleMapsUrl: review.googleMapsUrl ?? undefined,
  }));
}

/**
 * Returns the count of reviews currently stored in the database.
 */
export async function getReviewCount(): Promise<number> {
  return prisma.googleReview.count();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to parse a formatted date string (e.g., "March 2024") back into
 * a Date object. Returns null if parsing fails.
 */
function parsePublishTime(dateString: string): Date | null {
  try {
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}
