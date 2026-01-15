/**
 * @fileoverview Hero section for the "How It Works" page
 * @source boombox-10.0/src/app/components/howitworks/howitworksherosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the main hero section for the "How It Works" page with icon, heading, and tagline.
 * Provides a clean introduction to the 4-step storage process.
 * Simple, focused hero design without imagery to emphasize the process steps below.
 * 
 * API ROUTES UPDATED:
 * - None (presentation component, no API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic text colors (text-text-primary, text-text-secondary)
 * - Maintained responsive spacing with consistent design system patterns
 * - Enhanced icon sizing with proper responsive classes
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added proper heading hierarchy (h1 for main heading)
 * - Added semantic HTML structure with proper landmark
 * - Icon uses currentColor for proper color inheritance
 * - Proper text hierarchy with paragraph element
 * 
 * @refactor Migrated to features/howitworks with design system compliance and enhanced accessibility
 */

'use client';

import React from 'react';
import { ClipboardIcon } from '@/components/icons/ClipboardIcon';

export interface HowItWorksHeroSectionProps {
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * HowItWorksHeroSection component
 * Hero section introducing the "How It Works" process
 */
export function HowItWorksHeroSection({ 
  className 
}: HowItWorksHeroSectionProps) {
  return (
    <section 
      className={`md:flex mt-12 sm:mt-24 lg:px-16 px-6 ${className || ''}`}
      aria-labelledby="hero-heading"
    >
      <div className="place-content-center mb-8">
        <ClipboardIcon 
          className="mb-4 w-12 h-12 text-text-primary" 
          aria-hidden="true"
        />
        <h1 
          id="hero-heading"
          className="mb-4 text-text-primary"
        >
          How it works
        </h1>
        <p className="text-text-primary">
          start storing in 4 easy steps
        </p>
      </div>
    </section>
  );
}

