import { NextRequest, NextResponse } from 'next/server';
import { GoogleReviewRequestService } from '@/lib/services/GoogleReviewRequestService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Google review request processing...');
    const result = await GoogleReviewRequestService.processEligibleFeedback();

    console.log('Google review request processing completed:', result);

    return NextResponse.json({
      success: true,
      message: `Sent ${result.appointmentsSent} appointment and ${result.packingSupplySent} packing supply review requests. ${result.errors} errors.`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in send-review-requests cron:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(
      'Starting Google review request processing (manual trigger)...'
    );
    const result = await GoogleReviewRequestService.processEligibleFeedback();

    return NextResponse.json({
      success: true,
      message: `Sent ${result.appointmentsSent} appointment and ${result.packingSupplySent} packing supply review requests. ${result.errors} errors.`,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(
      'Error in send-review-requests manual trigger:',
      errorMessage
    );
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
