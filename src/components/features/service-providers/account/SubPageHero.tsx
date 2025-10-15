/**
 * @fileoverview Sub-page hero component with back navigation for service provider account pages
 * @source boombox-10.0/src/app/components/mover-account/subpagehero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Provides a consistent header for sub-pages within service provider (driver/mover) account sections.
 * Includes a back navigation button with dynamic routing based on user type and optional description text.
 * Used across various account management sub-pages for consistent navigation patterns.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced text-zinc-950 with text-text-primary for semantic color usage
 * - Uses established spacing patterns (mt-12 sm:mt-24, lg:px-16 px-6)
 * - Maintained responsive font sizing and layout from design system
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added aria-label to back button for screen readers
 * - Added role="navigation" to wrapping section
 * - Ensured proper heading hierarchy with h1
 * - Added keyboard navigation support through semantic Link component
 * 
 * @refactor Renamed to PascalCase, applied design system colors, enhanced accessibility
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

interface SubPageHeroProps {
  /** Page title displayed in the hero */
  title: string;
  /** Optional description text displayed below the title */
  description?: string;
  /** Type of user account (driver or mover/moving partner) */
  userType: 'mover' | 'driver';
  /** User's unique identifier for routing */
  userId: string;
}

/**
 * Determines the correct back navigation link based on user type and ID
 * 
 * @param userType - Type of service provider account
 * @param userId - User's unique identifier
 * @returns The appropriate back link URL
 */
function getBackLink(userType: 'mover' | 'driver', userId: string): string {
  if (userType === 'driver' && userId) {
    return `/driver-account-page/${userId}`;
  } else if (userType === 'mover' && userId) {
    return `/mover-account-page/${userId}`;
  } else if (userType === 'driver') {
    return '/driver-account-page';
  } else {
    return '/mover-account-page';
  }
}

/**
 * SubPageHero component for service provider account sub-pages
 * 
 * Displays a page title with back navigation to the main account page.
 * The back link is dynamically generated based on the user type (driver/mover)
 * and user ID. Optionally displays a description below the title.
 * 
 * @example
 * ```tsx
 * <SubPageHero
 *   title="Payment Settings"
 *   description="Manage your payment methods and payout preferences"
 *   userType="driver"
 *   userId="driver-123"
 * />
 * ```
 */
export function SubPageHero({ 
  title, 
  description, 
  userType, 
  userId 
}: SubPageHeroProps) {
  const backLink = getBackLink(userType, userId);
  const backLabel = userType === 'driver' ? 'Back to Driver Account' : 'Back to Mover Account';

  return (
    <section 
      className="flex flex-col mt-12 sm:mt-24 mb-12 lg:px-16 px-6 max-w-5xl w-full mx-auto"
      role="navigation"
      aria-label="Sub-page navigation"
    >
      <div className="flex items-center gap-2 lg:-ml-10">
        {/* Back Navigation Button */}
        <Link 
          href={backLink}
          aria-label={backLabel}
          className="flex items-center hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          <ChevronLeftIcon 
            className="w-8 h-8 cursor-pointer shrink-0 text-text-primary" 
            aria-hidden="true"
          />
          <span className="sr-only">{backLabel}</span>
        </Link>

        {/* Page Title */}
        <h1 className="text-4xl font-semibold text-text-primary">
          {title}
        </h1>
      </div>

      {/* Optional Description */}
      {description && (
        <p className="mt-4 text-text-primary">
          {description}
        </p>
      )}
    </section>
  );
}

