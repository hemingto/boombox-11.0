/**
 * @fileoverview List of insurance coverage protections
 * @source boombox-10.0/src/app/components/insurance-coverage/insuranceprotections.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a comprehensive list of damaging events covered by insurance.
 * Covers 13 types of hazards: fire, hurricane, tornado, wind, smoke, earthquake,
 * hail, vandalism, burglary, vermin, flood, water leak, and lightning.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens
 *   - border-slate-100 → border-border
 * - Applied semantic text colors for hierarchy
 * - Used card component pattern for consistent styling
 * - Added ARIA attributes for better accessibility
 * - Improved list semantics with proper ul/li structure
 * 
 * @refactor Migrated to features/insurance domain with design system compliance
 */

import { ChevronRightIcon } from '@heroicons/react/24/solid';

interface ProtectionItem {
  name: string;
}

const protections: ProtectionItem[] = [
  { name: 'Fire' },
  { name: 'Hurricane' },
  { name: 'Tornado' },
  { name: 'Wind' },
  { name: 'Smoke' },
  { name: 'Earthquake' },
  { name: 'Hail' },
  { name: 'Vandalism' },
  { name: 'Burglary' },
  { name: 'Vermin' },
  { name: 'Flood' },
  { name: 'Water Leak' },
  { name: 'Lightning' },
];

export function InsuranceProtections() {
  return (
    <section className="lg:px-16 px-6 rounded-md mb-8">
      <div className="card">   
        <h2 className="mb-4">What we protect against</h2>
        <p className="mb-6 text-text-secondary">
          We protect against the following list of damaging events
        </p>
        <ul className="space-y-2" role="list">
          {protections.map((protection, index) => (
            <li key={index} className="flex items-center text-lg text-text-primary">
              <ChevronRightIcon className="w-5 h-5 mr-2 text-primary" aria-hidden="true" />
              {protection.name}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-text-secondary">
          Our base coverage covers up to $1000 worth of damages
        </p>
      </div>
    </section>
  );
}

export default InsuranceProtections;

