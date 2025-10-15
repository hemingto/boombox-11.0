/**
 * @fileoverview Driver Signup Hero Section - Hero component for driver signup page
 * @source boombox-10.0/src/app/components/driver-signup/driversignuphero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a hero section for driver signup with:
 * - Truck icon visual element
 * - Dynamic title and description props
 * - Centered layout with responsive spacing
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic text colors (text-text-primary)
 * - Used design system spacing and responsive classes
 * - Enhanced accessibility with proper semantic HTML structure
 * - Improved icon integration with proper color inheritance
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance, accessibility improvements, and TypeScript interface enhancement
 */

'use client';

import { TruckIcon } from '@/components/icons';

interface DriverSignupHeroProps {
  /** The main heading text for the hero section */
  title: string;
  /** The descriptive text below the title */
  description: string;
}

export const DriverSignupHero: React.FC<DriverSignupHeroProps> = ({ 
  title, 
  description 
}) => {
  return (
    <section 
      className="flex-col mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-12 mb-6 text-center"
      aria-labelledby="driver-signup-hero-title"
    >
      <div className="mb-8">
        <TruckIcon 
          className="w-20 mb-4 mx-auto text-text-primary" 
          aria-hidden="true"
        />
        <h1 
          id="driver-signup-hero-title"
          className="mb-4 text-text-primary"
        >
          {title}
        </h1>
        <p className="text-text-primary">
          {description}
        </p>
      </div>
    </section>
  );
};
