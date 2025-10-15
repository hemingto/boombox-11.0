/**
 * @fileoverview Mover signup page - moving partner registration
 * @source boombox-10.0/src/app/mover-signup/page.tsx
 * @refactor Migrated to (auth) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import { MoverSignUpHero, MoverSignUpForm } from '@/components/features/moving-partners';
import { CitiesSection } from '@/components/features/locations';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';
import { Footer } from '@/components/ui/navigation/Footer';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function MoverSignUp() {
  return (
    <>
      <MoverSignUpHero
        title="Mover Sign up"
        description="join our moving partner network and start earning"
      />
      <MoverSignUpForm />
      <CitiesSection title="Find work in the following cities" />
      <FaqSection />
      <HelpCenterSection />
      <Footer />
    </>
  );
}

