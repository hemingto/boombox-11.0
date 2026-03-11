/**
 * @fileoverview Featured article section component with author info and call-to-action
 * @source boombox-10.0/src/app/components/blog/featuredarticlesection.tsx
 * @refactor Migrated to accept props from server component instead of static ContentService
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/primitives/Button';
import type { FeaturedArticle } from '@/types/content.types';

interface FeaturedArticleSectionProps {
  article: FeaturedArticle | null;
}

export const FeaturedArticleSection: React.FC<FeaturedArticleSectionProps> = ({
  article,
}) => {
  if (!article) {
    return null;
  }

  return (
    <article className="md:flex lg:mx-16 mx-6 sm:pb-24 sm:mb-24 pb-12 mb-12 md:border-b md:border-border">
      <div className="place-content-center items-center basis-5/12 mr-4">
        <Link href={article.link} className="group">
          <h2 className="mb-4 group-hover:underline transition-all duration-200">
            {article.title}
          </h2>
        </Link>

        <p className="max-w-lg mb-4 text-text-primary">{article.description}</p>

        <Link href={article.link} className="group">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 mr-2 flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={article.authorImage || '/placeholder.jpg'}
                alt={`${article.author} profile picture`}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-text-tertiary">
              by {article.author} | {article.date} | {article.readTime}
            </p>
          </div>
        </Link>

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

      <div className="flex place-content-end basis-7/12 md:ml-6 mt-8 md:mt-0">
        <Link href={article.link} className="group w-full">
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden">
            <Image
              src={article.articleImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[102%]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 50vw"
              priority
            />
          </div>
        </Link>
      </div>
    </article>
  );
};

export default FeaturedArticleSection;
