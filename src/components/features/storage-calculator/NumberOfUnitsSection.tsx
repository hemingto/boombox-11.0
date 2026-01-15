/**
 * @fileoverview Number of units section showing Boombox requirements by home size
 * @source boombox-10.0/src/app/components/storagecalculator/numberofunitssection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays a table showing how many Boombox storage units are typically needed
 * for different home sizes (from extra items to full homes). Includes visual
 * icons representing 1, 2, or 3+ units.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors (text-zinc-950, text-zinc-900) with semantic tokens
 * - Updated border colors from border-slate-100 to border-border
 * - Applied consistent heading styles with text-text-primary
 * - Enhanced accessibility with proper table structure and ARIA labels
 * 
 * @refactor 
 * - Renamed from numberofunitssection.tsx to NumberOfUnitsSection.tsx (PascalCase)
 * - Updated to use semantic color tokens from design system
 * - Improved TypeScript interfaces for better type safety
 * - Enhanced accessibility with semantic HTML and ARIA attributes
 * - Added proper table caption for screen readers
 */

import { StorageUnitIcon } from '@/components/icons/StorageUnitIcon';
import TwoUnitIcon from '@/components/icons/TwoUnitIcon';
import ThreeUnitIcon from '@/components/icons/ThreeUnitIcon';

interface StorageSize {
  size: string;
  containers: string;
  icon: React.FC<{ className?: string }>;
  iconWidth: string;
}

const storageData: StorageSize[] = [
  { 
    size: 'Extra Items', 
    containers: '1 unit', 
    icon: StorageUnitIcon, 
    iconWidth: 'w-12' 
  },
  { 
    size: 'Studio', 
    containers: '1-2 units', 
    icon: TwoUnitIcon, 
    iconWidth: 'w-16' 
  },
  { 
    size: '1 bedroom apartment', 
    containers: '2 units', 
    icon: TwoUnitIcon, 
    iconWidth: 'w-16' 
  },
  { 
    size: '2 bedroom apartment', 
    containers: '3 units', 
    icon: ThreeUnitIcon, 
    iconWidth: 'w-20' 
  },
  { 
    size: 'Full home', 
    containers: '3+ units', 
    icon: ThreeUnitIcon, 
    iconWidth: 'w-20' 
  },
];

/**
 * Main number of units section component
 */
export function NumberOfUnitsSection() {
  return (
    <section 
      className="lg:px-16 px-6 sm:mb-48 mb-24"
      aria-labelledby="units-by-size-heading"
    >
      <h1 
        id="units-by-size-heading"
        className="text-center mb-12 text-text-primary"
      >
        Generally speaking
      </h1>
      
      <table className="w-full">
        <caption className="sr-only">
          Number of Boombox storage units needed by home size
        </caption>
        
        <thead className="border-b border-border">
          <tr className="text-right">
            <th 
              scope="col" 
              className="py-2 text-left text-text-primary sr-only"
            >
              Home Size
            </th>
            <th 
              scope="col" 
              className="py-4 text-text-primary"
            >
              <h2 className="sm:text-2xl font-medium">
                # of Boomboxes
              </h2>
            </th>
          </tr>
        </thead>
        
        <tbody className="border-b border-border">
          {storageData.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <tr key={index} className="text-text-secondary">
                <td className="py-6">
                  <h2 className="text-xl sm:text-2xl font-medium text-text-primary">
                    {item.size}
                  </h2>
                </td>
                <td className="py-6">
                  <div 
                    className="flex items-center space-x-4 justify-end"
                    role="group"
                    aria-label={`${item.containers} for ${item.size}`}
                  >
                    <span>
                      <h2 className="text-lg sm:text-xl font-medium text-text-primary">
                        {item.containers}
                      </h2>
                    </span>
                    <IconComponent 
                      className={`${item.iconWidth} text-text-primary`}
                      aria-hidden="true"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default NumberOfUnitsSection;

