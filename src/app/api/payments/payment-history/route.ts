/**
 * @fileoverview Fetch customer payment history from Stripe
 * @source boombox-10.0/src/app/api/stripe/get-payment-history/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves payment history including payment intents and invoices.
 * Returns formatted payment data with card information and invoice availability.
 *
 * USED BY (boombox-10.0 files):
 * - Customer dashboard payment history tables
 * - Payment history components in account settings
 * - Invoice download links and payment receipts
 *
 * INTEGRATION NOTES:
 * - Uses Stripe API to fetch payment intents and invoices
 * - Expands payment_method data for card information
 * - Critical for customer payment tracking - DO NOT modify logic
 * - Maps payment intents to invoices for comprehensive history
 *
 * @refactor Moved from /api/stripe/get-payment-history/ to /api/payments/payment-history/
 */

import { NextResponse } from 'next/server';
import { stripe } from '@/lib/integrations/stripeClient';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { getStripeCustomerId } from '@/lib/utils/stripeUtils';
import type { Stripe } from 'stripe';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Missing userId' },
        { status: 400 }
      );
    }

    const stripeCustomerId = await getStripeCustomerId(userId);
    
    if (!stripeCustomerId) {
      return NextResponse.json(
        { message: 'Stripe customer not found' },
        { status: 404 }
      );
    }

    // Get both payment intents and invoices
    const [paymentIntents, invoices] = await Promise.all([
      stripe.paymentIntents.list({
        customer: stripeCustomerId,
        limit: 100,
        expand: ['data.payment_method']
      }),
      stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 100,
        status: 'paid'
      })
    ]);

    // Create a map of payment intents that have invoices
    const invoiceMap = new Map();
    invoices.data.forEach(invoice => {
      if ((invoice as any).payment_intent) {
        invoiceMap.set((invoice as any).payment_intent, invoice);
      }
    });

    const formattedPayments = paymentIntents.data.map(payment => {
      const paymentMethod = payment.payment_method as Stripe.PaymentMethod;
      const hasInvoice = invoiceMap.has(payment.id);
      const invoice = invoiceMap.get(payment.id);
      
      // Extract card information
      const cardInfo = paymentMethod && 'card' in paymentMethod ? paymentMethod.card : null;
      const cardBrand = cardInfo?.brand || '';
      const last4 = cardInfo?.last4 || '';
      
      return {
        id: payment.id,
        status: payment.status === 'succeeded' ? 'Paid' : 'Outstanding',
        dueDate: new Date(payment.created * 1000).toLocaleDateString(),
        amount: formatCurrency(payment.amount / 100),
        title: payment.description || 'Payment',
        last4: last4,
        cardBrand: cardBrand,
        hasInvoice: hasInvoice,
        invoiceId: invoice?.id || null,
        type: hasInvoice ? 'invoice' : 'payment'
      };
    });

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
} 