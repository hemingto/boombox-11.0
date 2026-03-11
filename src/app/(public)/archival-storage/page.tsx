import { Metadata } from 'next';
import {
  HeroSection,
  HowItWorksSection,
  WhatFitsSection,
  CustomerReviewSection,
  SecuritySection,
  HelpCenterSection,
} from '@/components/features/landing';
import {
  CategoryAboutSection,
  RelatedCategoriesSection,
  CategoryFaqSection,
} from '@/components/features/categories';
import {
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateStructuredDataScript,
} from '@/lib/seo/structured-data';
import { SITE_CONFIG } from '@/lib/seo/metadata';
import { categoryPages, allCategorySlugs } from '@/data/categoryPages';

const page = categoryPages['archival-storage'];

const relatedCategories = allCategorySlugs.map(slug => ({
  slug,
  title: categoryPages[slug].title,
}));

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  keywords: page.keywords.join(', '),
  openGraph: {
    title: page.metaTitle,
    description: page.metaDescription,
    url: `/${page.slug}`,
    type: 'website',
    images: [
      {
        url: '/img/og-image.png',
        width: 1200,
        height: 630,
        alt: page.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: page.metaTitle,
    description: page.metaDescription,
    images: ['/img/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/${page.slug}`,
  },
};

export default function ArchivalStoragePage() {
  const serviceSchema = generateServiceSchema({
    name: page.title,
    description: page.metaDescription,
    serviceType: 'Archival Storage',
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: page.title, url: `/${page.slug}` },
  ]);

  const faqSchema = generateFAQSchema(page.faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(serviceSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateStructuredDataScript(faqSchema),
        }}
      />

      <HeroSection
        title={page.heroTitle}
        buttontext="Get Quote"
        imageSrc={page.heroImagePath}
        imageAlt={page.heroImageAlt}
      />

      <CategoryAboutSection
        heading={page.aboutHeading}
        aboutContent={page.aboutContent}
        aboutContentTwo={page.aboutContentTwo}
        imageSrc={page.aboutImagePath}
        imageAlt={page.aboutImageAlt}
      />

      <HowItWorksSection />

      <WhatFitsSection />

      <CustomerReviewSection />

      <SecuritySection heading={page.securityHeading} />

      <RelatedCategoriesSection
        currentSlug={page.slug}
        categories={relatedCategories}
      />

      <CategoryFaqSection faqs={page.faqs} />

      <HelpCenterSection />
    </>
  );
}
