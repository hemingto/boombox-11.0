/**
 * @fileoverview Customer payments page - payment methods and invoice history
 * @source boombox-10.0/src/app/user-page/[id]/payments/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with Stripe Elements
 */

'use client';

import {
  PaymentInvoices,
  PaymentMethodTable,
  PaymentsHero,
} from '@/components/features/customers';
import { useUser } from '@/contexts/UserContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function Payments() {
  const userId = useUser();

  if (!userId) {
    return <div>Loading user information...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-[1200px]">
        <PaymentsHero userId={userId} />
        <PaymentMethodTable userId={userId} />
        <PaymentInvoices userId={userId} />
      </div>
    </Elements>
  );
}

