/**
 * @fileoverview Appointment feedback submission API - POST endpoint for customer feedback
 * @source boombox-10.0/src/app/api/feedback/submit/route.ts (lines 1-217)
 * @refactor Migrated to centralized utilities with improved error handling and payment processing
 *
 * ENDPOINT FUNCTIONALITY:
 * - Accepts customer feedback for appointment services
 * - Processes tip payments using Stripe integration
 * - Updates driver ratings and feedback records
 * - Handles both new feedback creation and updates
 *
 * BUSINESS LOGIC:
 * - Validates appointment existence and feedback data
 * - Processes tip payments asynchronously without blocking response
 * - Updates OnfleetTask driver ratings based on customer input
 * - Maintains comprehensive error handling and logging
 *
 * USED BY:
 * - Customer feedback forms post-appointment
 * - Service rating and tip processing workflows
 * - Driver performance tracking systems
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';
import { StripeTipPaymentService } from '@/lib/services/stripe';
import {
  createOrUpdateAppointmentFeedback,
  updateDriverRatings,
  updateFeedbackWithPayment,
} from '@/lib/utils/adminTaskUtils';
import { SubmitFeedbackRequestSchema } from '@/lib/validations/api.validations';

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    console.log('Raw request body:', body);

    const validatedData = SubmitFeedbackRequestSchema.parse(body);
    const {
      appointmentId,
      rating,
      comments: comment,
      tipAmount,
      driverRatings,
      padlockCombos,
    } = validatedData;

    console.log('API received parsed data:', {
      appointmentId,
      rating,
      comment,
      tipAmount,
      driverRatings,
    });

    // Ensure appointmentId is a number
    const appointmentIdInt = Number(appointmentId);
    console.log('Converted appointmentId to number:', appointmentIdInt);

    if (isNaN(appointmentIdInt)) {
      return NextResponse.json(
        { error: `Invalid appointmentId format: ${appointmentId}` },
        { status: 400 }
      );
    }

    const tipAmountNumber = Number(tipAmount) || 0;
    console.log('Processing tip amount:', tipAmountNumber);

    // Create or update feedback
    let feedback = await createOrUpdateAppointmentFeedback(
      appointmentIdInt,
      rating,
      comment || '',
      tipAmountNumber
    );

    console.log(
      feedback
        ? 'Feedback processed successfully'
        : 'Failed to process feedback'
    );

    // Update driver ratings if provided
    if (driverRatings && typeof driverRatings === 'object') {
      try {
        await updateDriverRatings(appointmentIdInt, driverRatings);
        console.log('Updated driver ratings:', driverRatings);
      } catch (error) {
        console.error('Error updating driver ratings:', error);
        // Don't fail the whole request if driver rating update fails
      }
    }

    // Update padlock combos on StorageUnitUsage records if provided
    if (padlockCombos && typeof padlockCombos === 'object') {
      try {
        for (const [usageId, combo] of Object.entries(padlockCombos)) {
          await prisma.storageUnitUsage.update({
            where: { id: Number(usageId) },
            data: { padlockCombo: combo },
          });
        }
        console.log('Updated padlock combos for storage unit usages');
      } catch (error) {
        console.error('Error updating padlock combos:', error);
      }
    }

    // Process tip payment and distribute to drivers if tip amount is greater than 0
    if (tipAmountNumber > 0) {
      try {
        console.log('Processing tip payment and driver distribution...');

        const tipResult = await StripeTipPaymentService.processAppointmentTip({
          appointmentId: appointmentIdInt,
          tipAmount: tipAmountNumber,
          feedbackId: feedback.id,
        });

        if (!tipResult.success) {
          console.error('Error processing tip payment:', tipResult.error);
          return NextResponse.json({
            ...feedback,
            tipProcessingStatus: 'failed',
            tipProcessingError: tipResult.error,
          });
        }

        // Update feedback with the customer-side payment intent
        const updatedFeedback = await updateFeedbackWithPayment(
          feedback.id,
          tipResult.paymentIntentId!,
          tipResult.status!,
          false
        );

        feedback = updatedFeedback as any;

        // Log transfer results
        if (tipResult.transfers && tipResult.transfers.length > 0) {
          const completed = tipResult.transfers.filter(
            t => t.status === 'completed'
          );
          const skipped = tipResult.transfers.filter(
            t => t.status === 'skipped'
          );
          const failed = tipResult.transfers.filter(t => t.status === 'failed');
          console.log(
            `Tip transfers: ${completed.length} completed, ${skipped.length} skipped, ${failed.length} failed`
          );
        }

        console.log('Updated feedback with payment info:', feedback);
      } catch (paymentError) {
        console.error('Error during tip payment processing:', paymentError);
        return NextResponse.json({
          ...feedback,
          tipProcessingStatus: 'error',
          tipProcessingError: (paymentError as Error).message,
        });
      }
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Unhandled error in feedback submission:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
