/**
 * @fileoverview Sitemap page - site navigation map
 * @source boombox-10.0/src/app/sitemap/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import { SiteMapHero, SiteMapLinks } from '@/components/features/sitemap';
import { HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function SiteMap() {
  return (
    <>
      <SiteMapHero />
      <SiteMapLinks />
      <HelpCenterSection />
    </>
  );
}

