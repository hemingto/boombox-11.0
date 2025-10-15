/**
 * @fileoverview How It Works page - explains Boombox storage process
 * @source boombox-10.0/src/app/howitworks/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

import type { Metadata } from 'next';
import {
  HowItWorksHeroSection,
  HowItWorksStepSection,
  GetQuoteHowItWorks,
  HowItWorksFaqSection,
  HowItWorksCustomerReviewSection,
} from '@/components/features/howitworks';
import { HelpCenterSection } from '@/components/features/landing';

export const metadata: Metadata = {
  title: 'How It Works - Storage Delivery Process | Boombox Storage',
  description:
    'Learn how Boombox storage works: we pick up your items, store them securely, and deliver them back when you need them. Simple, convenient, and affordable.',
  keywords: 'how storage works, storage delivery, mobile storage process',
  openGraph: {
    title: 'How It Works - Storage Delivery Process | Boombox Storage',
    description:
      'Learn how Boombox storage works: we pick up, store, and deliver your items back when needed.',
    type: 'website',
  },
};

export default function HowItWorks() {
  return (
    <>
      <HowItWorksHeroSection />
      <HowItWorksStepSection />
      <GetQuoteHowItWorks />
      <HowItWorksCustomerReviewSection />
      <HowItWorksFaqSection />
      <HelpCenterSection />
    </>
  );
}

