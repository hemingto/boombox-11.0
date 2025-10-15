/**
 * @fileoverview Sitemap navigation links data for sitemap page
 * @source boombox-10.0/src/app/components/sitemap/sitemaplinks.tsx (inline data)
 * @refactor Extracted sitemap data to centralized data folder for better maintainability
 */

/**
 * Individual sitemap link interface
 */
export interface SitemapLink {
  name: string;
  href: string;
}

/**
 * Sitemap section interface with category and links
 */
export interface SitemapSection {
  category: string;
  links: SitemapLink[];
}

/**
 * Sitemap navigation data organized by categories
 * 
 * Contains all public-facing pages organized into logical sections:
 * - General: Main navigation pages
 * - Blog Posts: Content articles
 * - Locations: Service area cities
 */
export const sitemapData: SitemapSection[] = [
  {
    category: 'General',
    links: [
      { name: 'Homepage', href: '/' },
      { name: 'Storage Unit Prices', href: '/storage-unit-prices' },
      { name: 'Locations', href: '/locations' },
      { name: 'Terms', href: '/terms' },
      { name: 'Careers', href: '/careers' },
      { name: 'Storage Guidelines', href: '/storage-guidelines' },
      { name: 'Holiday Storage', href: '/holiday-storage' },
      { name: 'Blog', href: '/blog' },
      { name: 'Storage Calculator', href: '/storage-calculator' },
      { name: 'Packing Supplies', href: '/packing-supplies' },
      { name: 'Insurance', href: '/insurance' },
      { name: 'How it works', href: '/how-it-works' },
      { name: 'Help Center', href: '/help-center' },
      { name: 'Driver Sign Up', href: '/driver-sign-up' },
      { name: 'Checklist', href: '/checklist' },
      { name: 'Get Quote', href: '/get-quote' },
    ],
  },
  {
    category: 'Blog Posts',
    links: [
      { name: 'Blog Post', href: '/blog-post-1' },
      { name: 'Blog Post', href: '/blog-post-2' },
      { name: 'Blog Post', href: '/blog-post-3' },
      { name: 'Blog Post', href: '/blog-post-4' },
      { name: 'Blog Post', href: '/blog-post-5' },
      // add more blog posts as needed...
    ],
  },
  {
    category: 'Locations',
    links: [
      { name: 'Burlingame', href: '/locations/burlingame' },
      { name: 'Cupertino', href: '/locations/cupertino' },
      { name: 'San Jose', href: '/locations/san-jose' },
      { name: 'Santa Clara', href: '/locations/santa-clara' },
      { name: 'Mountain View', href: '/locations/mountain-view' },
      { name: 'Palo Alto', href: '/locations/palo-alto' },
      { name: 'Berkeley', href: '/locations/berkeley' },
      // add more locations as needed...
    ],
  },
];

