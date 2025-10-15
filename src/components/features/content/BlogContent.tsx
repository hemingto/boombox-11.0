/**
 * @fileoverview Dynamic blog content component with database-driven content blocks
 * @source boombox-10.0/src/app/components/blog-post/blogcontent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Renders structured blog content from database content blocks
 * - Supports multiple content block types (paragraph, heading, image, quote, list, code)
 * - Replaces static content array with dynamic database-driven content
 * - Maintains responsive image layout and typography
 * 
 * API ROUTES UPDATED:
 * - Uses: /api/blog/posts/[slug] (for individual post content)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic spacing (section-spacing)
 * - Applied typography scale from design system
 * - Uses OptimizedImage primitive component
 * - Consistent color tokens (text-text-primary, text-text-secondary)
 * 
 * @refactor Migrated from static content array to database-driven content blocks system
 */

'use client';

import { useState, useEffect } from 'react';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage';
import { Skeleton } from '@/components/ui/primitives/Skeleton';
import { BlogContentBlockType } from '@prisma/client';

interface BlogContentBlock {
  id: number;
  type: BlogContentBlockType;
  content: string;
  metadata?: {
    alt?: string;
    level?: number;
    language?: string;
    [key: string]: any;
  };
  order: number;
}

interface BlogContentProps {
  /** Blog post slug to fetch content for */
  slug: string;
  /** Additional CSS classes for styling */
  className?: string;
}

export function BlogContent({ slug, className = '' }: BlogContentProps) {
  const [contentBlocks, setContentBlocks] = useState<BlogContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlogContent() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Blog post not found');
          }
          throw new Error(`Failed to fetch blog content: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort content blocks by order
        const sortedBlocks = (data.contentBlocks || []).sort(
          (a: BlogContentBlock, b: BlogContentBlock) => a.order - b.order
        );
        
        setContentBlocks(sortedBlocks);
      } catch (err) {
        console.error('Error fetching blog content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blog content');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchBlogContent();
    }
  }, [slug]);

  const renderContentBlock = (block: BlogContentBlock) => {
    const { type, content, metadata = {} } = block;

    switch (type) {
      case BlogContentBlockType.PARAGRAPH:
        return (
          <div 
            key={block.id} 
            className="text-text-primary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );

      case BlogContentBlockType.HEADING:
        const HeadingTag = `h${metadata.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            key={block.id} 
            className="text-text-primary font-semibold mb-4"
          >
            {content}
          </HeadingTag>
        );

      case BlogContentBlockType.IMAGE:
        return (
          <div key={block.id} className="my-6">
            <OptimizedImage
              src={content}
              alt={metadata.alt || 'Blog content image'}
              width={metadata.width || 324}
              height={metadata.height || 276}
              className="rounded-md float-left mr-4 w-full sm:w-1/2 mb-4 sm:mb-1"
            />
          </div>
        );

      case BlogContentBlockType.QUOTE:
        return (
          <blockquote 
            key={block.id} 
            className="border-l-4 border-primary pl-4 py-2 my-6 text-text-secondary italic"
          >
            {content}
          </blockquote>
        );

      case BlogContentBlockType.LIST:
        const listItems = content.split('\n').filter(item => item.trim());
        const ListTag = metadata.ordered ? 'ol' : 'ul';
        return (
          <ListTag 
            key={block.id} 
            className={`text-text-primary space-y-2 my-4 ${
              metadata.ordered ? 'list-decimal' : 'list-disc'
            } list-inside`}
          >
            {listItems.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {item.replace(/^[-*+]\s*/, '')}
              </li>
            ))}
          </ListTag>
        );

      case BlogContentBlockType.CODE:
        return (
          <pre 
            key={block.id} 
            className="bg-surface-tertiary p-4 rounded-md overflow-x-auto my-6"
          >
            <code className="text-sm text-text-primary font-mono">
              {content}
            </code>
          </pre>
        );

      default:
        return (
          <div 
            key={block.id} 
            className="text-text-primary"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className={`flex-col space-y-6 mb-10 ${className}`}>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-48 w-full rounded-md" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-col space-y-6 mb-10 ${className}`}>
        <div 
          className="text-status-error bg-status-bg-error border border-border-error rounded-md p-4" 
          role="alert"
        >
          <h3 className="font-semibold mb-2">Error Loading Content</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (contentBlocks.length === 0) {
    return (
      <div className={`flex-col space-y-6 mb-10 ${className}`}>
        <div className="text-text-secondary text-center py-8">
          <p>No content available for this blog post.</p>
        </div>
      </div>
    );
  }

  return (
    <article className={`flex-col space-y-6 mb-10 ${className}`}>
      {contentBlocks.map(renderContentBlock)}
    </article>
  );
}
