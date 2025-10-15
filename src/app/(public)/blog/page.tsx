/**
 * @fileoverview Blog page - articles and resources
 * @source boombox-10.0/src/app/blog/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

'use client';

import type { Metadata } from 'next';
import {
  BlogHeroSection,
  FeaturedArticleSection,
  BlogPopularArticles,
  BlogAllArticles,
} from '@/components/features/content';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

// Note: Page is client component
// SEO metadata should be added via generateMetadata when converting to server component

export default function Blog() {
  return (
    <>
      <BlogHeroSection />
      <FeaturedArticleSection />
      <BlogPopularArticles />
      <div className="min-h-[631px] sm:min-h-[663px] md:min-h-[951px]">
        <BlogAllArticles />
      </div>
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

