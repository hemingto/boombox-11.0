/**
 * @fileoverview Terms of service page - legal terms and conditions
 * @source boombox-10.0/src/app/terms/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import { TermsHero, TermsPageContent } from '@/components/features/terms';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function Terms() {
  return (
    <>
      <TermsHero />
      <TermsPageContent />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

