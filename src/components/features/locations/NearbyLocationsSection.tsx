'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface NearbyLocation {
  slug: string;
  city: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
}

export interface NearbyLocationsSectionProps {
  currentCity: string;
  nearbyLocations: NearbyLocation[];
  className?: string;
}

export function NearbyLocationsSection({
  currentCity,
  nearbyLocations,
  className,
}: NearbyLocationsSectionProps) {
  if (!nearbyLocations || nearbyLocations.length === 0) return null;

  return (
    <section
      className={cn('lg:px-16 px-12 sm:mb-48 mb-24', className)}
      aria-labelledby="nearby-locations-heading"
    >
      <div className="flex flex-col sm:flex-row w-full justify-between items-left sm:items-center sm:mb-10 mb-4 py-4">
        <h1 id="nearby-locations-heading">Nearby locations</h1>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        role="list"
        aria-label={`Storage locations near ${currentCity}`}
      >
        {nearbyLocations.map(loc => (
          <div key={loc.slug} role="listitem">
            <Card
              imageSrc={loc.heroImageUrl || `/locations/${loc.slug}.png`}
              imageAlt={loc.heroImageAlt || `${loc.city} storage`}
              location={`${loc.city} storage`}
              link={`/locations/${loc.slug}`}
              ariaLabel={`View storage services in ${loc.city}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
