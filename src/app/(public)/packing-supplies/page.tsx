/**
 * @fileoverview Packing supplies page - order moving supplies
 * @source boombox-10.0/src/app/packing-supplies/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  PackingSuppliesLayout,
} from '@/components/features/packing-supplies';

// Note: Page is client component due to interactive cart
// SEO metadata should be added via generateMetadata when converting to server component

export default function PackingSupplies() {
  return (
    <PackingSuppliesLayout userData={null} />
  );
}

