/**
 * @fileoverview Site map navigation links component displaying categorized page links
 * @source boombox-10.0/src/app/components/sitemap/sitemaplinks.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays all public-facing site pages organized by categories (General, Blog Posts, Locations).
 * Uses clickable link badges with hover states for easy navigation to any page on the site.
 * Data extracted to @/data/sitemapLinks for better maintainability.
 * 
 * API ROUTES UPDATED:
 * - None (presentational component only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - bg-slate-100 → bg-surface-tertiary (semantic surface color)
 * - hover:bg-slate-200 → hover:bg-surface-secondary (semantic hover state)
 * - sm:active:bg-slate-300 → active:bg-surface-primary (semantic active state)
 * - Uses consistent responsive padding (lg:px-16 px-6)
 * - Maintains semantic spacing (mb-24 sm:mb-48)
 * 
 * @refactor Extracted data to centralized data folder, renamed to PascalCase, applied design system colors
 */

import React from 'react';
import Link from 'next/link';
import { sitemapData } from '@/data/sitemapLinks';
import type { SitemapSection } from '@/data/sitemapLinks';

/**
 * SiteMapLinks component
 * 
 * Displays a categorized list of all site pages as clickable link badges.
 * Each section contains a category heading and a grid of link badges.
 * 
 * @example
 * ```tsx
 * <SiteMapLinks />
 * ```
 */
export function SiteMapLinks(): React.ReactElement {
  return (
    <div className="lg:px-16 px-6 py-8 space-y-10 sm:mb-48 mb-24 max-w-7xl">
      {sitemapData.map((section: SitemapSection, index: number) => (
        <section key={index} aria-labelledby={`sitemap-category-${index}`}>
          <h2 id={`sitemap-category-${index}`} className="mb-4">
            {section.category}
          </h2>
          <nav aria-label={`${section.category} navigation`}>
            <div className="flex flex-wrap gap-4">
              {section.links.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="bg-surface-tertiary text-sm py-2 px-4 rounded-full cursor-pointer hover:bg-surface-secondary active:bg-surface-primary transition-colors duration-150"
                  aria-label={`Navigate to ${link.name}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        </section>
      ))}
    </div>
  );
}

