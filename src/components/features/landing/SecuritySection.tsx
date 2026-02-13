/**
 * @fileoverview Security features section component for the landing page.
 * @source boombox-10.0/src/app/components/landingpage/securitysection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a grid of security features highlighting Boombox's storage safety measures.
 * Features:
 * - 4 security feature cards with icons
 * - Responsive grid layout (1 column mobile, 2 columns desktop)
 * - Hover effects for visual interactivity
 * - Custom icons for each security feature
 *
 * DESIGN SYSTEM UPDATES:
 * - Replaced `border-slate-100` with `border-border` for semantic border styling
 * - Applied consistent spacing and padding using design system tokens
 * - Maintained hover effects with proper transition classes
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Uses `<section>` element with descriptive `aria-label`
 * - Proper heading hierarchy with `<h1>` and `<h2>`
 * - Icons marked as decorative with `aria-hidden="true"`
 * - Feature cards use semantic `<article>` elements with accessible structure
 * - Descriptive text for screen readers
 *
 * BUSINESS LOGIC PRESERVED:
 * - Same 4 security features
 * - Same grid layout and responsive behavior
 * - Same hover scale effect
 * - Same content structure
 *
 * @refactor Refactored to use design system, improve accessibility, and align with boombox-11.0 structure.
 */

'use client';

import React from 'react';
import { StorageUnitIcon } from '@/components/icons/StorageUnitIcon';
import { LockIcon } from '@/components/icons/LockIcon';
import { SecurityCameraIcon } from '@/components/icons/SecurityCameraIcon';
import { WarehouseIcon } from '@/components/icons/WarehouseIcon';
import { cn } from '@/lib/utils';

/**
 * Security feature interface
 */
interface SecurityFeature {
  /**
   * Icon component to display
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Icon CSS classes for sizing
   */
  iconClassName: string;
  /**
   * Feature title
   */
  title: string;
  /**
   * Feature description
   */
  description: string;
}

export interface SecuritySectionProps {
  /**
   * Optional additional CSS classes for the section container
   */
  className?: string;

  /**
   * Section heading (defaults to 'Security you can trust')
   */
  heading?: string;

  /**
   * Optional custom security features (defaults to standard 4 features)
   */
  features?: SecurityFeature[];
}

/**
 * Default security features
 */
const DEFAULT_FEATURES: SecurityFeature[] = [
  {
    icon: SecurityCameraIcon,
    iconClassName: 'w-14',
    title: '24/7 monitored',
    description:
      'Our 24/7 monitored storage facility offers secure, round-the-clock surveillance to ensure the safety and protection of your belongings.',
  },
  {
    icon: LockIcon,
    iconClassName: 'w-10',
    title: 'Only you have access',
    description:
      "It's your stuff and only you should have access. Once your unit is padlocked we won't open it for any reason.",
  },
  {
    icon: StorageUnitIcon,
    iconClassName: 'w-12',
    title: 'Sturdy, steel construction',
    description:
      'Each unit is built tough with sturdy, steel construction. Making sure to hold up against the elements and keeping your belongings safe.',
  },
  {
    icon: WarehouseIcon,
    iconClassName: 'w-12',
    title: 'Secured facility',
    description:
      'Our warehouse is only accessible to Boombox employees, ensuring your items are safe and secure while in storage.',
  },
];

/**
 * SecuritySection Component
 *
 * Displays key security features of Boombox storage services in a responsive grid.
 *
 * @example
 * ```tsx
 * <SecuritySection />
 * ```
 *
 * @example With custom heading
 * ```tsx
 * <SecuritySection heading="Why Choose Boombox" />
 * ```
 *
 * @example With custom features
 * ```tsx
 * <SecuritySection
 *   features={customFeatures}
 *   heading="Our Security Features"
 * />
 * ```
 */
export function SecuritySection({
  className,
  heading = 'Security you can trust',
  features = DEFAULT_FEATURES,
}: SecuritySectionProps) {
  return (
    <section
      className={cn('mt-14 lg:px-16 px-6 sm:mb-48 mb-24', className)}
      aria-labelledby="security-section-heading"
    >
      <h1 id="security-section-heading" className="mb-10 py-4">
        {heading}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <article
              key={index}
              className="rounded-3xl p-6 border border-border transition-transform duration-300 sm:hover:scale-[102%] cursor-pointer"
            >
              <div className="h-12" aria-hidden="true">
                <Icon className={feature.iconClassName} />
              </div>
              <h2 className="py-4">{feature.title}</h2>
              <p className="max-w-[640px]">{feature.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
