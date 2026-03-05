'use client';

import { TermsContactInfo } from '@/components/features/terms';
import { PrivacyPolicyText } from './PrivacyPolicyText';

export function PrivacyPolicyPageContent() {
  return (
    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-20 xl:gap-24 lg:px-16 px-6">
      <div className="sm:basis-2/3">
        <PrivacyPolicyText />
      </div>
      <div className="w-full sm:basis-1/3 sm:ml-auto">
        <TermsContactInfo />
      </div>
    </div>
  );
}
