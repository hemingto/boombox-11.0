'use client';

import {
  HaulerSignUpForm,
  HaulerSignupHero,
} from '@/components/features/hauling-partners';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';
import { Footer } from '@/components/ui/navigation/Footer';

export default function HaulerSignUp() {
  return (
    <>
      <HaulerSignupHero
        title="Hauler Sign Up"
        description="Join our hauling partner network and start earning"
      />
      <HaulerSignUpForm />
      <FaqSection />
      <HelpCenterSection />
      <Footer />
    </>
  );
}
