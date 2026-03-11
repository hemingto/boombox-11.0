'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface LocationAboutSectionProps {
  city: string;
  aboutContent: string;
  aboutContentTwo?: string | null;
  imageSrc?: string | null;
  imageAlt?: string | null;
  className?: string;
}

export function LocationAboutSection({
  city,
  aboutContent,
  aboutContentTwo,
  imageSrc,
  imageAlt,
  className,
}: LocationAboutSectionProps) {
  return (
    <div className={cn('sm:mb-48 mb-24', className)}>
      <section
        className="pt-6 sm:pt-12 pb-8 lg:px-16 px-12 ml-4"
        aria-labelledby="location-about-heading"
      >
        <h1 id="location-about-heading" className="mb-6">
          Storage in {city}
        </h1>

        <p className="text-base sm:text-lg text-text-primary max-w-3xl leading-relaxed">
          {aboutContent}
        </p>
      </section>

      {imageSrc && (
        <div className="relative h-[300px] sm:h-[500px] w-full overflow-hidden rounded-md lg:px-16 px-12 mx-4">
          <div className="relative h-full w-full overflow-hidden rounded-md">
            <Image
              src={imageSrc}
              alt={imageAlt ?? `Storage units in ${city}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      )}

      {aboutContentTwo && (
        <section className="pt-8 sm:pt-12 lg:px-16 px-12 mr-4 flex justify-end">
          <p className="text-base sm:text-lg text-text-primary max-w-3xl leading-relaxed text-right">
            {aboutContentTwo}
          </p>
        </section>
      )}
    </div>
  );
}
