/**
 * @fileoverview Dynamic blog post page - individual article display
 * @source boombox-10.0/src/app/blog-post/page.tsx
 * @refactor Migrated to server component with dynamic metadata and static generation
 * 
 * ROUTE STRUCTURE:
 * - URL: /blog/[slug]
 * - Example: /blog/how-to-store-paintings-the-right-way
 * - Server-side data fetching with static generation at build time
 * 
 * FEATURES:
 * - Server component with generateMetadata for SEO
 * - Static generation with generateStaticParams
 * - Error handling for non-existent posts (404)
 * - Full blog post rendering with hero and content
 * 
 * ARCHITECTURE:
 * - Fetches data on server using BlogService
 * - Passes data as props to child components
 * - Loading/error states handled by Suspense and error boundaries
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { BlogService } from '@/lib/services/blogService';
import { BlogPostHero, FullBlogPost } from '@/components/features/content';
import { FaqSection, HelpCenterSection } from '@/components/features/landing';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate metadata for SEO
 * Includes title, description, OpenGraph, and Twitter cards
 */
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await BlogService.getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read ${post.title} on the BoomBox Storage blog`;
  const imageUrl = post.featuredImage || '/img/palo-alto.png';
  const url = `/blog/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName || 'BoomBox Team'],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.featuredImageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate static params for all published blog posts
 * Enables static generation at build time
 */
export async function generateStaticParams() {
  const slugs = await BlogService.getAllPublishedSlugs();
  return slugs.map((post) => ({
    slug: post.slug,
  }));
}

/**
 * Blog post page component
 * Server component that fetches and renders individual blog post
 */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await BlogService.getBlogPostBySlug(params.slug);

  // Return 404 if post not found
  if (!post) {
    notFound();
  }

  return (
    <>
      <BlogPostHero post={post} />
      <FullBlogPost post={post} />
      <FaqSection />
      <HelpCenterSection />
    </>
  );
}

