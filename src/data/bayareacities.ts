/**
 * @fileoverview Bay Area cities data for location services
 * @source boombox-10.0/src/app/data/bayareacities.tsx
 *
 * DATA STRUCTURE:
 * List of cities in the San Francisco Bay Area organized by county.
 * Each city includes city name, county, and link slug for location pages.
 *
 * COUNTIES COVERED:
 * - Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo,
 *   Santa Clara, Solano, Sonoma
 *
 * @refactor Converted from .tsx to .ts (data-only file)
 */

export interface BayAreaCity {
  city: string;
  county: string;
  link: string;
}

export const bayAreaCities: BayAreaCity[] = [
  // Alameda County
  { city: 'Alameda', county: 'Alameda', link: '/locations/alameda' },
  { city: 'Albany', county: 'Alameda', link: '/locations/albany' },
  { city: 'Berkeley', county: 'Alameda', link: '/locations/berkeley' },
  { city: 'Dublin', county: 'Alameda', link: '/locations/dublin' },
  { city: 'Emeryville', county: 'Alameda', link: '/locations/emeryville' },
  { city: 'Fremont', county: 'Alameda', link: '/locations/fremont' },
  { city: 'Hayward', county: 'Alameda', link: '/locations/hayward' },
  { city: 'Livermore', county: 'Alameda', link: '/locations/livermore' },
  { city: 'Newark', county: 'Alameda', link: '/locations/newark' },
  { city: 'Oakland', county: 'Alameda', link: '/locations/oakland' },
  { city: 'Piedmont', county: 'Alameda', link: '/locations/piedmont' },
  { city: 'Pleasanton', county: 'Alameda', link: '/locations/pleasanton' },
  { city: 'San Leandro', county: 'Alameda', link: '/locations/san-leandro' },
  { city: 'Union City', county: 'Alameda', link: '/locations/union-city' },

  // Contra Costa County
  { city: 'Antioch', county: 'Contra Costa', link: '/locations/antioch' },
  { city: 'Brentwood', county: 'Contra Costa', link: '/locations/brentwood' },
  { city: 'Clayton', county: 'Contra Costa', link: '/locations/clayton' },
  { city: 'Concord', county: 'Contra Costa', link: '/locations/concord' },
  { city: 'Danville', county: 'Contra Costa', link: '/locations/danville' },
  { city: 'El Cerrito', county: 'Contra Costa', link: '/locations/el-cerrito' },
  { city: 'Hercules', county: 'Contra Costa', link: '/locations/hercules' },
  { city: 'Lafayette', county: 'Contra Costa', link: '/locations/lafayette' },
  { city: 'Martinez', county: 'Contra Costa', link: '/locations/martinez' },
  { city: 'Moraga', county: 'Contra Costa', link: '/locations/moraga' },
  { city: 'Oakley', county: 'Contra Costa', link: '/locations/oakley' },
  { city: 'Orinda', county: 'Contra Costa', link: '/locations/orinda' },
  { city: 'Pinole', county: 'Contra Costa', link: '/locations/pinole' },
  { city: 'Pittsburg', county: 'Contra Costa', link: '/locations/pittsburg' },
  {
    city: 'Pleasant Hill',
    county: 'Contra Costa',
    link: '/locations/pleasant-hill',
  },
  { city: 'Richmond', county: 'Contra Costa', link: '/locations/richmond' },
  { city: 'San Pablo', county: 'Contra Costa', link: '/locations/san-pablo' },
  { city: 'San Ramon', county: 'Contra Costa', link: '/locations/san-ramon' },
  {
    city: 'Walnut Creek',
    county: 'Contra Costa',
    link: '/locations/walnut-creek',
  },

  // Marin County
  { city: 'Belvedere', county: 'Marin', link: '/locations/belvedere' },
  { city: 'Corte Madera', county: 'Marin', link: '/locations/corte-madera' },
  { city: 'Fairfax', county: 'Marin', link: '/locations/fairfax' },
  { city: 'Larkspur', county: 'Marin', link: '/locations/larkspur' },
  { city: 'Mill Valley', county: 'Marin', link: '/locations/mill-valley' },
  { city: 'Novato', county: 'Marin', link: '/locations/novato' },
  { city: 'Ross', county: 'Marin', link: '/locations/ross' },
  { city: 'San Anselmo', county: 'Marin', link: '/locations/san-anselmo' },
  { city: 'San Rafael', county: 'Marin', link: '/locations/san-rafael' },
  { city: 'Sausalito', county: 'Marin', link: '/locations/sausalito' },
  { city: 'Tiburon', county: 'Marin', link: '/locations/tiburon' },

  // Napa County
  {
    city: 'American Canyon',
    county: 'Napa',
    link: '/locations/american-canyon',
  },
  { city: 'Calistoga', county: 'Napa', link: '/locations/calistoga' },
  { city: 'Napa', county: 'Napa', link: '/locations/napa' },
  { city: 'St. Helena', county: 'Napa', link: '/locations/st-helena' },
  { city: 'Yountville', county: 'Napa', link: '/locations/yountville' },

  // San Francisco County
  {
    city: 'San Francisco',
    county: 'San Francisco',
    link: '/locations/san-francisco',
  },

  // San Mateo County
  { city: 'Atherton', county: 'San Mateo', link: '/locations/atherton' },
  { city: 'Belmont', county: 'San Mateo', link: '/locations/belmont' },
  { city: 'Brisbane', county: 'San Mateo', link: '/locations/brisbane' },
  { city: 'Burlingame', county: 'San Mateo', link: '/locations/burlingame' },
  { city: 'Colma', county: 'San Mateo', link: '/locations/colma' },
  { city: 'Daly City', county: 'San Mateo', link: '/locations/daly-city' },
  {
    city: 'East Palo Alto',
    county: 'San Mateo',
    link: '/locations/east-palo-alto',
  },
  { city: 'Foster City', county: 'San Mateo', link: '/locations/foster-city' },
  {
    city: 'Half Moon Bay',
    county: 'San Mateo',
    link: '/locations/half-moon-bay',
  },
  {
    city: 'Hillsborough',
    county: 'San Mateo',
    link: '/locations/hillsborough',
  },
  { city: 'Menlo Park', county: 'San Mateo', link: '/locations/menlo-park' },
  { city: 'Millbrae', county: 'San Mateo', link: '/locations/millbrae' },
  { city: 'Pacifica', county: 'San Mateo', link: '/locations/pacifica' },
  {
    city: 'Portola Valley',
    county: 'San Mateo',
    link: '/locations/portola-valley',
  },
  {
    city: 'Redwood City',
    county: 'San Mateo',
    link: '/locations/redwood-city',
  },
  { city: 'San Bruno', county: 'San Mateo', link: '/locations/san-bruno' },
  { city: 'San Carlos', county: 'San Mateo', link: '/locations/san-carlos' },
  { city: 'San Mateo', county: 'San Mateo', link: '/locations/san-mateo' },
  {
    city: 'South San Francisco',
    county: 'San Mateo',
    link: '/locations/south-san-francisco',
  },
  { city: 'Woodside', county: 'San Mateo', link: '/locations/woodside' },

  // Santa Clara County
  { city: 'Campbell', county: 'Santa Clara', link: '/locations/campbell' },
  { city: 'Cupertino', county: 'Santa Clara', link: '/locations/cupertino' },
  { city: 'Gilroy', county: 'Santa Clara', link: '/locations/gilroy' },
  { city: 'Los Altos', county: 'Santa Clara', link: '/locations/los-altos' },
  {
    city: 'Los Altos Hills',
    county: 'Santa Clara',
    link: '/locations/los-altos-hills',
  },
  { city: 'Los Gatos', county: 'Santa Clara', link: '/locations/los-gatos' },
  { city: 'Milpitas', county: 'Santa Clara', link: '/locations/milpitas' },
  {
    city: 'Monte Sereno',
    county: 'Santa Clara',
    link: '/locations/monte-sereno',
  },
  {
    city: 'Morgan Hill',
    county: 'Santa Clara',
    link: '/locations/morgan-hill',
  },
  {
    city: 'Mountain View',
    county: 'Santa Clara',
    link: '/locations/mountain-view',
  },
  { city: 'Palo Alto', county: 'Santa Clara', link: '/locations/palo-alto' },
  { city: 'San Jose', county: 'Santa Clara', link: '/locations/san-jose' },
  {
    city: 'Santa Clara',
    county: 'Santa Clara',
    link: '/locations/santa-clara',
  },
  { city: 'Saratoga', county: 'Santa Clara', link: '/locations/saratoga' },
  { city: 'Sunnyvale', county: 'Santa Clara', link: '/locations/sunnyvale' },

  // Solano County
  { city: 'Benicia', county: 'Solano', link: '/locations/benicia' },
  { city: 'Dixon', county: 'Solano', link: '/locations/dixon' },
  { city: 'Fairfield', county: 'Solano', link: '/locations/fairfield' },
  { city: 'Rio Vista', county: 'Solano', link: '/locations/rio-vista' },
  { city: 'Suisun City', county: 'Solano', link: '/locations/suisun-city' },
  { city: 'Vacaville', county: 'Solano', link: '/locations/vacaville' },
  { city: 'Vallejo', county: 'Solano', link: '/locations/vallejo' },

  // Sonoma County
  { city: 'Cloverdale', county: 'Sonoma', link: '/locations/cloverdale' },
  { city: 'Cotati', county: 'Sonoma', link: '/locations/cotati' },
  { city: 'Healdsburg', county: 'Sonoma', link: '/locations/healdsburg' },
  { city: 'Petaluma', county: 'Sonoma', link: '/locations/petaluma' },
  { city: 'Rohnert Park', county: 'Sonoma', link: '/locations/rohnert-park' },
  { city: 'Santa Rosa', county: 'Sonoma', link: '/locations/santa-rosa' },
  { city: 'Sebastopol', county: 'Sonoma', link: '/locations/sebastopol' },
  { city: 'Sonoma', county: 'Sonoma', link: '/locations/sonoma' },
  { city: 'Windsor', county: 'Sonoma', link: '/locations/windsor' },
];
