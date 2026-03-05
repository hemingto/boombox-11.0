'use client';

import { PrivacyPolicyHero, PrivacyPolicyPageContent } from '@/components/features/privacy-policy';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

export default function PrivacyPolicy() {
  return (
    <>
      <PrivacyPolicyHero />
      <PrivacyPolicyPageContent />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}
