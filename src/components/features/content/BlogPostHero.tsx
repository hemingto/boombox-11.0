/**
 * @fileoverview Blog post hero section with database integration
 * @source boombox-10.0/src/app/components/blog-post/blogposthero.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Displays featured blog post hero section with navigation
 * - Shows article title, author info, date, and featured image
 * - Includes back navigation to blog listing
 * - Server component that receives post data as props
 *
 * API ROUTES UPDATED:
 * - No API calls (receives data from parent page component)
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (text-text-primary, text-text-secondary)
 * - Applied consistent spacing and typography
 * - Uses Next.js Image component
 * - Maintains responsive design patterns
 *
 * @refactor Converted to server component with prop-based data flow
 */

import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPostWithCategory } from '@/lib/services/blogService';

interface BlogPostHeroProps {
  /** Blog post data with category info */
  post: BlogPostWithCategory;
  /** Additional CSS classes for styling */
  className?: string;
  /** Whether to show back navigation */
  showBackNavigation?: boolean;
}

export function BlogPostHero({
  post,
  className = '',
  showBackNavigation = true,
}: BlogPostHeroProps) {
  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Recent';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const readTimeDisplay = post.readTime
    ? `${post.readTime} min read`
    : '5 min read';
  const authorDisplay = post.authorName || 'Calvin';
  const authorImageSrc =
    post.authorImage ||
    'https://res.cloudinary.com/daezxeevr/image/upload/v1773181381/author-calvin_dk982x.png';
  const featuredImageSrc = post.featuredImage || '/hero-imgs/hero.png';
  const featuredImageAlt = post.featuredImageAlt || post.title;

  return (
    <header className={`w-full mt-8 mb-8 lg:px-16 px-6 ${className}`}>
      <div className="mb-10">
        {showBackNavigation && (
          <nav className="mb-8 items-center" aria-label="Breadcrumb">
            <Link
              href="/blog"
              className="flex items-center text-text-primary hover:text-primary"
              passHref
            >
              <ChevronLeftIcon className="w-6 h-6" aria-hidden="true" />
              <span>Blog</span>
            </Link>
          </nav>
        )}

        <div>
          <h1 className="mb-5 text-text-primary">{post.title}</h1>
          <div className="flex items-center">
            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
              <Image
                src={authorImageSrc}
                alt={`${authorDisplay} profile picture`}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <p className="text-sm text-text-tertiary">
              by {authorDisplay} | {formatDate(post.publishedAt)} |{' '}
              {readTimeDisplay}
            </p>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.slice(0, 5).map(t => (
                <span
                  key={t.blogTag.slug}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface-secondary text-text-primary"
                >
                  {t.blogTag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-surface-tertiary w-full sm:h-[450px] h-[300px] xl:h-[500px] rounded-3xl overflow-hidden">
        <Image
          src={featuredImageSrc}
          alt={featuredImageAlt}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>
    </header>
  );
}
