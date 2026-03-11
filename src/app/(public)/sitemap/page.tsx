/**
 * @fileoverview Sitemap page - site navigation map
 * @source boombox-10.0/src/app/sitemap/page.tsx
 * @refactor Server component with dynamic blog post links from database
 */

import type { Metadata } from 'next';
import { SiteMapHero, SiteMapLinks } from '@/components/features/sitemap';
import { HelpCenterSection } from '@/components/features/landing';
import { BlogService } from '@/lib/services/blogService';

export const metadata: Metadata = {
  title: 'Site Map | Boombox',
  description: 'Navigate all pages on the Boombox Storage website.',
};

export default async function SiteMap() {
  let blogLinks: { name: string; href: string }[] = [];
  try {
    const slugs = await BlogService.getAllPublishedSlugs();
    blogLinks = slugs.map(post => ({
      name: post.title,
      href: `/blog/${post.slug}`,
    }));
  } catch {
    // DB may be unavailable; fall back to empty
  }

  return (
    <>
      <SiteMapHero />
      <SiteMapLinks blogLinks={blogLinks} />
      <HelpCenterSection />
    </>
  );
}
