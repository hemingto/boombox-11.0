/**
 * @fileoverview Vehicle Requirements List Component
 * @source boombox-10.0/src/app/components/vehicle-requirements/vehiclereqlist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a list of vehicle requirements for Boombox drivers, including:
 * - Introduction to standards
 * - Minimum vehicle requirements
 * - Vehicle photo requirements
 * 
 * DESIGN SYSTEM UPDATES:
 * - Updated border colors: border-slate-100 → border-border
 * - Updated icon colors: text-zinc-950 → text-text-primary
 * - Uses semantic spacing and padding classes
 * - Follows card styling patterns
 * 
 * @refactor Renamed to PascalCase, applied design system colors, improved accessibility with semantic HTML
 */

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

/**
 * Interface for individual requirement items
 */
interface Requirement {
  title: string;
  description: string[];
}

/**
 * Vehicle requirements data
 * Defines minimum standards for vehicles and photos on the Boombox platform
 */
const requirements: Requirement[] = [
  {
    title: 'Introduction',
    description: [
      "We have certain standards and minimum requirements for vehicles that our drivers use on Boombox's platform to ensure a great experience for our customers and partners.",
    ],
  },
  {
    title: 'Minimum Vehicle Requirements',
    description: [
      'Vehicles must have a towing capacity of 4,000 lbs and be equipped with towing capabilities.',
      'Vehicles must be manufactured in 1995 or later and must be in good condition (free of rust and damages).',
      'We do not accept rental vehicles or rental insurance coverage.',
      'Vehicles cannot have other customizations that may compromise the safe delivery of items and must be free of graffiti.',
    ],
  },
  {
    title: 'Minimum Vehicle Photo Requirements',
    description: [
      'Vehicle photos must clearly show the front of the vehicle to the back of the vehicle and taken in daylight. We recommend taking a sideview angle.',
      'Vehicle photos must show the vehicle in good condition and minimal rust or damage.',
    ],
  },
];

/**
 * VehicleReqList Component
 * Renders a structured list of vehicle requirements with icons
 * 
 * @design-system Uses semantic colors and spacing
 * @colors border-border, text-text-primary
 */
export function VehicleReqList() {
  return (
    <section className="lg:px-16 px-6" aria-label="Vehicle Requirements List">
      {requirements.map((requirement, index) => (
        <article
          key={index}
          className="mb-8 p-6 border border-border rounded-md"
        >
          <h2 className="mb-5">{requirement.title}</h2>
          <ul className="space-y-2">
            {requirement.description.map((desc, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <ChevronRightIcon
                  className="w-5 h-5 text-text-primary flex-shrink-0"
                  aria-hidden="true"
                />
                <p>{desc}</p>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

