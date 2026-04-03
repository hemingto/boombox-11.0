/**
 * @fileoverview Related guides sidebar for guide pages
 *
 * Displays a vertical list of other guides with thumbnail images,
 * following the same sidebar layout pattern as RecentBlogPosts.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { guidePages } from '@/data/guidePages';

export interface RelatedGuidesSectionProps {
  currentSlug: string;
  className?: string;
}

export function RelatedGuidesSection({
  currentSlug,
  className,
}: RelatedGuidesSectionProps) {
  const allGuides = Object.values(guidePages);
  const related = allGuides.filter(g => g.slug !== currentSlug);

  if (related.length === 0) return null;

  return (
    <div className={cn('flex-col', className)}>
      <h2 className="mb-6 text-text-primary">More Guides</h2>
      {related.map((guide, index) => (
        <article
          key={guide.slug}
          className="flex flex-row sm:flex-col mb-6 sm:mb-10"
        >
          <div className="w-32 h-24 sm:w-full sm:h-48 flex-none mb-4 mr-4 sm:mr-0">
            <Link
              href={`/guides/${guide.slug}`}
              className="block h-full"
              aria-label={`Read guide: ${guide.title}`}
            >
              <div className="relative w-full h-full rounded-md overflow-hidden">
                <Image
                  src={guide.heroImage}
                  alt={guide.heroImageAlt}
                  fill
                  className="rounded-md object-cover"
                  priority={index === 0}
                  sizes="(max-width: 640px) 128px, 300px"
                />
              </div>
            </Link>
          </div>

          <div className="flex flex-col flex-grow">
            <Link href={`/guides/${guide.slug}`}>
              <h3 className="mb-2 text-text-primary hover:text-primary">
                {guide.title}
              </h3>
            </Link>
            <p className="text-xs md:text-sm text-text-tertiary">
              {guide.readTime}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
