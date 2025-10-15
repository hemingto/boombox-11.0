/**
 * @fileoverview Insurance coverage page - protection options
 * @source boombox-10.0/src/app/insurance/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

import type { Metadata } from 'next';
import {
  InsuranceHeroSection,
  InsuranceTopSection,
  InsuranceProtections,
  InsuranceRates,
  InsuranceLegalTerms,
} from '@/components/features/insurance';
import { HelpCenterSection } from '@/components/features/landing';

export const metadata: Metadata = {
  title: 'Storage Insurance & Protection Plans | Boombox Storage',
  description:
    'Protect your belongings with Boombox Storage insurance coverage. Flexible protection plans starting at $10/month. Learn about our insurance options.',
  keywords:
    'storage insurance, protection plan, storage coverage, insured storage',
  openGraph: {
    title: 'Storage Insurance & Protection Plans | Boombox Storage',
    description:
      'Protect your belongings with flexible insurance coverage. Plans starting at $10/month.',
    type: 'website',
  },
};

export default function Insurance() {
  return (
    <>
      <InsuranceHeroSection />
      <InsuranceTopSection />
      <InsuranceProtections />
      <InsuranceRates />
      <InsuranceLegalTerms />
      <HelpCenterSection />
    </>
  );
}

