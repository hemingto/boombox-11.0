/**
 * @fileoverview Careers hero section component with design system integration
 * @source boombox-10.0/src/app/components/careers/careersherosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Hero section for careers page with title, description, CTA button, and hero image
 * Includes external link to Indeed job listings
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (bg-primary, hover:bg-primary-hover)
 * - Used btn-primary utility class for consistent button styling
 * - Uses Next.js Image for better performance
 * - Applied consistent spacing patterns from design system
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * 
 * @refactor Updated to use design system colors and Next.js Image for better performance
 */

import Image from 'next/image';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export interface CareersHeroSectionProps {
  /**
   * Hero image source URL
   */
  heroImageSrc?: string;
  
  /**
   * Alt text for hero image
   */
  heroImageAlt?: string;
  
  /**
   * External URL for job listings
   */
  jobListingsUrl?: string;
  
  /**
   * Additional CSS classes for customization
   */
  className?: string;
}

export function CareersHeroSection({ 
  heroImageSrc = '/palo-alto.png',
  heroImageAlt = 'Boombox team members collaborating in Palo Alto office',
  jobListingsUrl = 'https://www.indeed.com/cmp/Boombox-Storage',
  className 
}: CareersHeroSectionProps) {
  return (
    <section className="sm:mb-48 mb-24" aria-labelledby="careers-heading">
      {/* Header with icon and title */}
      <header className="w-full mt-10 mb-10 lg:px-16 px-6">
        <div className="flex items-center">
          <BriefcaseIcon 
            className="w-12 h-12 mr-2 text-text-primary" 
            aria-hidden="true"
          />
          <h1 id="careers-heading" className="text-text-primary">
            Careers
          </h1>
        </div>
      </header>
        
      {/* Hero content section */}
      <div className="md:flex lg:mx-16 mx-6 sm:mb-24 mb-12">
        {/* Text content */}
        <div className="place-content-center items-center basis-5/12 mr-4">
          <h2 className="mb-4 text-text-primary">Join the Boombox team!</h2>
          <p className="max-w-lg mb-8 text-text-primary">
            We are always looking for talented people to help with our mission of making 
            storage as simple and convenient as possible. Think you can help? Check out our job listings.
          </p>
          
          {/* CTA Button */}
          <Link 
            href={jobListingsUrl}
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="View job openings on Indeed (opens in new tab)"
          >
            <button
              className="btn-primary block rounded-md py-2.5 px-6 font-semibold text-md basis-1/2 font-inter"
              type="button"
            >
              View Openings
            </button>
          </Link>
        </div>

        {/* Hero image */}
        <div className="flex place-content-end basis-7/12">
          <div className="relative w-full md:ml-6 mt-8 md:mt-0 aspect-video rounded-md overflow-hidden">
            <Image
              src={heroImageSrc}
              alt={heroImageAlt}
              fill
              className="object-cover rounded-md"
              priority
              quality={90}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default CareersHeroSection;
