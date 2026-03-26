'use client';

import { HaulerSignUpForm } from '@/components/features/hauling-partners/HaulerSignUpForm';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';
import { Footer } from '@/components/ui/navigation/Footer';

export default function HaulerSignUp() {
  return (
    <>
      <div className="bg-primary text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Hauling Partner Sign Up
          </h1>
          <p className="text-lg text-white/90">
            Join our hauling partner network and start earning
          </p>
        </div>
      </div>
      <HaulerSignUpForm />
      <FaqSection />
      <HelpCenterSection />
      <Footer />
    </>
  );
}
