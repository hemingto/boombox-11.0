/**
 * @fileoverview Dynamic guide page
 *
 * ROUTE STRUCTURE:
 * - URL: /guides/[slug]
 * - Example: /guides/delivery-guide
 * - Static generation at build time via generateStaticParams
 *
 * FEATURES:
 * - Server component with generateMetadata for SEO
 * - Static generation for all guide slugs
 * - Breadcrumb and Article structured data
 * - Blog-post-style layout with guide-specific components
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { guidePages, allGuideSlugs } from '@/data/guidePages';
import {
  GuideHero,
  GuideContent,
  RelatedGuidesSection,
} from '@/components/features/guides';
import { HelpCenterSection } from '@/components/features/landing';
import {
  generateBreadcrumbSchema,
  generateStructuredDataScript,
} from '@/lib/seo/structured-data';
import { SITE_CONFIG } from '@/lib/seo/metadata';

interface GuidePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = guidePages[slug];

  if (!guide) {
    return {
      title: 'Guide Not Found',
      description: 'The requested guide could not be found.',
    };
  }

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords.join(', '),
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: `/guides/${guide.slug}`,
      type: 'article',
      images: [
        {
          url: guide.heroImage,
          width: 1200,
          height: 630,
          alt: guide.heroImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [guide.heroImage],
    },
    alternates: {
      canonical: `${SITE_CONFIG.url}/guides/${guide.slug}`,
    },
  };
}

export function generateStaticParams() {
  return allGuideSlugs.map(slug => ({ slug }));
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = guidePages[slug];

  if (!guide) {
    notFound();
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Help Center', url: '/help-center' },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    image: guide.heroImage,
    author: {
      '@type': 'Organization',
      name: 'Boombox',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Boombox',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/img/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/guides/${guide.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(articleSchema),
        }}
      />

      <div className="max-w-6xl mx-auto sm:mb-48 mb-24">
        <GuideHero
          title={guide.title}
          subtitle={guide.subtitle}
          readTime={guide.readTime}
          heroImage={guide.heroImage}
          heroImageAlt={guide.heroImageAlt}
        />
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 lg:gap-20 lg:px-16 px-6">
          <main className="sm:basis-9/12" role="main">
            <GuideContent contentBlocks={guide.contentBlocks} />
          </main>
          <aside
            className="w-full sm:basis-3/12 sm:max-w-[300px] sm:ml-auto"
            role="complementary"
            aria-label="Related guides"
          >
            <RelatedGuidesSection currentSlug={guide.slug} />
          </aside>
        </div>
      </div>

      <HelpCenterSection />
    </>
  );
}
