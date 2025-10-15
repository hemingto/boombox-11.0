/**
 * @fileoverview Checklist page - moving and storage checklist
 * @source boombox-10.0/src/app/checklist/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import { ChecklistSection } from '@/components/features/content';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function Checklist() {
  return (
    <>
      <ChecklistSection />
    </>
  );
}

