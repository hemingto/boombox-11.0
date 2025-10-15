/**
 * @fileoverview Terms of Service hero section component
 * @source boombox-10.0/src/app/components/terms/termshero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the hero section for the Terms of Service page with:
 * - Page title "Terms of service" as h1 heading
 * - Responsive padding and margins matching site standards
 * - Simple, clean layout with semantic HTML
 * 
 * API ROUTES UPDATED:
 * - None (this is a presentational component with no API calls)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Maintained existing responsive padding pattern (lg:px-16 px-6)
 * - Maintained existing margin pattern (my-10 sm:my-20)
 * - Uses semantic HTML with h1 heading
 * - No color changes needed (inherits text color from parent)
 * 
 * @refactor
 * - Renamed file from termshero.tsx to TermsHero.tsx (PascalCase)
 * - Changed from const with React.FC to function declaration
 * - Preserved all functionality and responsive behavior
 * - Added comprehensive documentation header
 */

'use client';

export function TermsHero() {
  return (
    <div className="w-full my-10 sm:my-20 lg:px-16 px-6">
      <div>
        <h1 className="mb-4">Terms of service</h1>
      </div>
    </div>
  );
}

