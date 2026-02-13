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
import Image from 'next/image';
import Link from 'next/link';

/**
 * Decorative icon circles that scatter around the section edges.
 * Each entry defines a boombox-icon PNG inside a rounded bg-slate-50 circle
 * with a specific size, opacity, and absolute position.
 */
interface DecorativeIcon {
  src: string;
  size: number;
  opacity: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  /** Mobile-only overrides – falls back to desktop value when omitted */
  mobileTop?: string;
  mobileLeft?: string;
  mobileRight?: string;
  mobileBottom?: string;
}

const decorativeIcons: DecorativeIcon[] = [
  // ── Left side (top → bottom) ──
  {
    src: '/boombox-icons/plastic-bin.png',
    size: 100,
    opacity: 1,
    top: '4%',
    left: '14%',
    mobileLeft: '14%',
  },
  {
    src: '/boombox-icons/painting.png',
    size: 95,
    opacity: 1,
    top: '14%',
    left: '-2%',
    mobileTop: '12%',
    mobileLeft: '-3%',
  },
  {
    src: '/boombox-icons/wardrobe-box.png',
    size: 100,
    opacity: 1,
    top: '33%',
    left: '7%',
    mobileTop: '27%',
    mobileLeft: '-5%',
  },
  {
    src: '/boombox-icons/bedside-table.png',
    size: 100,
    opacity: 1,
    top: '51%',
    left: '-10%',
    mobileLeft: '-15%',
  },
  {
    src: '/boombox-icons/armchair.png',
    size: 100,
    opacity: 1,
    top: '62%',
    left: '12%',
    mobileLeft: '-15%',
  },
  {
    src: '/boombox-icons/desk.png',
    size: 110,
    opacity: 1,
    top: '76%',
    left: '-6%',
    mobileLeft: '-2%',
  },
  {
    src: '/boombox-icons/large-box.png',
    size: 85,
    opacity: 1,
    top: '90%',
    left: '15%',
    mobileTop: '89%',
    mobileLeft: '14%',
  },

  // ── Right side (top → bottom) ──
  {
    src: '/boombox-icons/dining-chair.png',
    size: 90,
    opacity: 1,
    top: '4%',
    right: '15%',
    mobileRight: '12%',
  },
  {
    src: '/boombox-icons/media-console.png',
    size: 125,
    opacity: 1,
    top: '12%',
    right: '-2%',
    mobileRight: '-5%',
  },
  {
    src: '/boombox-icons/toolbox.png',
    size: 100,
    opacity: 1,
    top: '44%',
    right: '-5%',
    mobileRight: '-15%',
  },
  {
    src: '/boombox-icons/small-box.png',
    size: 90,
    opacity: 1,
    top: '32%',
    right: '8%',
    mobileTop: '27%',
    mobileRight: '-1%',
  },
  {
    src: '/boombox-icons/sofa-chair.png',
    size: 100,
    opacity: 1,
    top: '65%',
    right: '2%',
    mobileTop: '70%',
    mobileRight: '-5%',
  },
  {
    src: '/boombox-icons/rug.png',
    size: 120,
    opacity: 1,
    top: '82%',
    right: '12%',
    mobileTop: '84%',
    mobileRight: '5%',
  },
  {
    src: '/boombox-icons/medium-box.png',
    size: 95,
    opacity: 1,
    top: '85%',
    right: '-12%',
    mobileRight: '-15%',
  },
];

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
 * for additional support and answers to their questions. Decorative icon
 * circles with boombox-icons are scattered around the edges, varying in
 * size and opacity, wrapping around the centered text content.
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
      className={`bg-surface-tertiary lg:px-16 px-6 pt-14 pb-24 ${className || ''}`}
      aria-label="Help center call to action"
    >
      <div className="relative overflow-hidden bg-surface-primary rounded-md w-full py-24 px-6">
        {/* Decorative icons – scaled down on small screens */}
        {decorativeIcons.map((icon, i) => (
          <Image
            key={i}
            src={icon.src}
            alt=""
            width={icon.size}
            height={icon.size}
            className="absolute object-contain animate-float decorative-icon"
            style={
              {
                '--icon-size': `${icon.size}px`,
                ...(icon.top && { '--icon-top': icon.top }),
                ...(icon.left && { '--icon-left': icon.left }),
                ...(icon.right && { '--icon-right': icon.right }),
                ...(icon.bottom && { '--icon-bottom': icon.bottom }),
                ...(icon.mobileTop && { '--icon-top-mobile': icon.mobileTop }),
                ...(icon.mobileLeft && {
                  '--icon-left-mobile': icon.mobileLeft,
                }),
                ...(icon.mobileRight && {
                  '--icon-right-mobile': icon.mobileRight,
                }),
                ...(icon.mobileBottom && {
                  '--icon-bottom-mobile': icon.mobileBottom,
                }),
                opacity: icon.opacity,
                animationDelay: `${i * 0.4}s`,
              } as React.CSSProperties
            }
            aria-hidden="true"
          />
        ))}

        {/* Edge gradient overlays (left, right, top, bottom) */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[30%]"
          style={{
            background:
              'linear-gradient(to right, rgb(var(--color-surface-primary)) 0%, transparent 35%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-[30%]"
          style={{
            background:
              'linear-gradient(to left, rgb(var(--color-surface-primary)) 0%, transparent 35%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[50%]"
          style={{
            background:
              'linear-gradient(to bottom, rgb(var(--color-surface-primary)) 0%, transparent 35%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[50%]"
          style={{
            background:
              'linear-gradient(to top, rgb(var(--color-surface-primary)) 0%, transparent 35%)',
          }}
          aria-hidden="true"
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md lg:max-w-fit mx-auto">
          <HelpIcon className="w-16 mb-4" aria-hidden="true" />
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
      </div>
    </section>
  );
}
