/**
 * @fileoverview Storage guidelines page - what can/cannot be stored
 * @source boombox-10.0/src/app/storage-guidelines/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  StorageGuidelinesHero,
  StorageGuidelinesList,
} from '@/components/features/storage-guidelines';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function StorageGuidelines() {
  return (
    <>
      <StorageGuidelinesHero />
      <StorageGuidelinesList />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

