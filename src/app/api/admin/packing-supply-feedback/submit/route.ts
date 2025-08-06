/**
 * @fileoverview Packing supply feedback submission API - POST endpoint for delivery feedback
 * @source boombox-10.0/src/app/api/packing-supplies/feedback/submit/route.ts (lines 1-189)
 * @refactor Migrated to centralized utilities with improved error handling and payment processing
 * 
 * ENDPOINT FUNCTIONALITY:
 * - Accepts customer feedback for packing supply deliveries
 * - Processes tip payments using Stripe integration
 * - Updates driver ratings and feedback records for delivery orders
 * - Handles both new feedback creation and updates
 * 
 * BUSINESS LOGIC:
 * - Validates packing supply order existence via task short ID
 * - Processes tip payments for delivery drivers
 * - Updates feedback records with driver ratings and comments
 * - Maintains comprehensive error handling for payment failures
 * 
 * USED BY:
 * - Customer feedback forms post-delivery
 * - Packing supply service rating workflows
 * - Driver tip processing for delivery services
 */

import { NextResponse } from 'next/server';
import { StripeTipPaymentService } from '@/lib/services/stripe';
import {
  createOrUpdatePackingSupplyFeedback,
  updateFeedbackWithPayment
} from '@/lib/utils/adminTaskUtils';

// Packing supply feedback request schema (inline for this specific endpoint)
import { z } from 'zod';

const PackingSupplyFeedbackRequestSchema = z.object({
  taskShortId: z.string().min(1, 'Task short ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  tipAmount: z.number().min(0).optional(),
  driverRating: z.enum(['thumbs_up', 'thumbs_down']).optional()
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    console.log('Raw request body:', body);

    const validatedData = PackingSupplyFeedbackRequestSchema.parse(body);
    const { taskShortId, rating, comment, tipAmount, driverRating } = validatedData;
    
    console.log('API received parsed data:', { taskShortId, rating, comment, tipAmount, driverRating });

    const tipAmountNumber = Number(tipAmount) || 0;
    console.log('Processing tip amount:', tipAmountNumber);

    // Create or update packing supply feedback
    const { feedback, order } = await createOrUpdatePackingSupplyFeedback(
      taskShortId,
      rating,
      comment || '',
      tipAmountNumber,
      driverRating || null
    );

    console.log(feedback ? 'Packing supply feedback processed successfully' : 'Failed to process feedback');
    
    // Process tip payment if tip amount is greater than 0
    if (tipAmountNumber > 0) {
      try {
        console.log('Processing tip payment for packing supply order...');
        
        // Check if user has Stripe customer ID
        if (!order.user?.stripeCustomerId) {
          console.error('No Stripe customer ID found for order:', order.id);
          return NextResponse.json({
            ...feedback,
            tipProcessingStatus: 'failed',
            tipProcessingError: 'No payment method on file'
          });
        }

        const tipResult = await StripeTipPaymentService.processPackingSupplyTip({
          orderId: order.id,
          tipAmount: tipAmountNumber,
          stripeCustomerId: order.user.stripeCustomerId
        });
        
        if (!tipResult.success) {
          console.error('Error processing tip payment:', tipResult.error);
          // Return feedback with tip processing error info
          return NextResponse.json({
            ...feedback,
            tipProcessingStatus: 'failed',
            tipProcessingError: tipResult.error
          });
        }
        
        // Update the feedback with the payment status
        const updatedFeedback = await updateFeedbackWithPayment(
          feedback.id,
          tipResult.paymentIntentId!,
          tipResult.status!,
          true // is packing supply
        );
        
        console.log('Updated feedback with payment info:', updatedFeedback);
        return NextResponse.json(updatedFeedback);
      } catch (paymentError) {
        console.error('Error during tip payment processing:', paymentError);
        // Return feedback with payment error info
        return NextResponse.json({
          ...feedback,
          tipProcessingStatus: 'error',
          tipProcessingError: (paymentError as Error).message
        });
      }
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Unhandled error in packing supply feedback submission:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}