/**
 * @fileoverview Blog page - articles and resources (server component)
 * @source boombox-10.0/src/app/blog/page.tsx
 * @refactor Migrated to server component with database-driven BlogService
 */

import type { Metadata } from 'next';
import {
  BlogHeroSection,
  FeaturedArticleSection,
  BlogPopularArticles,
  BlogAllArticles,
} from '@/components/features/content';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';
import { BlogService } from '@/lib/services/blogService';

export const metadata: Metadata = {
  title: 'Blog | Boombox',
  description:
    'Tips, guides, and insights on vehicle shipping, auto transport, storage, and moving.',
};

export const revalidate = 60;

export default async function Blog() {
  const [featuredPosts, popularPosts, allPostsResult, categories] =
    await Promise.all([
      BlogService.getFeaturedBlogPosts(1),
      BlogService.getPopularBlogPosts(6),
      BlogService.getBlogPosts({ limit: 100 }),
      BlogService.getBlogCategories(),
    ]);

  const featured = featuredPosts[0] ?? null;

  const featuredArticle = featured
    ? {
        title: featured.title,
        author: featured.authorName ?? 'Calvin',
        date: featured.publishedAt
          ? new Date(featured.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '',
        readTime: featured.readTime ? `${featured.readTime} min read` : '',
        description: featured.excerpt ?? '',
        authorImage:
          featured.authorImage ??
          'https://res.cloudinary.com/daezxeevr/image/upload/v1773181381/author-calvin_dk982x.png',
        articleImage: featured.featuredImage ?? '/placeholder.jpg',
        link: `/blog/${featured.slug}`,
      }
    : null;

  const popularArticles = popularPosts.map(p => ({
    title: p.title,
    author: p.authorName ?? 'Calvin',
    readTime: p.readTime ? `${p.readTime} min read` : '',
    imageSrc: p.featuredImage ?? '/placeholder.jpg',
    imageAlt: p.featuredImageAlt ?? p.title,
    link: `/blog/${p.slug}`,
  }));

  const blogPosts = allPostsResult.posts.map(p => ({
    category: p.category?.name ?? 'Uncategorized',
    thumbnail: p.featuredImage ?? '/placeholder.jpg',
    blogTitle: p.title,
    blogDescription: p.excerpt ?? '',
    author: p.authorName ?? 'Calvin',
    readTime: p.readTime ? `${p.readTime} min read` : '',
    datePublished: p.publishedAt
      ? new Date(p.publishedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '',
    link: `/blog/${p.slug}`,
  }));

  const categoryNames = categories.map(c => c.name);

  return (
    <>
      <BlogHeroSection />
      <FeaturedArticleSection article={featuredArticle} />
      <BlogPopularArticles articles={popularArticles} />
      <div className="min-h-[631px] sm:min-h-[663px] md:min-h-[951px]">
        <BlogAllArticles posts={blogPosts} categories={categoryNames} />
      </div>
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}
