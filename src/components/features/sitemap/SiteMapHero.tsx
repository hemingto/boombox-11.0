/**
 * @fileoverview Site map page hero section component
 * @source boombox-10.0/src/app/components/sitemap/sitemaphero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays the hero section for the sitemap page with a simple heading.
 * Uses semantic HTML and responsive padding following design system standards.
 * 
 * API ROUTES UPDATED:
 * - None (presentational component only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses existing responsive padding patterns (lg:px-16 px-6)
 * - Maintains semantic spacing with my-10 sm:my-20
 * - Semantic h1 element for proper heading hierarchy
 * 
 * @refactor Renamed file to PascalCase, added comprehensive documentation
 */

'use client';

import React from 'react';

/**
 * SiteMapHero component
 * 
 * Simple hero section for the sitemap page displaying the page title.
 * Uses responsive padding and spacing following the design system.
 * 
 * @example
 * ```tsx
 * <SiteMapHero />
 * ```
 */
export function SiteMapHero(): React.ReactElement {
  return (
    <div className="w-full my-10 sm:my-20 lg:px-16 px-6">
      <div>
        <h1 className="mb-4">Site map</h1>
      </div>
    </div>
  );
}

