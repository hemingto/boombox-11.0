/**
 * @fileoverview Content block renderer for guide pages
 *
 * Renders static guide content blocks in a readable layout.
 * Supports paragraph, heading, image, list, and callout block types.
 * Follows the same rendering pattern as BlogContent but operates
 * on static data rather than Prisma-driven content blocks.
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { GuideContentBlock } from '@/data/guidePages';

interface GuideContentProps {
  contentBlocks: GuideContentBlock[];
  className?: string;
}

export function GuideContent({ contentBlocks, className }: GuideContentProps) {
  const renderBlock = (block: GuideContentBlock, index: number) => {
    const { type, content, metadata = {} } = block;

    switch (type) {
      case 'paragraph':
        return (
          <div
            key={index}
            className="text-text-primary leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );

      case 'heading': {
        const level = metadata.level || 2;
        const HeadingTag = `h${level}` as
          | 'h1'
          | 'h2'
          | 'h3'
          | 'h4'
          | 'h5'
          | 'h6';
        return (
          <HeadingTag
            key={index}
            className="text-text-primary font-semibold mb-4"
          >
            {content}
          </HeadingTag>
        );
      }

      case 'image':
        return (
          <div
            key={index}
            className="relative w-full aspect-[3/2] my-6 rounded-3xl overflow-hidden"
          >
            <Image
              src={content}
              alt={metadata.alt || 'Guide content image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        );

      case 'list': {
        const listItems = content.split('\n').filter(item => item.trim());
        const ListTag = metadata.ordered ? 'ol' : 'ul';
        return (
          <ListTag
            key={index}
            className={cn(
              'text-text-primary space-y-2 my-4 list-inside',
              metadata.ordered ? 'list-decimal' : 'list-disc'
            )}
          >
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">
                {item.replace(/^[-*+]\s*/, '')}
              </li>
            ))}
          </ListTag>
        );
      }

      case 'callout':
        return (
          <div
            key={index}
            className="border-l-4 border-primary bg-surface-secondary rounded-r-lg px-5 py-4 my-6 text-text-primary"
          >
            {content}
          </div>
        );

      default:
        return (
          <div
            key={index}
            className="text-text-primary"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
    }
  };

  if (!contentBlocks || contentBlocks.length === 0) {
    return (
      <div className={cn('flex-col space-y-6 mb-10', className)}>
        <div className="text-text-primary text-center py-8">
          <p>No content available for this guide.</p>
        </div>
      </div>
    );
  }

  return (
    <article className={cn('flex-col space-y-6 mb-10', className)}>
      {contentBlocks.map(renderBlock)}
    </article>
  );
}
