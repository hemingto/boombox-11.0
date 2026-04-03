'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

export interface RelatedCategory {
  slug: string;
  title: string;
  imageUrl: string;
}

export interface RelatedCategoriesSectionProps {
  currentSlug: string;
  categories: RelatedCategory[];
  className?: string;
}

export function RelatedCategoriesSection({
  currentSlug,
  categories,
  className,
}: RelatedCategoriesSectionProps) {
  const related = categories.filter(c => c.slug !== currentSlug);

  if (related.length === 0) return null;

  return (
    <section
      className={cn('lg:px-16 px-6 sm:mb-48 mb-24', className)}
      aria-labelledby="related-categories-heading"
    >
      <div className="flex flex-col sm:flex-row w-full justify-between items-left sm:items-center sm:mb-10 mb-4 py-4">
        <h2
          id="related-categories-heading"
          className="text-4xl sm:text-5xl font-semibold"
        >
          Related storage services
        </h2>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label="Related storage service categories"
      >
        {related.map(cat => (
          <div key={cat.slug} role="listitem">
            <Card
              imageSrc={cat.imageUrl}
              imageAlt={`${cat.title} storage service`}
              location={cat.title}
              link={`/${cat.slug}`}
              ariaLabel={`Learn more about ${cat.title}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
