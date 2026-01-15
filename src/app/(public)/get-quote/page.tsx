/**
 * @fileoverview Get quote page route
 * @source boombox-10.0/src/app/getquote/page.tsx
 * 
 * PAGE FUNCTIONALITY:
 * Public route for new customer quote requests. Renders GetQuoteForm
 * component with proper layout and SEO metadata. This is the primary
 * customer entry point for requesting mobile storage and moving services.
 * 
 * ROUTE GROUP ORGANIZATION:
 * - Located in (public) route group as per boombox-11.0 architecture
 * - Public access page that doesn't require authentication
 * - URL structure: /get-quote (simplified from /getquote)
 * 
 * STRIPE INTEGRATION:
 * - Stripe Elements wrapper now handled within GetQuoteForm component
 * - No need for Elements wrapper at page level (refactored in TASK_011)
 * 
 * DESIGN SYSTEM COMPLIANCE:
 * - Uses semantic design tokens throughout
 * - Responsive layout with mobile-first approach
 * - Accessibility-compliant (WCAG 2.1 AA)
 * 
 * @refactor 
 * - Moved from /app/getquote/ to /app/(public)/get-quote/ per PRD
 * - Removed page-level Stripe Elements wrapper (now in component)
 * - Added comprehensive SEO metadata with structured data
 * - Simplified page structure to focus on SEO and routing
 * - Enhanced metadata with Open Graph and Twitter Card tags
 */

import { Metadata } from 'next';
import { GetQuoteForm } from '@/components/features/orders/get-quote';

/**
 * SEO Metadata for Get Quote page
 * Optimized for search engines and social media sharing
 */
export const metadata: Metadata = {
  title: 'Get a Quote - Boombox Storage | Mobile Storage & Moving Services',
  description: 'Get an instant quote for mobile storage and moving services in the Bay Area. Book your appointment online with transparent pricing, flexible scheduling, and professional service.',
  keywords: [
    'mobile storage',
    'moving services',
    'storage quote',
    'Bay Area storage',
    'portable storage',
    'moving quote',
    'storage units',
    'on-demand storage',
    'flexible storage',
    'moving help'
  ],
  
  // Open Graph metadata for social media sharing
  openGraph: {
    title: 'Get a Quote - Boombox Storage',
    description: 'Book mobile storage and moving services in the Bay Area. Get an instant quote with transparent pricing and flexible scheduling.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Boombox Storage',
    images: [
      {
        url: '/img/logo.png',
        width: 1200,
        height: 630,
        alt: 'Boombox Storage - Mobile Storage & Moving Services',
      },
    ],
  },
  
  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Get a Quote - Boombox Storage',
    description: 'Book mobile storage and moving services in the Bay Area. Get an instant quote today.',
    images: ['/img/logo.png'],
  },
  
  // Canonical URL to prevent duplicate content issues
  alternates: {
    canonical: '/get-quote',
  },
  
  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification tags (can be added if needed)
  // verification: {
  //   google: 'verification-token',
  // },
};

/**
 * GetQuotePage - Public route for customer quote requests
 * 
 * Renders the GetQuoteForm component which handles the complete
 * 5-step quote flow including:
 * 1. Address and storage unit selection
 * 2. Date and time scheduling
 * 3. Labor selection (conditional on plan type)
 * 4. Payment and contact information
 * 5. Phone verification
 * 
 * The form integrates with Stripe for payment processing and includes
 * comprehensive validation, accessibility features, and error handling.
 * 
 * @returns The get quote page with form component
 */
export default function GetQuotePage() {
  return (
    <main>
      {/* 
        GetQuoteForm component handles:
        - Stripe Elements integration (wrapper included)
        - Multi-step form flow with validation
        - State management via GetQuoteProvider
        - API integration for quote submission
        - Accessibility compliance (WCAG 2.1 AA)
      */}
      <GetQuoteForm />
      
      {/* 
        Structured Data (JSON-LD) for LocalBusiness
        Helps search engines understand the business and service offering
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Boombox Storage',
            description: 'Mobile storage and moving services in the Bay Area',
            '@id': 'https://boomboxstorage.com',
            url: 'https://boomboxstorage.com',
            telephone: '+1-XXX-XXX-XXXX', // TODO: Update with actual phone number
            priceRange: '$$',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'San Francisco',
              addressRegion: 'CA',
              addressCountry: 'US',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 37.7749,
              longitude: -122.4194,
            },
            areaServed: [
              {
                '@type': 'City',
                name: 'San Francisco',
              },
              {
                '@type': 'City',
                name: 'Oakland',
              },
              {
                '@type': 'City',
                name: 'Berkeley',
              },
              {
                '@type': 'City',
                name: 'San Jose',
              },
              {
                '@type': 'City',
                name: 'Palo Alto',
              },
              {
                '@type': 'City',
                name: 'Mountain View',
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
                    description: 'Flexible, on-demand storage units delivered to your location',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Moving Services',
                    description: 'Professional moving help and labor services',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'Full Service Plan',
                    description: 'Complete moving and storage solution with professional labor',
                  },
                },
                {
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: 'DIY Plan',
                    description: 'Self-service storage option with flexible delivery',
                  },
                },
              ],
            },
            potentialAction: {
              '@type': 'ReserveAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://boomboxstorage.com/get-quote',
                actionPlatform: [
                  'http://schema.org/DesktopWebPlatform',
                  'http://schema.org/MobileWebPlatform',
                ],
              },
              result: {
                '@type': 'Reservation',
                name: 'Storage and Moving Service Booking',
              },
            },
          }),
        }}
      />
    </main>
  );
}

