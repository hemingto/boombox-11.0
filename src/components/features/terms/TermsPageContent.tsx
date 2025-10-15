/**
 * @fileoverview Terms of Service page layout component
 * @source boombox-10.0/src/app/components/terms/termspage.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Combines TermsText and TermsContactInfo components into a responsive layout:
 * - Two-column layout on desktop (2/3 for text, 1/3 for contact info)
 * - Single column stacked layout on mobile
 * - Responsive gap spacing between sections
 * - Consistent horizontal padding matching site standards
 * 
 * API ROUTES UPDATED:
 * - None (this is a layout component with no API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Maintained responsive padding pattern (lg:px-16 px-6)
 * - Maintained responsive gap spacing (gap-8 sm:gap-12 lg:gap-20 xl:gap-24)
 * - Maintained responsive flex layout (flex-col sm:flex-row)
 * - Uses semantic layout structure with proper basis ratios
 * - No color changes needed (inherits from child components)
 * 
 * @refactor
 * - Renamed file from termspage.tsx to TermsPageContent.tsx (PascalCase, more descriptive)
 * - Changed from const with React.FC to function declaration
 * - Updated imports to use new component names
 * - Preserved all responsive layout patterns
 * - Added comprehensive documentation header
 */

'use client';

import { TermsContactInfo } from './TermsContactInfo';
import { TermsText } from './TermsText';

export function TermsPageContent() {
  return (
    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-20 xl:gap-24 lg:px-16 px-6">
      <div className="sm:basis-2/3">
        <TermsText />
      </div>
      <div className="w-full sm:basis-1/3 sm:ml-auto">
        <TermsContactInfo />
      </div>
    </div>
  );
}

