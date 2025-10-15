/**
 * @fileoverview Blog post page - individual article display
 * @source boombox-10.0/src/app/blog-post/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata} from 'next';
import { BlogPostHero, FullBlogPost } from '@/components/features/content';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component
// TODO: This should be converted to [slug] dynamic route

export default function BlogPost() {
  // Temporary: Will be replaced with dynamic slug routing
  const slug = 'sample-post';
  
  return (
    <>
      <BlogPostHero />
      <FullBlogPost slug={slug} />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

