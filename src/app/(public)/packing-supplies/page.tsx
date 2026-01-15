/**
 * @fileoverview Packing supplies page - order moving supplies
 * @source boombox-10.0/src/app/packing-supplies/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata and Stripe Elements
 */

'use client';

import type { Metadata } from 'next';
import {
  PackingSuppliesLayout,
} from '@/components/features/packing-supplies';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/integrations/stripeClientSide';

// Note: Page is client component due to interactive cart
// SEO metadata should be added via generateMetadata when converting to server component

const stripePromise = getStripePromise();

export default function PackingSupplies() {
  return (
    <Elements stripe={stripePromise}>
      <PackingSuppliesLayout userData={null} />
    </Elements>
  );
}

