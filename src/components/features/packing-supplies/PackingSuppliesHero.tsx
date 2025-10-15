/**
 * @fileoverview Hero section for packing supplies page
 * @source boombox-10.0/src/app/components/packing-supplies/packingsupplieshero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the hero section at the top of the packing supplies page with icon,
 * heading, and description text. Simple presentational component with no state.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied consistent spacing patterns (mt-12 sm:mt-24, lg:px-16 px-6)
 * - Used semantic utility classes for section spacing
 * - Maintained responsive design with mobile-first approach
 * 
 * @refactor Applied design system patterns, no business logic changes
 */

'use client';

import { PackingSuppliesIcon } from '@/components/icons/PackingSuppliesIcon';

export const PackingSuppliesHero: React.FC = () => {
  return (
    <div className="flex-col mt-12 sm:mt-24 lg:px-16 px-6 sm:mb-24 mb-12">
      <div className="flex flex-col items-start gap-4 mb-4">
        <PackingSuppliesIcon className="mt-1 w-12 h-12" />
        <div>
          <h1 className="text-left">Packing supplies</h1>
          <p className="text-left mt-4">get packing supplies delivered to your door</p>
        </div>
      </div>
    </div>
  );
};

