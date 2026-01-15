/**
 * @fileoverview Full blog post layout component
 * @source boombox-10.0/src/app/components/blog-post/fullblogpost.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Layout component that combines blog content with sidebar
 * - Responsive two-column layout (content + recent posts sidebar)
 * - Maintains consistent spacing and proportions
 * - Server component that receives blog post data as props
 * 
 * API ROUTES UPDATED:
 * - No direct API calls (receives data from parent page component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses consistent spacing tokens (gap-6, gap-12, gap-20)
 * - Applied responsive breakpoints (sm:, lg:)
 * - Uses page-container for consistent padding
 * 
 * @refactor Converted to server component with prop-based data flow
 */

import { BlogContent } from './BlogContent';
import { RecentBlogPosts } from './RecentBlogPosts';
import { BlogPostWithCategory } from '@/lib/services/blogService';
import { BlogContentBlockType } from '@prisma/client';

interface FullBlogPostProps {
  /** Blog post data with category and content blocks */
  post: BlogPostWithCategory;
  /** Additional CSS classes for styling */
  className?: string;
}

export function FullBlogPost({ post, className = '' }: FullBlogPostProps) {
  // Convert content blocks to the correct type
  const contentBlocks = (post.contentBlocks || []).map((block) => ({
    id: block.id,
    type: block.type as BlogContentBlockType,
    content: block.content,
    metadata: block.metadata,
    order: block.order,
  }));

  return (
    <div className={`flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-20 lg:px-16 px-6 ${className}`}>
      {/* Main Content Area */}
      <main className="sm:basis-9/12" role="main">
        <BlogContent contentBlocks={contentBlocks} />
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
