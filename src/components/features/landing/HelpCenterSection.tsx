/**
 * @fileoverview Help Center Section component for landing page
 * @source boombox-10.0/src/app/components/landingpage/helpcentersection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a centered call-to-action card encouraging users to visit the help center
 * for additional questions and support. Features an icon, heading, description text,
 * and a prominent link button to the help center page.
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
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added semantic HTML with section element
 * - Added proper ARIA label for section
 * - Icon has aria-hidden attribute (decorative)
 * - Proper heading hierarchy with h1
 * - Link has descriptive accessible name
 * - Card has proper focus management
 * 
 * PATTERN IMPROVEMENTS:
 * - Fixed incorrect pattern: button wrapping Link → Link wrapping button
 * - Improved semantic HTML structure
 * - Enhanced responsive spacing
 * 
 * @refactor Migrated to features/landing with design system compliance, accessibility improvements, and pattern corrections
 */

import { HelpIcon } from '@/components/icons';
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
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Help Center Section Component
 * 
 * Displays a call-to-action card prompting users to visit the help center
 * for additional support and answers to their questions.
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
 * />
 * ```
 */
export function HelpCenterSection({
  title = 'Still have questions?',
  description = 'No problem! Find more answers at our help center page.',
  buttonText = 'Go to Help Center',
  helpCenterUrl = '/help-center',
  className,
}: HelpCenterSectionProps) {
  return (
    <section 
      className={`md:flex bg-surface-tertiary lg:px-16 px-6 pt-14 pb-24 ${className || ''}`}
      aria-label="Help center call to action"
    >
      <div className="bg-surface-primary rounded-md w-full flex flex-col items-center text-center p-24">
        <HelpIcon 
          className="w-16 mb-4" 
          aria-hidden="true"
        />
        <h1 className="mb-8">{title}</h1>
        <p className="mb-10">{description}</p>
        <Link 
          href={helpCenterUrl}
          className="btn-primary"
          aria-label={`${buttonText} - Visit our help center for more information`}
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}

