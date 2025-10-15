/**
 * @fileoverview Blog hero section component with icon and title
 * @source boombox-10.0/src/app/components/blog/blogherosection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays blog section header with newspaper icon and title
 * - Simple presentational component with consistent spacing
 * - Uses Heroicons for newspaper icon
 * 
 * API ROUTES UPDATED:
 * - No API routes used (static content only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied consistent container padding patterns (lg:px-16 px-6)
 * - Used semantic spacing classes for margins and padding
 * - Maintained existing typography hierarchy
 * 
 * @refactor Migrated to content domain with design system compliance
 */

'use client';

import { NewspaperIcon } from '@heroicons/react/24/outline';

/**
 * Blog hero section component
 * 
 * Simple header component that displays the blog section title with an icon.
 * Uses consistent spacing patterns from the design system.
 */
export const BlogHeroSection: React.FC = () => {
  return (
    <div className="w-full mt-4 py-2 mb-14 lg:px-16 px-6">
      <div className="flex items-center">
        <NewspaperIcon className="mr-1 w-6 h-6" aria-hidden="true" />
        <h1 className="text-2xl">Blog</h1>
      </div>
    </div>
  );
};

export default BlogHeroSection;
