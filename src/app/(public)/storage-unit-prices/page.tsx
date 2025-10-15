/**
 * @fileoverview Storage unit prices page - pricing comparison
 * @source boombox-10.0/src/app/storage-unit-prices/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import { HeroSection } from '@/components/features/landing';
import {
  AdditionalPricingInfoSection,
  CompetitorChartSection,
  PricingFAQSection,
} from '@/components/features/storage-unit-prices';
import { WhatFitsSection, CustomerReviewSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function StorageUnitPrices() {
  const featuresData = [
    { feature: 'Affordability', boombox: true, competitors: false },
    { feature: "Don't need to rent a truck", boombox: true, competitors: false },
    { feature: 'Only load and unload once', boombox: true, competitors: false },
    { feature: 'Optional labor', boombox: true, competitors: false },
    { feature: 'Optional packing supplies', boombox: true, competitors: false },
    { feature: 'Delivery to your door', boombox: true, competitors: false },
  ];

  return (
    <>
      <HeroSection title="Cheaper than self storage" buttontext="Check Rate" />
      <AdditionalPricingInfoSection />
      <CompetitorChartSection features={featuresData} />
      <CustomerReviewSection />
      <WhatFitsSection />
      <PricingFAQSection />
      <HelpCenterSection />
    </>
  );
}

