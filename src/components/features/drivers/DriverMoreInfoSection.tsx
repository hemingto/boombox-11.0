/**
 * @fileoverview Driver More Info Section - Information about what drivers will be delivering
 * @source boombox-10.0/src/app/components/driver-signup/drivermoreinfosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays information about the two types of deliveries drivers will handle:
 * 1. Boombox Storage Containers - requires towing capacity of 4000lbs and trailer hitch
 * 2. Packing Supplies - no special vehicle requirements needed
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded zinc colors with design system primary colors
 * - Updated button styling to use btn-primary utility class
 * - Applied semantic color tokens throughout
 * - Enhanced accessibility with proper ARIA labels and semantic HTML
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance and accessibility improvements
 */

'use client';

import Link from 'next/link';

export const DriverMoreInfoSection: React.FC = () => {
  return (
    <section className="mt-14 lg:px-16 px-6 sm:mb-48 mb-24" aria-labelledby="delivery-info-heading">
      <h1 id="delivery-info-heading" className="mb-10 sm:mb-20 text-text-primary">
        What you&apos;ll be delivering
      </h1>
      
      {/* Storage Containers Section */}
      <div className="flex flex-col lg:flex-row mb-20">
        <div className="flex place-content-start lg:items-center shrink-0 basis-1/2 mb-10 lg:mb-0">
          <div 
            className="bg-surface-tertiary aspect-video w-full rounded-md"
            role="img"
            aria-label="Placeholder image for Boombox storage containers"
          />
        </div>

        <div className="flex flex-col justify-center sm:items-end basis-1/2 sm:text-right lg:ml-8">
          <h2 className="mb-4 text-text-primary">Boombox Storage Containers</h2>
          <p className="mb-10 w-4/6 text-text-primary">
            As a container delivery driver you&apos;ll be responsible for towing Boombox storage containers to customer&apos;s addresses. Your vehicle must have a towing capacity of 4000lbs and trailer hitch
          </p>
          <Link 
            href="/vehicle-requirements" 
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Check qualifying vehicles for container delivery (opens in new tab)"
          >
            <button className="btn-primary">
              Check Qualifying Vehicles
            </button>
          </Link>
        </div>
      </div>

      {/* Packing Supplies Section */}
      <div className="flex flex-col lg:flex-row">
        <div className="place-content-center basis-1/2 md:mr-8">
          <h2 className="mb-4 text-text-primary">Packing Supplies</h2>
          <p className="mb-10 w-4/6 text-text-primary">
            As a packing supply delivery driver you&apos;ll be responsible for delivering packing supplies to customer&apos;s addresses. Packing supplies include cardboard boxes, moving blankets, tape, etc. Your vehicle does not need towing capabilities
          </p>
          <Link 
            href="/vehicle-requirements" 
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Check qualifying vehicles for packing supply delivery (opens in new tab)"
          >
            <button className="btn-primary">
              Check Qualifying Vehicles
            </button>
          </Link>
        </div>
        <div className="flex place-content-end lg:items-center basis-1/2 shrink-0 order-first lg:order-last mb-10 lg:mb-0">
          <div 
            className="bg-surface-tertiary aspect-video w-full h-auto rounded-md"
            role="img"
            aria-label="Placeholder image for packing supplies"
          />
        </div>
      </div>
    </section>
  );
};
