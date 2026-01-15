/**
 * @fileoverview Dynamic blog content component with database-driven content blocks
 * @source boombox-10.0/src/app/components/blog-post/blogcontent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Renders structured blog content from content blocks
 * - Supports multiple content block types (paragraph, heading, image, quote, list, code)
 * - Server component that receives data as props
 * - Maintains responsive image layout and typography
 * 
 * API ROUTES UPDATED:
 * - No API calls (receives data from server component parent)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic spacing (section-spacing)
 * - Applied typography scale from design system
 * - Uses Next.js Image component
 * - Consistent color tokens (text-text-primary, text-text-secondary)
 * 
 * @refactor Converted from client-side fetching to server-side prop-based rendering
 */

import Image from 'next/image';
import { BlogContentBlockType } from '@prisma/client';

interface BlogContentBlock {
  id: number;
  type: BlogContentBlockType;
  content: string;
  metadata?: {
    alt?: string;
    level?: number;
    language?: string;
    ordered?: boolean;
    width?: number;
    height?: number;
    [key: string]: any;
  };
  order: number;
}

interface BlogContentProps {
  /** Array of content blocks to render */
  contentBlocks: BlogContentBlock[];
  /** Additional CSS classes for styling */
  className?: string;
}

export function BlogContent({ contentBlocks, className = '' }: BlogContentProps) {
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
        const level = metadata.level || 2;
        const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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
            <Image
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

  if (!contentBlocks || contentBlocks.length === 0) {
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
