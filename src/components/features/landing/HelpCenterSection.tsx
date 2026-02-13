/**
 * @fileoverview Help Center Section component for landing page
 * @source boombox-10.0/src/app/components/landingpage/helpcentersection.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays a two-column call-to-action card encouraging users to visit the help center
 * for additional questions and support. Text content (icon, heading, description, CTA)
 * sits on the left with a product image on the right. Stacks vertically on mobile.
 *
 * API ROUTES UPDATED:
 * - None (static content component)
 *
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (semantic surface color)
 * - bg-white → bg-surface-primary (semantic surface color)
 * - Replaced inline button styles with btn-primary utility class
 * - Applied consistent container padding (lg:px-16 px-6)
 * - Fixed Link/button hierarchy (Link wraps button content, not vice versa)
 * - Two-column responsive layout (flex-col → md:flex-row)
 *
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML with section element
 * - Added proper ARIA label for section
 * - Icon has aria-hidden attribute (decorative)
 * - Proper heading hierarchy with h1
 * - Link has descriptive accessible name
 * - Image has descriptive alt text
 *
 * PATTERN IMPROVEMENTS:
 * - Fixed incorrect pattern: button wrapping Link → Link wrapping button
 * - Improved semantic HTML structure
 * - Enhanced responsive spacing
 * - Two-column layout with responsive stacking
 *
 * @refactor Migrated to features/landing with design system compliance, accessibility improvements, and pattern corrections
 */

import { HelpIcon } from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';

export interface HelpCenterSectionProps {
  /**
   * Main heading text
   * @default 'Still have questions?'
   */
  title?: string;

  /**
   * Description text
   * @default 'No problem! Find more answers at our help center page.'
   */
  description?: string;

  /**
   * Button text
   * @default 'Go to Help Center'
   */
  buttonText?: string;

  /**
   * Help center page URL
   * @default '/help-center'
   */
  helpCenterUrl?: string;

  /**
   * Image source path for the right column
   * @default '/boombox-unit.png'
   */
  imageSrc?: string;

  /**
   * Alt text for the image
   * @default 'Boombox storage unit'
   */
  imageAlt?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Help Center Section Component
 *
 * Displays a two-column call-to-action card prompting users to visit the help center
 * for additional support and answers to their questions. Text content on the left,
 * product image on the right. Stacks vertically on mobile.
 *
 * @example
 * ```tsx
 * <HelpCenterSection />
 *
 * // With custom content
 * <HelpCenterSection
 *   title="Need more help?"
 *   description="Our help center has detailed guides."
 *   buttonText="View Help Center"
 *   imageSrc="/custom-image.png"
 * />
 * ```
 */
export function HelpCenterSection({
  title = 'Still have questions?',
  description = 'No problem! Find more answers at our help center page.',
  buttonText = 'Go to Help Center',
  helpCenterUrl = '/help-center',
  imageSrc = '/relaxed-customer.png',
  imageAlt = 'Boombox storage unit',
  className,
}: HelpCenterSectionProps) {
  return (
    <section
      className={`bg-surface-tertiary lg:px-16 px-6 pt-14 pb-24 ${className || ''}`}
      aria-label="Help center call to action"
    >
      <div className="bg-surface-primary rounded-3xl w-full overflow-hidden flex flex-col md:flex-row min-h-[480px]">
        {/* Text content — left column on desktop, top on mobile */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left justify-center p-8 md:p-12 lg:p-16 md:w-1/2">
          {/* <HelpIcon className="w-10 mb-4" aria-hidden="true" /> */}
          <h1 className="mb-2 mt-10 sm:mt-0 text-2xl sm:text-3xl">{title}</h1>
          <p className="mb-8">{description}</p>
          <Link
            href={helpCenterUrl}
            className="btn-primary mb-8 sm:mb-0"
            aria-label={`${buttonText} - Visit our help center for more information`}
          >
            {buttonText}
          </Link>
        </div>

        {/* Image — right column on desktop, bottom on mobile */}
        <div className="relative min-h-[250px] md:min-h-0 md:w-1/2">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}
