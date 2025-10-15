/**
 * @fileoverview Landing page - main homepage
 * @source boombox-10.0/src/app/page.tsx
 * @refactor Migrated to (public) route group with proper SEO metadata
 */

import type { Metadata } from 'next';
import {
  HeroSection,
  HowItWorksSection,
  WhatFitsSection,
  CustomerReviewSection,
  TechEnabledSection,
  SecuritySection,
  FaqSection,
  HelpCenterSection,
} from '@/components/features/landing';

export const metadata: Metadata = {
  title: 'Full-Service Storage San Francisco | Boombox Storage',
  description:
    'Looking for storage? San Francisco-based Boombox is a full-service storage company managing the pick up, storage, and retrieval of your things. ✓ Book today!',
  keywords:
    'storage san francisco, mobile storage, full service storage, storage units delivered',
  openGraph: {
    title: 'Full-Service Storage San Francisco | Boombox Storage',
    description:
      'San Francisco-based Boombox is a full-service storage company managing the pick up, storage, and retrieval of your things.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full-Service Storage San Francisco | Boombox Storage',
    description:
      'San Francisco-based Boombox is a full-service storage company managing the pick up, storage, and retrieval of your things.',
  },
};

export default function Home() {
  return (
    <>
      <HeroSection title="Storage units, delivered." buttontext="Get Quote" />
      <HowItWorksSection />
      <WhatFitsSection />
      <CustomerReviewSection />
      <TechEnabledSection />
      <SecuritySection />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

