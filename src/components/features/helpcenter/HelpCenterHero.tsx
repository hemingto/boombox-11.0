/**
 * @fileoverview Help Center hero section component
 * @source boombox-10.0/src/app/components/helpcenter/helpcenterhero.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays the hero section for the help center page with icon, title, and subtitle.
 * Includes a placeholder area for future content/image integration.
 *
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (semantic surface color)
 * - Applied consistent spacing using design system tokens
 * - Used semantic HTML elements (section, header)
 *
 * PRIMITIVE COMPONENTS USED:
 * - HelpIcon from @/components/icons
 * - next/image Image component for optimized hero image
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML structure (section, header)
 * - Proper heading hierarchy (h1)
 * - Added ARIA landmark for hero section
 * - Descriptive alt text context for icon
 * - Configurable alt text for hero image
 *
 * @refactor Refactored with design system compliance and enhanced accessibility
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { HelpIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface HelpCenterHeroProps {
  /**
   * Main heading text
   * @default 'Help Center'
   */
  title?: string;

  /**
   * Subtitle text
   * @default 'let us know how we can help'
   */
  subtitle?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the icon
   */
  iconClassName?: string;

  /**
   * Whether to show the hero image
   * @default true
   */
  showImage?: boolean;

  /**
   * Source path for the hero image
   * @default '/images/help-center-hero.webp'
   */
  imageSrc?: string;

  /**
   * Alt text for the hero image
   * @default 'Help center hero'
   */
  imageAlt?: string;
}

/**
 * HelpCenterHero Component
 *
 * Displays the hero section for the help center with icon, title, and subtitle.
 * Implements WCAG 2.1 AA accessibility standards with proper semantic HTML.
 */
export function HelpCenterHero({
  title = 'Help Center',
  subtitle = 'let us know how we can help',
  className,
  iconClassName,
  showImage = true,
  imageSrc = '/help-center/help-center-hero.png',
  imageAlt = 'Help center hero',
}: HelpCenterHeroProps) {
  return (
    <section
      className={cn(
        'flex-col mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-12 mb-6',
        className
      )}
      aria-label="Help center introduction"
    >
      <header className="place-content-center mb-8">
        <HelpIcon
          className={cn('mb-4 w-12 h-12', iconClassName)}
          aria-hidden="true"
        />
        <h1 className="mb-4">{title}</h1>
        <p className="text-text-primary">{subtitle}</p>
      </header>

      {showImage && (
        <div className="relative h-[300px] sm:h-[500px] w-full overflow-hidden rounded-md">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
            priority
          />
        </div>
      )}
    </section>
  );
}

export default HelpCenterHero;
