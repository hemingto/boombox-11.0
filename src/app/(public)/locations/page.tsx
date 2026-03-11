/**
 * @fileoverview Locations page - service areas and coverage
 * @source boombox-10.0/src/app/locations/page.tsx
 * @refactor Migrated to (public) route group with SEO metadata
 */

import type { Metadata } from 'next';
import {
  LocationsHeroSection,
  PopularLocationsSection,
  CitiesSection,
  ZipCodeSection,
  GetQuoteLocations,
  LocationsFaqSection,
} from '@/components/features/locations';
import { HelpCenterSection } from '@/components/features/landing';
import { LocationPageService } from '@/lib/services/locationPageService';

export const metadata: Metadata = {
  title: 'Storage Locations - San Francisco Bay Area | Boombox Storage',
  description:
    'Boombox Storage serves the entire San Francisco Bay Area. Find storage solutions in your city or zip code. Free delivery and pickup!',
  keywords:
    'storage locations, san francisco storage, bay area storage, storage near me',
  openGraph: {
    title: 'Storage Locations - San Francisco Bay Area | Boombox Storage',
    description:
      'Boombox Storage serves the entire San Francisco Bay Area. Find storage in your area!',
    type: 'website',
  },
};

export default async function Locations() {
  const publishedSlugs = await LocationPageService.getAllPublishedSlugs();
  const slugs = publishedSlugs.map(loc => loc.slug);

  return (
    <>
      <LocationsHeroSection />
      <PopularLocationsSection />
      <GetQuoteLocations imageSrc="/locations/2829-steiner.png" />
      <CitiesSection publishedSlugs={slugs} />
      <ZipCodeSection />
      <LocationsFaqSection />
      <HelpCenterSection />
    </>
  );
}
