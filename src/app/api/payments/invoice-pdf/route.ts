/**
 * @fileoverview Fetch invoice PDF or payment receipt URLs
 * @source boombox-10.0/src/app/api/stripe/get-invoice-pdf/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves hosted invoice URLs or payment receipt URLs.
 * Supports both invoice and payment receipt types based on query parameter.
 *
 * USED BY (boombox-10.0 files):
 * - Customer payment history pages
 * - Invoice download links in customer dashboard
 * - Receipt access from payment confirmation emails
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to fetch hosted invoice URLs and receipt URLs
 * - Handles both invoice and payment receipt types
 * - Critical for customer payment documentation - DO NOT modify logic
 * - Returns hosted URLs for PDF download/viewing
 *
 * @refactor Moved from /api/stripe/get-invoice-pdf/ to /api/payments/invoice-pdf/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import type { Stripe } from 'stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const type = searchParams.get('type') || 'payment'; // 'invoice' or 'payment'
    
    if (!paymentIntentId) {
      return NextResponse.json(
        { message: 'Missing paymentIntentId' },
        { status: 400 }
      );
    }

    if (type === 'invoice') {
      // Handle invoice PDF request
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const invoiceId = (paymentIntent as any).invoice;

      if (!invoiceId) {
        return NextResponse.json(
          { message: 'No invoice found for this payment' },
          { status: 404 }
        );
      }

      // Get the hosted invoice URL
      const invoice = await stripe.invoices.retrieve(invoiceId as string);
      const invoiceUrl = invoice.hosted_invoice_url;

      return NextResponse.json({ 
        url: invoiceUrl,
        type: 'invoice'
      });
    } else {
      // Handle payment receipt request
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Get the charges for this payment intent
      const charges = await stripe.charges.list({
        payment_intent: paymentIntentId,
        limit: 1
      });

      if (!charges.data || charges.data.length === 0) {
        return NextResponse.json(
          { message: 'No charges found for this payment' },
          { status: 404 }
        );
      }

      const charge = charges.data[0];
      const receiptUrl = charge.receipt_url;

      if (!receiptUrl) {
        return NextResponse.json(
          { message: 'No receipt available for this payment' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        url: receiptUrl,
        type: 'receipt'
      });
    }
  } catch (error) {
    console.error('Error fetching invoice/receipt URL:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoice/receipt URL' },
      { status: 500 }
    );
  }
} 