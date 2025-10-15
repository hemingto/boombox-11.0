/**
 * @fileoverview Location-related type definitions
 * @source Extracted from LocationsPopover component for better type safety
 */

export interface ServiceLocation {
  /** Display name for the location */
  name: string;
  /** URL path for the location page */
  href: string;
  /** City name for SEO and routing */
  city: string;
  /** Optional state abbreviation */
  state?: string;
  /** Optional zip code for the primary area */
  zipCode?: string;
}

export interface LocationsData {
  /** List of all served locations */
  cities: ServiceLocation[];
  /** Default location for fallback */
  defaultLocation?: ServiceLocation;
}
