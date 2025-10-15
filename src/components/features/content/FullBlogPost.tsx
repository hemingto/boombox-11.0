/**
 * @fileoverview Full blog post layout component
 * @source boombox-10.0/src/app/components/blog-post/fullblogpost.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Layout component that combines blog content with sidebar
 * - Responsive two-column layout (content + recent posts sidebar)
 * - Maintains consistent spacing and proportions
 * - Updated to use new database-driven components
 * 
 * API ROUTES UPDATED:
 * - No direct API calls (delegates to child components)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses consistent spacing tokens (gap-6, gap-12, gap-20)
 * - Applied responsive breakpoints (sm:, lg:)
 * - Uses page-container for consistent padding
 * 
 * @refactor Updated imports to use new database-driven components
 */

import { BlogContent } from './BlogContent';
import { RecentBlogPosts } from './RecentBlogPosts';

interface FullBlogPostProps {
  /** Blog post slug for content fetching */
  slug: string;
  /** Additional CSS classes for styling */
  className?: string;
}

export function FullBlogPost({ slug, className = '' }: FullBlogPostProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-20 lg:px-16 px-6 ${className}`}>
      {/* Main Content Area */}
      <main className="sm:basis-9/12" role="main">
        <BlogContent slug={slug} />
      </main>
      
      {/* Sidebar */}
      <aside 
        className="w-full sm:basis-3/12 sm:max-w-[300px] sm:ml-auto" 
        role="complementary"
        aria-label="Recent blog posts"
      >
        <RecentBlogPosts limit={3} />
      </aside>
    </div>
  );
}
