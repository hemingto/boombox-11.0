/**
 * @fileoverview Featured article section component with author info and call-to-action
 * @source boombox-10.0/src/app/components/blog/featuredarticlesection.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays featured article with large image and detailed content
 * - Shows author information with profile image
 * - Includes call-to-action button for reading full article
 * - Responsive two-column layout (content + image)
 * 
 * API ROUTES UPDATED:
 * - No API routes used (static content only)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (zinc-950 → primary, slate-100 → surface-secondary)
 * - Used semantic button classes (btn-primary) from design system
 * - Applied consistent spacing patterns (lg:px-16 px-6, sm:pb-24 sm:mb-24)
 * - Used design system border utilities (border-border)
 * - Replaced bg-slate placeholder with proper Next.js Image component
 * 
 * BUSINESS LOGIC EXTRACTED:
 * - Featured article data moved to ContentService
 * - Article selection logic centralized in service method
 * 
 * @refactor Migrated to content domain with design system compliance and improved accessibility
 */

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { ContentService } from '@/lib/services/contentService';
import { Button } from '@/components/ui/primitives/Button';

/**
 * Featured article section component
 * 
 * Displays the primary featured article with author information and call-to-action.
 * Uses responsive layout with content on left and image on right.
 */
export const FeaturedArticleSection: React.FC = () => {
  // Get the primary featured article from ContentService
  const article = ContentService.getPrimaryFeaturedArticle();

  // If no featured article is available, don't render the component
  if (!article) {
    return null;
  }

  return (
    <article className="md:flex lg:mx-16 mx-6 sm:pb-24 sm:mb-24 pb-12 mb-12 md:border-b-2 md:border-border">
      {/* Content section */}
      <div className="place-content-center items-center basis-5/12 mr-4">
        <Link href={article.link} className="group">
          <h2 className="mb-4 group-hover:underline transition-all duration-200">
            {article.title}
          </h2>
        </Link>
        
        <p className="max-w-lg mb-4 text-text-secondary">
          {article.description}
        </p>
        
        {/* Author information */}
        <Link href={article.link} className="group">
          <div className="flex items-center mb-8">
            <Image
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
        </Link>
        
        {/* Call-to-action button */}
        <Link href={article.link}>
          <Button 
            variant="primary" 
            size="md"
            className="font-inter"
            aria-label={`Read full article: ${article.title}`}
          >
            Read more
          </Button>
        </Link>
      </div>
      
      {/* Featured image section */}
      <div className="flex place-content-end basis-7/12">
        <div className="relative aspect-video w-full md:ml-6 mt-8 md:mt-0 rounded-md overflow-hidden">
          <Link href={article.link} className="group">
            <Image
              src={article.articleImage}
              alt={article.title}
              fill
              className="rounded-md object-cover transition-transform duration-300 group-hover:scale-[102%]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 50vw"
              priority
            />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default FeaturedArticleSection;
