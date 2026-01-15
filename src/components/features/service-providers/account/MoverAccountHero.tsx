/**
 * @fileoverview Hero section for mover/moving partner account pages with personalized greeting
 * @source boombox-10.0/src/app/components/mover-account/mover-account-hero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a personalized greeting message for movers/moving partners on their account dashboard.
 * Shows the user's display name and a helpful message about account management.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic text colors (text-text-primary for heading)
 * - Applies standardized spacing patterns from layout system
 * - Maintains responsive padding and margins from design system
 * 
 * @refactor Renamed to PascalCase, applied design system patterns, enhanced accessibility
 */

'use client';

import React from 'react';

interface MoverAccountHeroProps {
  /** Display name of the mover/moving partner */
  displayName: string;
  /** Optional custom message override */
  message?: string;
}

/**
 * Hero section component for mover account pages
 * 
 * Displays a personalized greeting with the mover's name and account management instructions.
 * Follows design system spacing and typography patterns.
 * 
 * @example
 * ```tsx
 * <MoverAccountHero displayName="John Smith" />
 * ```
 */
export function MoverAccountHero({ 
  displayName, 
  message = 'You can manage your account settings from this page' 
}: MoverAccountHeroProps) {
  return (
    <section 
      className="flex flex-col mt-12 sm:mt-24 sm:mb-10 mb-8 lg:px-16 px-6 max-w-5xl w-full mx-auto"
      aria-labelledby="account-hero-heading"
    >
      <h2 
        id="account-hero-heading"
        className="text-4xl font-semibold text-text-primary"
      >
        Hi {displayName},
      </h2>
      <p className="mt-4 text-text-primary">
        {message}
      </p>
    </section>
  );
}

