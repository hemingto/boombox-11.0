'use client';

import { TruckIcon } from '@/components/icons';

interface HaulerSignupHeroProps {
  title: string;
  description: string;
}

export const HaulerSignupHero: React.FC<HaulerSignupHeroProps> = ({
  title,
  description,
}) => {
  return (
    <section
      className="flex-col mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-12 mb-6 text-center"
      aria-labelledby="hauler-signup-hero-title"
    >
      <div className="mb-8">
        <TruckIcon
          className="w-20 mb-4 mx-auto text-text-primary"
          aria-hidden="true"
        />
        <h1 id="hauler-signup-hero-title" className="mb-4 text-text-primary">
          {title}
        </h1>
        <p className="text-text-primary">{description}</p>
      </div>
    </section>
  );
};
