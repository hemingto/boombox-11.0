/**
 * @fileoverview Popular locations data for display on location pages
 * @source boombox-10.0/src/app/components/locations/popularlocationssection.tsx (inline data)
 */

export interface PopularLocation {
  location: string;
  customerCount: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  link: string;
}

export const popularLocations: PopularLocation[] = [
  {
    location: 'San Francisco',
    customerCount: '1,032',
    description: 'happy customers',
    imageSrc: '/img/golden-gate.png',
    imageAlt: 'Golden Gate Bridge',
    link: '/locations/san-francisco',
  },
  {
    location: 'Oakland',
    customerCount: '783',
    description: 'satisfied clients',
    imageSrc: '/img/oakland.png',
    imageAlt: 'Runners at Lake Merritt',
    link: '/locations/oakland',
  },
  {
    location: 'Berkeley',
    customerCount: '645',
    description: 'lovely patrons',
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley skyline',
    link: '/locations/berkeley',
  },
  {
    location: 'Mountain View',
    customerCount: '645',
    description: 'happy clientele',
    imageSrc: '/img/mountain-view.png',
    imageAlt: 'bike in front of office building',
    link: '/locations/mountain-view',
  },
  {
    location: 'Palo Alto',
    customerCount: '645',
    description: 'delighted users',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Stanford University archways',
    link: '/locations/palo-alto',
  },
  {
    location: 'San Jose',
    customerCount: '645',
    description: 'content clients',
    imageSrc: '/img/san-jose.png',
    imageAlt: 'Downtown San Jose office buildings and palm trees',
    link: '/locations/san-jose',
  },
];

