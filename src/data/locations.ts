/**
 * @fileoverview Service locations data for Boombox storage services
 * @source Extracted from LocationsPopover component for better maintainability
 */

import { ServiceLocation } from '@/types/location.types';

/**
 * List of all cities served by Boombox storage services
 * Each location includes SEO-friendly URLs and proper city identification
 */
export const SERVED_CITIES: ServiceLocation[] = [
  { name: "San Francisco storage", href: "/locations/san-francisco", city: "San Francisco", state: "CA", zipCode: "94102" },
  { name: "Oakland storage", href: "/locations/oakland", city: "Oakland", state: "CA", zipCode: "94612" },
  { name: "Berkeley storage", href: "/locations/berkeley", city: "Berkeley", state: "CA", zipCode: "94704" },
  { name: "San Jose storage", href: "/locations/san-jose", city: "San Jose", state: "CA", zipCode: "95113" },
  { name: "Pacifica storage", href: "/locations/pacifica", city: "Pacifica", state: "CA", zipCode: "94044" },
  { name: "Millbrae storage", href: "/locations/millbrae", city: "Millbrae", state: "CA", zipCode: "94030" },
  { name: "Burlingame storage", href: "/locations/burlingame", city: "Burlingame", state: "CA", zipCode: "94010" },
  { name: "San Mateo storage", href: "/locations/san-mateo", city: "San Mateo", state: "CA", zipCode: "94401" },
  { name: "Belmont storage", href: "/locations/belmont", city: "Belmont", state: "CA", zipCode: "94002" },
  { name: "San Carlos storage", href: "/locations/san-carlos", city: "San Carlos", state: "CA", zipCode: "94070" },
  { name: "Redwood City storage", href: "/locations/redwood-city", city: "Redwood City", state: "CA", zipCode: "94063" },
  { name: "Emerald Hills storage", href: "/locations/emerald-hills", city: "Emerald Hills", state: "CA", zipCode: "94062" },
  { name: "Woodside storage", href: "/locations/woodside", city: "Woodside", state: "CA", zipCode: "94062" },
  { name: "Atherton storage", href: "/locations/atherton", city: "Atherton", state: "CA", zipCode: "94027" },
  { name: "Menlo Park storage", href: "/locations/menlo-park", city: "Menlo Park", state: "CA", zipCode: "94025" },
  { name: "Palo Alto storage", href: "/locations/palo-alto", city: "Palo Alto", state: "CA", zipCode: "94301" },
  { name: "Mountain View storage", href: "/locations/mountain-view", city: "Mountain View", state: "CA", zipCode: "94041" },
  { name: "Sunnyvale storage", href: "/locations/sunnyvale", city: "Sunnyvale", state: "CA", zipCode: "94086" },
  { name: "Santa Clara storage", href: "/locations/santa-clara", city: "Santa Clara", state: "CA", zipCode: "95050" },
  { name: "Milpitas storage", href: "/locations/milpitas", city: "Milpitas", state: "CA", zipCode: "95035" },
  { name: "Saratoga storage", href: "/locations/saratoga", city: "Saratoga", state: "CA", zipCode: "95070" },
  { name: "Los Gatos storage", href: "/locations/los-gatos", city: "Los Gatos", state: "CA", zipCode: "95030" },
  { name: "Cupertino storage", href: "/locations/cupertino", city: "Cupertino", state: "CA", zipCode: "95014" },
  { name: "Portola Valley storage", href: "/locations/portola-valley", city: "Portola Valley", state: "CA", zipCode: "94028" },
  { name: "Fremont storage", href: "/locations/fremont", city: "Fremont", state: "CA", zipCode: "94536" },
  { name: "Newark storage", href: "/locations/newark", city: "Newark", state: "CA", zipCode: "94560" },
  { name: "Union City storage", href: "/locations/union-city", city: "Union City", state: "CA", zipCode: "94587" },
  { name: "Campbell storage", href: "/locations/campbell", city: "Campbell", state: "CA", zipCode: "95008" },
  { name: "South San Francisco storage", href: "/locations/south-san-francisco", city: "South San Francisco", state: "CA", zipCode: "94080" },
];

/**
 * Default location for fallback scenarios
 */
export const DEFAULT_LOCATION: ServiceLocation = SERVED_CITIES[0]; // San Francisco

/**
 * Get a location by city name
 */
export const getLocationByCity = (cityName: string): ServiceLocation | undefined => {
  return SERVED_CITIES.find(location => 
    location.city.toLowerCase() === cityName.toLowerCase()
  );
};

/**
 * Get locations by state
 */
export const getLocationsByState = (state: string): ServiceLocation[] => {
  return SERVED_CITIES.filter(location => location.state === state);
};
