/**
 * @fileoverview Help center page - FAQs and support
 * @source boombox-10.0/src/app/help-center/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

import type { Metadata } from 'next';
import {
  HelpCenterHero,
  FaqFilter,
  Guides,
  ContactUs,
} from '@/components/features/helpcenter';

export const metadata: Metadata = {
  title: 'Help Center - FAQs & Support | Boombox Storage',
  description:
    'Get help with Boombox Storage. Find answers to common questions about storage, delivery, pricing, and more. Contact our support team for assistance.',
  keywords: 'help center, faq, customer support, storage help, contact support',
  openGraph: {
    title: 'Help Center - FAQs & Support | Boombox Storage',
    description:
      'Get help with Boombox Storage. Find answers and contact our support team.',
    type: 'website',
  },
};

export default function HelpCenter() {
  return (
    <>
      <HelpCenterHero />
      <FaqFilter />
      <Guides />
      <ContactUs />
    </>
  );
}

