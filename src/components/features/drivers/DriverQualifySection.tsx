/**
 * @fileoverview Driver Qualify Section - Requirements checklist for driver qualification
 * @source boombox-10.0/src/app/components/driver-signup/driverqualifysection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a checklist of requirements that drivers must meet to qualify:
 * - At least 18 years of age
 * - Valid U.S. driver's license and auto insurance
 * - Own a qualifying vehicle (with link to requirements)
 * - Own an iPhone or Android phone with GPS
 * - Able to pass a background check
 * 
 * API ROUTES UPDATED:
 * - No API routes used in this component
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded slate colors with design system surface colors
 * - Applied semantic text colors (text-primary)
 * - Updated border styling to use design system border colors
 * - Enhanced accessibility with proper ARIA labels and semantic HTML structure
 * - Improved keyboard navigation support
 * 
 * @refactor Migrated from boombox-10.0 with design system compliance and accessibility improvements
 */

import Link from "next/link";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface Requirement {
  key: number;
  title: React.ReactNode;
}

const requirements: Requirement[] = [
  {
    key: 1,
    title: (
      <div className="text-lg font-semibold text-text-primary">At least 18 years of age</div>
    ),
  },
  {
    key: 2,
    title: (
      <div className="text-lg font-semibold text-text-primary">Valid U.S. driver&apos;s license and auto insurance</div>
    ),
  },
  {
    key: 3,
    title: (
      <div className="text-lg font-semibold text-text-primary">
        Own a{" "}
        <Link 
          href="/vehicle-requirements" 
          className="underline decoration-dotted underline-offset-4 text-text-primary hover:text-primary focus:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="View qualifying vehicle requirements (opens in new tab)"
        >
          qualifying vehicle
        </Link>
      </div>
    ),
  },
  {
    key: 4,
    title: (
      <div className="text-lg font-semibold text-text-primary">Own an iPhone or Android phone with GPS</div>
    ),
  },
  {
    key: 5,
    title: (
      <div className="text-lg font-semibold text-text-primary">Able to pass a background check</div>
    ),
  },
];

export const DriverQualifySection: React.FC = () => {
  return (
    <section className="mt-14 lg:px-16 px-6 sm:mb-48 mb-24" aria-labelledby="qualification-heading">
      <h1 id="qualification-heading" className="mb-10 text-text-primary">
        Make sure you qualify
      </h1>
      
      <div 
        className="border border-border rounded-md p-6 bg-surface-primary"
        role="list"
        aria-label="Driver qualification requirements"
      >
        {requirements.map((requirement) => (
          <div 
            key={requirement.key} 
            className="flex p-3 items-center mb-5"
            role="listitem"
          >
            <CheckCircleIcon 
              className="shrink-0 w-8 h-8 mr-4 text-text-primary" 
              aria-hidden="true"
            />
            <div>
              <h2>{requirement.title}</h2>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DriverQualifySection;
