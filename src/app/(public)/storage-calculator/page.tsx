/**
 * @fileoverview Storage calculator page - helps users estimate storage needs
 * @source boombox-10.0/src/app/storage-calculator/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  StorageCalculatorHero,
  StorageCalculatorSection,
  ItemsThatFitSection,
  NumberOfUnitsSection,
  ContainerInfoSection,
  StorageCalculatorFAQ,
} from '@/components/features/storage-calculator';
import { HowItWorksCustomerReviewSection } from '@/components/features/howitworks';
import { HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component due to interactive calculator
// SEO metadata should be added via generateMetadata when converting to server component

export default function StorageCalculator() {
  return (
    <>
      <StorageCalculatorHero />
      <StorageCalculatorSection />
      <ItemsThatFitSection />
      <NumberOfUnitsSection />
      <ContainerInfoSection />
      <HowItWorksCustomerReviewSection />
      <StorageCalculatorFAQ />
      <HelpCenterSection />
    </>
  );
}

