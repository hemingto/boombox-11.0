/**
 * @fileoverview Driver signup page - driver registration
 * @source boombox-10.0/src/app/driver-signup/page.tsx
 * @refactor Migrated to (auth) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  DriverSignupHero,
  DriverSignUpForm,
  DriverQualifySection,
  DriverMoreInfoSection,
} from '@/components/features/drivers';
import { CitiesSection } from '@/components/features/locations';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';
import { Footer } from '@/components/ui/navigation/Footer';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function DriverSignUp() {
  return (
    <>
      <DriverSignupHero
        title="Driver Sign up"
        description="join our driver network and start earning"
      />
      <DriverSignUpForm />
      <DriverQualifySection />
      <DriverMoreInfoSection />
      <CitiesSection title="Find work in the following cities" />
      <FaqSection />
      <HelpCenterSection />
      <Footer />
    </>
  );
}

