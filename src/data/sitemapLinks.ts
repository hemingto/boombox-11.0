/**
 * @fileoverview Sitemap navigation links data for sitemap page
 * @source boombox-10.0/src/app/components/sitemap/sitemaplinks.tsx (inline data)
 * @refactor Extracted sitemap data to centralized data folder for better maintainability
 */

import { SERVED_CITIES } from './locations';

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
 * - Locations: Dynamically generated from SERVED_CITIES
 */
export const sitemapData: SitemapSection[] = [
  {
    category: 'General',
    links: [
      { name: 'Homepage', href: '/' },
      { name: 'Storage Unit Prices', href: '/storage-unit-prices' },
      { name: 'Locations', href: '/locations' },
      { name: 'Terms', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Careers', href: '/careers' },
      { name: 'Storage Guidelines', href: '/storage-guidelines' },
      { name: 'Holiday Storage', href: '/holiday-storage' },
      { name: 'Commercial Storage', href: '/commercial-storage' },
      { name: 'Archival Storage', href: '/archival-storage' },
      { name: 'Moving and Storage', href: '/moving-and-storage' },
      { name: 'Blog', href: '/blog' },
      { name: 'Storage Calculator', href: '/storage-calculator' },
      { name: 'Packing Supplies', href: '/packing-supplies' },
      { name: 'Insurance', href: '/insurance' },
      { name: 'How it works', href: '/howitworks' },
      { name: 'Help Center', href: '/help-center' },
      { name: 'Delivery Guide', href: '/guides/delivery-guide' },
      { name: 'Packing Guide', href: '/guides/packing-guide' },
      { name: 'Storage Access Guide', href: '/guides/storage-access-guide' },
      { name: 'Location Guide', href: '/guides/location-guide' },
      { name: 'Driver Sign Up', href: '/driver-signup' },
      { name: 'Checklist', href: '/checklist' },
      { name: 'Get Quote', href: '/get-quote' },
    ],
  },
  {
    category: 'Locations',
    links: SERVED_CITIES.map(loc => ({
      name: loc.city,
      href: loc.href,
    })),
  },
];
