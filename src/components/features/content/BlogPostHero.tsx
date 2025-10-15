/**
 * @fileoverview Blog post hero section with database integration
 * @source boombox-10.0/src/app/components/blog-post/blogposthero.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays featured blog post hero section with navigation
 * - Fetches featured article data from database via API
 * - Shows article title, author info, date, and featured image
 * - Includes back navigation to blog listing
 * 
 * API ROUTES UPDATED:
 * - Uses: /api/blog/featured (new database-driven endpoint)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (text-text-primary, text-text-secondary)
 * - Applied consistent spacing and typography
 * - Uses OptimizedImage primitive component
 * - Maintains responsive design patterns
 * 
 * @refactor Migrated from static data to database-driven approach with API integration
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage';
import { Skeleton } from '@/components/ui/primitives/Skeleton';
import { FeaturedArticle } from '@/types/content.types';

interface BlogPostHeroProps {
  /** Blog post slug to fetch data for */
  slug?: string;
  /** Additional CSS classes for styling */
  className?: string;
  /** Whether to show back navigation */
  showBackNavigation?: boolean;
}

export function BlogPostHero({ 
  slug, 
  className = '',
  showBackNavigation = true 
}: BlogPostHeroProps) {
  const [article, setArticle] = useState<FeaturedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedArticle() {
      try {
        setLoading(true);
        setError(null);

        // If slug is provided, fetch specific post, otherwise get featured post
        const endpoint = slug 
          ? `/api/blog/posts/${encodeURIComponent(slug)}`
          : '/api/blog/featured';
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Article not found');
          }
          throw new Error(`Failed to fetch article: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response formats
        if (slug) {
          // Individual post response - convert to FeaturedArticle format
          const post = data;
          setArticle({
            title: post.title || post.blogTitle,
            author: post.authorName || post.author,
            date: post.publishedAt || post.datePublished,
            readTime: post.readTime ? `${post.readTime} min read` : '5 min read',
            description: post.excerpt || post.blogDescription || '',
            authorImage: post.authorImage || '/img/berkeley.png',
            articleImage: post.featuredImage || post.thumbnail || '/img/palo-alto.png',
            link: `/blog/${post.slug || slug}`,
          });
        } else {
          // Featured article response
          setArticle(data);
        }
      } catch (err) {
        console.error('Error fetching featured article:', err);
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className={`w-full mt-8 mb-8 lg:px-16 px-6 ${className}`}>
        <div className="mb-10">
          {showBackNavigation && (
            <div className="mb-8 items-center">
              <Link href="/blog" className="flex" passHref>
                <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                <span className="text-text-primary">Blog</span>
              </Link>
            </div>
          )}
          
          <Skeleton className="h-8 w-3/4 mb-5" />
          <div className="flex items-center space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="w-full sm:h-[450px] h-[300px] xl:h-[500px] rounded-md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full mt-8 mb-8 lg:px-16 px-6 ${className}`}>
        <div className="mb-10">
          {showBackNavigation && (
            <div className="mb-8 items-center">
              <Link href="/blog" className="flex" passHref>
                <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                <span className="text-text-primary">Blog</span>
              </Link>
            </div>
          )}
          
          <div 
            className="text-status-error bg-status-bg-error border border-border-error rounded-md p-4" 
            role="alert"
          >
            <h3 className="font-semibold mb-2">Error Loading Article</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className={`w-full mt-8 mb-8 lg:px-16 px-6 ${className}`}>
        <div className="mb-10">
          {showBackNavigation && (
            <div className="mb-8 items-center">
              <Link href="/blog" className="flex" passHref>
                <ChevronLeftIcon className="w-6 h-6 text-text-primary" />
                <span className="text-text-primary">Blog</span>
              </Link>
            </div>
          )}
          
          <div className="text-text-secondary text-center py-8">
            <p>No featured article available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className={`w-full mt-8 mb-8 lg:px-16 px-6 ${className}`}>
      <div className="mb-10">
        {showBackNavigation && (
          <nav className="mb-8 items-center" aria-label="Breadcrumb">
            <Link 
              href="/blog" 
              className="flex items-center text-text-primary hover:text-primary transition-colors duration-200" 
              passHref
            >
              <ChevronLeftIcon className="w-6 h-6" aria-hidden="true" />
              <span>Blog</span>
            </Link>
          </nav>
        )}
        
        <div>
          <h1 className="mb-5 text-text-primary">{article.title}</h1>
          <div className="flex items-center">
            <OptimizedImage
              src={article.authorImage}
              alt={`${article.author} profile picture`}
              className="rounded-full w-8 h-8 mr-2"
              width={32}
              height={32}
            />
            <p className="text-sm text-text-secondary">
              by {article.author} | {article.date} | {article.readTime}
            </p>
          </div>
        </div>
      </div>
      
      <div className="relative bg-surface-tertiary w-full sm:h-[450px] h-[300px] xl:h-[500px] rounded-md overflow-hidden">
        <OptimizedImage
          src={article.articleImage}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
      </div>
    </header>
  );
}
