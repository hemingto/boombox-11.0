/**
 * @fileoverview JSON-LD structured data schemas for Boombox
 * Helps search engines understand business information for rich snippets
 */

import { SITE_CONFIG } from './metadata';

// Business contact information
const BUSINESS_INFO = {
  name: 'Boombox',
  description: 'Mobile storage and moving services company serving the San Francisco Bay Area',
  address: {
    streetAddress: '',  // TODO: Add actual business address
    addressLocality: 'San Francisco',
    addressRegion: 'CA',
    postalCode: '',     // TODO: Add postal code
    addressCountry: 'US',
  },
  contactPoint: {
    telephone: '',      // TODO: Add business phone
    contactType: 'customer service',
    availableLanguage: 'English',
  },
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}/img/logo.png`,
  sameAs: [
    // TODO: Add social media URLs
    // 'https://www.facebook.com/boomboxstorage',
    // 'https://www.instagram.com/boomboxstorage',
    // 'https://twitter.com/boomboxstorage',
  ],
} as const;

/**
 * Generate LocalBusiness schema for the main business
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    ...BUSINESS_INFO,
    '@id': `${SITE_CONFIG.url}#organization`,
    priceRange: '$$',
    serviceArea: [
      {
        '@type': 'City',
        name: 'San Francisco',
        containedInPlace: {
          '@type': 'State',
          name: 'California',
        },
      },
      {
        '@type': 'City',
        name: 'Oakland',
        containedInPlace: {
          '@type': 'State',
          name: 'California',
        },
      },
      {
        '@type': 'City',
        name: 'Berkeley',
        containedInPlace: {
          '@type': 'State',
          name: 'California',
        },
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Storage and Moving Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mobile Storage Units',
            description: 'Portable storage containers delivered to your location',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Packing Supplies',
            description: 'Professional packing materials and supplies',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Moving Services',
            description: 'Professional moving and relocation services',
          },
        },
      ],
    },
  };
}

/**
 * Generate Service schema for specific services
 */
export function generateServiceSchema(service: {
  name: string;
  description: string;
  serviceType: string;
  areaServed?: string[];
}) {
  const { name, description, serviceType, areaServed = ['San Francisco Bay Area'] } = service;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    provider: {
      '@type': 'Organization',
      name: BUSINESS_INFO.name,
      '@id': `${SITE_CONFIG.url}#organization`,
    },
    areaServed: areaServed.map(area => ({
      '@type': 'Place',
      name: area,
    })),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      description: `Get a quote for ${name.toLowerCase()}`,
    },
  };
}

/**
 * Generate AggregateRating schema for customer reviews
 */
export function generateAggregateRatingSchema(rating: {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}) {
  const { ratingValue, reviewCount, bestRating = 5, worstRating = 1 } = rating;

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: ratingValue.toString(),
    reviewCount: reviewCount.toString(),
    bestRating: bestRating.toString(),
    worstRating: worstRating.toString(),
    itemReviewed: {
      '@type': 'Organization',
      name: BUSINESS_INFO.name,
      '@id': `${SITE_CONFIG.url}#organization`,
    },
  };
}

/**
 * Generate individual Review schema
 */
export function generateReviewSchema(review: {
  author: string;
  reviewRating: number;
  reviewBody: string;
  datePublished: Date;
}) {
  const { author, reviewRating, reviewBody, datePublished } = review;

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody,
    datePublished: datePublished.toISOString().split('T')[0],
    itemReviewed: {
      '@type': 'Organization',
      name: BUSINESS_INFO.name,
      '@id': `${SITE_CONFIG.url}#organization`,
    },
  };
}

/**
 * Generate FAQ schema for common questions
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_CONFIG.url}${crumb.url}`,
    })),
  };
}

/**
 * Utility function to generate JSON-LD script tag content
 */
export function generateStructuredDataScript(schema: object): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Export business info for reuse
 */
export { BUSINESS_INFO }; 