/**
 * @fileoverview Blog utility functions for data conversion and formatting
 * @source Created for boombox-11.0 database-driven blog system
 * @refactor Utilities to convert between database and component formats
 */

import { 
  BlogPostWithDetails, 
  LegacyBlogPost, 
  PopularArticle, 
  FeaturedArticle 
} from '@/types/content.types';

/**
 * Convert database blog post to legacy format for existing components
 */
export function convertToLegacyBlogPost(post: BlogPostWithDetails): LegacyBlogPost {
  return {
    category: post.category?.name || 'Uncategorized',
    thumbnail: post.featuredImage || '/img/default-blog.png',
    blogTitle: post.title,
    blogDescription: post.excerpt || '',
    author: post.authorName || 'Anonymous',
    readTime: formatReadTime(post.readTime),
    datePublished: formatPublishDate(post.publishedAt),
    link: `/blog/${post.slug}`,
  };
}

/**
 * Convert database blog post to popular article format
 */
export function convertToPopularArticle(post: BlogPostWithDetails): PopularArticle {
  return {
    title: post.title,
    author: post.authorName || 'Anonymous',
    readTime: formatReadTime(post.readTime),
    imageSrc: post.featuredImage || '/img/default-blog.png',
    imageAlt: post.featuredImageAlt || post.title,
    link: `/blog/${post.slug}`,
  };
}

/**
 * Convert database blog post to featured article format
 */
export function convertToFeaturedArticle(post: BlogPostWithDetails): FeaturedArticle {
  return {
    title: post.title,
    author: post.authorName || 'Anonymous',
    date: formatPublishDate(post.publishedAt),
    readTime: formatReadTime(post.readTime),
    description: post.excerpt || '',
    authorImage: post.authorImage || '/img/default-author.png',
    articleImage: post.featuredImage || '/img/default-blog.png',
    link: `/blog/${post.slug}`,
  };
}

/**
 * Format read time as string
 */
export function formatReadTime(readTime: number | null): string {
  if (!readTime) return '5 min read';
  return `${readTime} min read`;
}

/**
 * Format publish date as string
 */
export function formatPublishDate(publishedAt: Date | null): string {
  if (!publishedAt) return 'Recently';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));
}

/**
 * Create URL slug from title
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Extract read time from string (for migration purposes)
 */
export function extractReadTime(readTimeString: string): number {
  const match = readTimeString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 5;
}

/**
 * Batch convert database posts to legacy format
 */
export function convertBlogPostsToLegacy(posts: BlogPostWithDetails[]): LegacyBlogPost[] {
  return posts.map(convertToLegacyBlogPost);
}

/**
 * Batch convert database posts to popular articles format
 */
export function convertBlogPostsToPopular(posts: BlogPostWithDetails[]): PopularArticle[] {
  return posts.map(convertToPopularArticle);
}

/**
 * Get category slug from category name
 */
export function getCategorySlug(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get category name from slug
 */
export function getCategoryName(categorySlug: string): string {
  return categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
