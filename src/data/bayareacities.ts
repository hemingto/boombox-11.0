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
  { city: "Alameda", county: "Alameda", link: "/alameda" },
  { city: "Albany", county: "Alameda", link: "/albany" },
  { city: "Berkeley", county: "Alameda", link: "/berkeley" },
  { city: "Dublin", county: "Alameda", link: "/dublin" },
  { city: "Emeryville", county: "Alameda", link: "/emeryville" },
  { city: "Fremont", county: "Alameda", link: "/fremont" },
  { city: "Hayward", county: "Alameda", link: "/hayward" },
  { city: "Livermore", county: "Alameda", link: "/livermore" },
  { city: "Newark", county: "Alameda", link: "/newark" },
  { city: "Oakland", county: "Alameda", link: "/oakland" },
  { city: "Piedmont", county: "Alameda", link: "/piedmont" },
  { city: "Pleasanton", county: "Alameda", link: "/pleasanton" },
  { city: "San Leandro", county: "Alameda", link: "/san-leandro" },
  { city: "Union City", county: "Alameda", link: "/union-city" },

  // Contra Costa County
  { city: "Antioch", county: "Contra Costa", link: "/antioch" },
  { city: "Brentwood", county: "Contra Costa", link: "/brentwood" },
  { city: "Clayton", county: "Contra Costa", link: "/clayton" },
  { city: "Concord", county: "Contra Costa", link: "/concord" },
  { city: "Danville", county: "Contra Costa", link: "/danville" },
  { city: "El Cerrito", county: "Contra Costa", link: "/el-cerrito" },
  { city: "Hercules", county: "Contra Costa", link: "/hercules" },
  { city: "Lafayette", county: "Contra Costa", link: "/lafayette" },
  { city: "Martinez", county: "Contra Costa", link: "/martinez" },
  { city: "Moraga", county: "Contra Costa", link: "/moraga" },
  { city: "Oakley", county: "Contra Costa", link: "/oakley" },
  { city: "Orinda", county: "Contra Costa", link: "/orinda" },
  { city: "Pinole", county: "Contra Costa", link: "/pinole" },
  { city: "Pittsburg", county: "Contra Costa", link: "/pittsburg" },
  { city: "Pleasant Hill", county: "Contra Costa", link: "/pleasant-hill" },
  { city: "Richmond", county: "Contra Costa", link: "/richmond" },
  { city: "San Pablo", county: "Contra Costa", link: "/san-pablo" },
  { city: "San Ramon", county: "Contra Costa", link: "/san-ramon" },
  { city: "Walnut Creek", county: "Contra Costa", link: "/walnut-creek" },

  // Marin County
  { city: "Belvedere", county: "Marin", link: "/belvedere" },
  { city: "Corte Madera", county: "Marin", link: "/corte-madera" },
  { city: "Fairfax", county: "Marin", link: "/fairfax" },
  { city: "Larkspur", county: "Marin", link: "/larkspur" },
  { city: "Mill Valley", county: "Marin", link: "/mill-valley" },
  { city: "Novato", county: "Marin", link: "/novato" },
  { city: "Ross", county: "Marin", link: "/ross" },
  { city: "San Anselmo", county: "Marin", link: "/san-anselmo" },
  { city: "San Rafael", county: "Marin", link: "/san-rafael" },
  { city: "Sausalito", county: "Marin", link: "/sausalito" },
  { city: "Tiburon", county: "Marin", link: "/tiburon" },

  // Napa County
  { city: "American Canyon", county: "Napa", link: "/american-canyon" },
  { city: "Calistoga", county: "Napa", link: "/calistoga" },
  { city: "Napa", county: "Napa", link: "/napa" },
  { city: "St. Helena", county: "Napa", link: "/st-helena" },
  { city: "Yountville", county: "Napa", link: "/yountville" },

  // San Francisco County
  { city: "San Francisco", county: "San Francisco", link: "/san-francisco" },

  // San Mateo County
  { city: "Atherton", county: "San Mateo", link: "/atherton" },
  { city: "Belmont", county: "San Mateo", link: "/belmont" },
  { city: "Brisbane", county: "San Mateo", link: "/brisbane" },
  { city: "Burlingame", county: "San Mateo", link: "/burlingame" },
  { city: "Colma", county: "San Mateo", link: "/colma" },
  { city: "Daly City", county: "San Mateo", link: "/daly-city" },
  { city: "East Palo Alto", county: "San Mateo", link: "/east-palo-alto" },
  { city: "Foster City", county: "San Mateo", link: "/foster-city" },
  { city: "Half Moon Bay", county: "San Mateo", link: "/half-moon-bay" },
  { city: "Hillsborough", county: "San Mateo", link: "/hillsborough" },
  { city: "Menlo Park", county: "San Mateo", link: "/menlo-park" },
  { city: "Millbrae", county: "San Mateo", link: "/millbrae" },
  { city: "Pacifica", county: "San Mateo", link: "/pacifica" },
  { city: "Portola Valley", county: "San Mateo", link: "/portola-valley" },
  { city: "Redwood City", county: "San Mateo", link: "/redwood-city" },
  { city: "San Bruno", county: "San Mateo", link: "/san-bruno" },
  { city: "San Carlos", county: "San Mateo", link: "/san-carlos" },
  { city: "San Mateo", county: "San Mateo", link: "/san-mateo" },
  { city: "South San Francisco", county: "San Mateo", link: "/south-san-francisco" },
  { city: "Woodside", county: "San Mateo", link: "/woodside" },

  // Santa Clara County
  { city: "Campbell", county: "Santa Clara", link: "/campbell" },
  { city: "Cupertino", county: "Santa Clara", link: "/cupertino" },
  { city: "Gilroy", county: "Santa Clara", link: "/gilroy" },
  { city: "Los Altos", county: "Santa Clara", link: "/los-altos" },
  { city: "Los Altos Hills", county: "Santa Clara", link: "/los-altos-hills" },
  { city: "Los Gatos", county: "Santa Clara", link: "/los-gatos" },
  { city: "Milpitas", county: "Santa Clara", link: "/milpitas" },
  { city: "Monte Sereno", county: "Santa Clara", link: "/monte-sereno" },
  { city: "Morgan Hill", county: "Santa Clara", link: "/morgan-hill" },
  { city: "Mountain View", county: "Santa Clara", link: "/mountain-view" },
  { city: "Palo Alto", county: "Santa Clara", link: "/palo-alto" },
  { city: "San Jose", county: "Santa Clara", link: "/san-jose" },
  { city: "Santa Clara", county: "Santa Clara", link: "/santa-clara" },
  { city: "Saratoga", county: "Santa Clara", link: "/saratoga" },
  { city: "Sunnyvale", county: "Santa Clara", link: "/sunnyvale" },

  // Solano County
  { city: "Benicia", county: "Solano", link: "/benicia" },
  { city: "Dixon", county: "Solano", link: "/dixon" },
  { city: "Fairfield", county: "Solano", link: "/fairfield" },
  { city: "Rio Vista", county: "Solano", link: "/rio-vista" },
  { city: "Suisun City", county: "Solano", link: "/suisun-city" },
  { city: "Vacaville", county: "Solano", link: "/vacaville" },
  { city: "Vallejo", county: "Solano", link: "/vallejo" },

  // Sonoma County
  { city: "Cloverdale", county: "Sonoma", link: "/cloverdale" },
  { city: "Cotati", county: "Sonoma", link: "/cotati" },
  { city: "Healdsburg", county: "Sonoma", link: "/healdsburg" },
  { city: "Petaluma", county: "Sonoma", link: "/petaluma" },
  { city: "Rohnert Park", county: "Sonoma", link: "/rohnert-park" },
  { city: "Santa Rosa", county: "Sonoma", link: "/santa-rosa" },
  { city: "Sebastopol", county: "Sonoma", link: "/sebastopol" },
  { city: "Sonoma", county: "Sonoma", link: "/sonoma" },
  { city: "Windsor", county: "Sonoma", link: "/windsor" }
];

