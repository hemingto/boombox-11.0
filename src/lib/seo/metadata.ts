/**
 * @fileoverview SEO utilities for Next.js 15 Metadata API
 * Dynamic meta tags, OpenGraph, and Twitter Cards for Boombox
 */

import type { Metadata } from 'next';

// Base configuration for Boombox
const SITE_CONFIG = {
  name: 'Boombox',
  description: 'Mobile storage and moving services in the San Francisco Bay Area. Get a quote for storage units, packing supplies, and professional moving services.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://boombox.com',
  ogImage: '/img/og-image.png',
  twitterHandle: '@boomboxstorage',
  keywords: [
    'mobile storage',
    'storage units',
    'moving services',
    'San Francisco storage',
    'Bay Area moving',
    'packing supplies',
    'temporary storage',
    'self storage'
  ],
} as const;

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  canonical?: string;
  type?: 'website' | 'article' | 'service';
}

/**
 * Generate comprehensive metadata for pages
 */
export function generateMetadata(config: SEOConfig = {}): Metadata {
  const {
    title,
    description = SITE_CONFIG.description,
    keywords = [],
    ogImage = SITE_CONFIG.ogImage,
    noIndex = false,
    canonical,
    type = 'website',
  } = config;

  const fullTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.name;
  const allKeywords = [...SITE_CONFIG.keywords, ...keywords];
  const canonicalUrl = canonical ? `${SITE_CONFIG.url}${canonical}` : undefined;

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),
    
    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Canonical URL
    alternates: canonicalUrl ? {
      canonical: canonicalUrl,
    } : undefined,

    // OpenGraph
    openGraph: {
      type: type === 'service' ? 'website' : type,
      title: fullTitle,
      description,
      url: canonicalUrl || SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || SITE_CONFIG.name,
        },
      ],
      locale: 'en_US',
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
      creator: SITE_CONFIG.twitterHandle,
      site: SITE_CONFIG.twitterHandle,
    },

    // Additional meta tags
    other: {
      'theme-color': '#18181b', // zinc-950 brand color
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  };
}

/**
 * Generate metadata for service pages
 */
export function generateServiceMetadata(service: {
  name: string;
  description: string;
  location?: string;
}): Metadata {
  const { name, description, location } = service;
  const locationSuffix = location ? ` in ${location}` : ' in San Francisco Bay Area';
  
  return generateMetadata({
    title: `${name}${locationSuffix}`,
    description,
    keywords: [name.toLowerCase(), location?.toLowerCase()].filter((k): k is string => Boolean(k)),
    type: 'service',
    canonical: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
  });
}

/**
 * Generate metadata for location pages
 */
export function generateLocationMetadata(location: {
  city: string;
  state: string;
  services?: string[];
}): Metadata {
  const { city, state, services = [] } = location;
  const serviceList = services.length > 0 ? services.join(', ') : 'storage and moving services';
  
  return generateMetadata({
    title: `${serviceList} in ${city}, ${state}`,
    description: `Professional ${serviceList} in ${city}, ${state}. Mobile storage units, packing supplies, and moving services. Get a free quote today.`,
    keywords: [city.toLowerCase(), state.toLowerCase(), ...services.map(s => s.toLowerCase())],
    canonical: `/${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`,
  });
}

/**
 * Generate metadata for blog/content pages
 */
export function generateContentMetadata(content: {
  title: string;
  excerpt: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
}): Metadata {
  const { title, excerpt, author, publishedAt, tags = [] } = content;
  
  const metadata = generateMetadata({
    title,
    description: excerpt,
    keywords: tags,
    type: 'article',
  });

  // Add article-specific OpenGraph data
  if (metadata.openGraph) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      authors: author ? [author] : undefined,
      publishedTime: publishedAt?.toISOString(),
      tags,
    };
  }

  return metadata;
}

/**
 * Site configuration constants for reuse
 */
export { SITE_CONFIG }; 