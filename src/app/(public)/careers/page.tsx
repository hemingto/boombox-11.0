/**
 * @fileoverview Careers page - job opportunities
 * @source boombox-10.0/src/app/careers/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  CareersHeroSection,
  ValuesSection,
  CareersBannerPhoto,
} from '@/components/features/careers';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function Careers() {
  return (
    <>
      <CareersHeroSection />
      <ValuesSection />
      <CareersBannerPhoto />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

