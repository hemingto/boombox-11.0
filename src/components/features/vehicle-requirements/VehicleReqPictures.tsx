/**
 * @fileoverview Vehicle Example Photos Component
 * @source boombox-10.0/src/app/components/vehicle-requirements/vehiclereqpictures.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays example photos of approved and not-approved vehicles with visual indicators.
 * Shows side-by-side comparison with checkmarks for approved and X marks for not approved.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Updated border colors: border-slate-100 → border-border
 * - Updated success color: text-emerald-500 → text-status-success
 * - Updated error color: text-red-500 → text-status-error
 * - Uses Next.js Image for proper image optimization and loading states
 * - Uses semantic spacing classes
 * - Replaced placeholder images with /placeholder.jpg
 * 
 * @refactor Renamed to PascalCase, applied design system colors, uses Next.js Image,
 *           improved accessibility with ARIA labels and semantic HTML, added image optimization
 */

import React from 'react';
import Image from 'next/image';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

/**
 * Interface for vehicle image data
 */
interface VehicleImage {
  src: string;
  isApproved: boolean;
}

/**
 * Example approved vehicle photos
 */
const approvedVehicles: VehicleImage[] = [
  { src: '/placeholder.jpg', isApproved: true },
  { src: '/placeholder.jpg', isApproved: true },
  { src: '/placeholder.jpg', isApproved: true },
];

/**
 * Example not-approved vehicle photos
 */
const notApprovedVehicles: VehicleImage[] = [
  { src: '/placeholder.jpg', isApproved: false },
  { src: '/placeholder.jpg', isApproved: false },
  { src: '/placeholder.jpg', isApproved: false },
];

/**
 * VehicleReqPictures Component
 * Displays example photos of approved and not-approved vehicles with status indicators
 * 
 * @design-system Uses semantic colors for success/error states
 * @colors border-border, text-status-success, text-status-error, bg-surface-tertiary
 */
export function VehicleReqPictures() {
  return (
    <div className="space-y-8 lg:px-16 px-6 sm:mb-48 mb-24">
      {/* Approved Vehicles Section */}
      <section
        className="p-6 border border-border rounded-md"
        aria-labelledby="approved-vehicles-heading"
      >
        <h2 id="approved-vehicles-heading" className="mb-4">
          Example Photos of Approved Vehicles
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 max-w-6xl">
          {approvedVehicles.map((vehicle, index) => (
            <div key={index} className="relative w-full aspect-square rounded-md overflow-hidden">
              <Image
                src={vehicle.src}
                alt={`Example of an approved vehicle showing proper angle and condition - photo ${index + 1}`}
                fill
                className="object-cover rounded-md"
                loading="lazy"
                quality={85}
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              />
              <CheckCircleIcon
                className="absolute bg-white rounded-full top-2 right-2 w-6 h-6 sm:w-10 sm:h-10 text-status-success"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Not Approved Vehicles Section */}
      <section
        className="p-6 border border-border rounded-md"
        aria-labelledby="not-approved-vehicles-heading"
      >
        <h2 id="not-approved-vehicles-heading" className="mb-4">
          Example Photos of Not Approved Vehicles
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 max-w-6xl">
          {notApprovedVehicles.map((vehicle, index) => (
            <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden">
              <Image
                src={vehicle.src}
                alt={`Example of a not-approved vehicle showing issues with photo or condition - photo ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                loading="lazy"
                quality={85}
                sizes="(max-width: 640px) 100vw, 33vw"
              />
              <XCircleIcon
                className="absolute top-2 bg-white rounded-full right-2 w-6 h-6 sm:w-10 sm:h-10 text-status-error"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

