/**
 * @fileoverview Cron job to sync Google Places reviews into the database
 * Schedule: Weekly (Monday 8:00 AM UTC) via Vercel Cron
 *
 * Flow:
 * 1. Fetch up to 5 reviews from Google Places API (filtered: 4+ stars, has text, has photo)
 * 2. Compute content hash for each review (author + text)
 * 3. Upsert into GoogleReview table — new reviews are inserted, existing ones updated
 * 4. Over time, the database accumulates unique reviews beyond the 5-review API limit
 *
 * Endpoints:
 * - GET: Runs the sync (used by Vercel Cron) or returns status if ?status=true
 * - POST: Runs the sync with auth (for manual triggering)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  syncGoogleReviews,
  getReviewCount,
} from '@/lib/services/googleReviewsSyncService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusOnly = searchParams.get('status') === 'true';

    // Status check — return DB review count without syncing
    if (statusOnly) {
      const totalReviews = await getReviewCount();
      return NextResponse.json({
        success: true,
        message: 'Google Reviews sync endpoint is active',
        totalReviews,
        timestamp: new Date().toISOString(),
      });
    }

    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Google Reviews sync...');
    const result = await syncGoogleReviews();

    if (!result.success) {
      console.error('Google Reviews sync failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log('Google Reviews sync completed:', result);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.fetchedFromGoogle} reviews from Google. ${result.newReviews} new, ${result.updatedReviews} updated.`,
      data: {
        fetchedFromGoogle: result.fetchedFromGoogle,
        newReviews: result.newReviews,
        updatedReviews: result.updatedReviews,
        totalInDb: result.totalInDb,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in sync-google-reviews cron:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth for manual triggers
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Google Reviews sync (manual trigger)...');
    const result = await syncGoogleReviews();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${result.fetchedFromGoogle} reviews from Google. ${result.newReviews} new, ${result.updatedReviews} updated.`,
      data: {
        fetchedFromGoogle: result.fetchedFromGoogle,
        newReviews: result.newReviews,
        updatedReviews: result.updatedReviews,
        totalInDb: result.totalInDb,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in sync-google-reviews manual trigger:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
