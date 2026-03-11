/**
 * @fileoverview Hero section for guide pages
 *
 * Displays the guide title, subtitle, read time, and hero image.
 * Modeled after BlogPostHero but uses static guide data instead of
 * database-driven blog post data.
 */

import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface GuideHeroProps {
  title: string;
  subtitle: string;
  readTime: string;
  heroImage: string;
  heroImageAlt: string;
  className?: string;
}

export function GuideHero({
  title,
  subtitle,
  readTime,
  heroImage,
  heroImageAlt,
  className,
}: GuideHeroProps) {
  return (
    <header className={cn('w-full mt-8 mb-8 lg:px-16 px-6', className)}>
      <div className="mb-10">
        <nav className="mb-8 items-center" aria-label="Breadcrumb">
          <Link
            href="/help-center"
            className="flex items-center text-text-primary hover:text-primary"
          >
            <ChevronLeftIcon className="w-6 h-6" aria-hidden="true" />
            <span>Help Center</span>
          </Link>
        </nav>

        <div>
          <h1 className="mb-2 text-text-primary">{title}</h1>
          <p className="text-lg text-text-primary mb-3">{subtitle}</p>
          <p className="text-sm text-text-tertiary">{readTime}</p>
        </div>
      </div>

      <div className="relative bg-surface-tertiary w-full sm:h-[450px] h-[300px] xl:h-[500px] rounded-3xl overflow-hidden">
        <Image
          src={heroImage}
          alt={heroImageAlt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
    </header>
  );
}
