'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface CategoryAboutSectionProps {
  heading: string;
  aboutContent: string;
  aboutContentTwo?: string | null;
  imageSrc?: string | null;
  imageAlt?: string | null;
  className?: string;
}

export function CategoryAboutSection({
  heading,
  aboutContent,
  aboutContentTwo,
  imageSrc,
  imageAlt,
  className,
}: CategoryAboutSectionProps) {
  return (
    <div className={cn('sm:mb-48 mb-24', className)}>
      <section
        className="pt-6 sm:pt-12 pb-8 lg:px-16 px-6"
        aria-labelledby="category-about-heading"
      >
        <h2
          id="category-about-heading"
          className="mb-6 text-4xl sm:text-5xl font-semibold"
        >
          {heading}
        </h2>

        <p className="text-base sm:text-lg text-text-primary max-w-3xl leading-relaxed">
          {aboutContent}
        </p>
      </section>

      {imageSrc && (
        <div className="relative h-[300px] sm:h-[500px] w-full overflow-hidden rounded-md lg:px-16 px-6">
          <div className="relative h-full w-full overflow-hidden rounded-md">
            <Image
              src={imageSrc}
              alt={imageAlt ?? heading}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      )}

      {aboutContentTwo && (
        <section className="pt-8 sm:pt-12 lg:px-16 px-6 flex justify-end">
          <p className="text-base sm:text-lg text-text-primary max-w-3xl leading-relaxed text-right">
            {aboutContentTwo}
          </p>
        </section>
      )}
    </div>
  );
}
