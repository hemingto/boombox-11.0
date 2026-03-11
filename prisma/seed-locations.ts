import { PrismaClient, LocationPageStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CityData {
  slug: string;
  city: string;
  state: string;
  zipCode: string;
  aboutContent: string;
  stats: { value: string; label: string }[];
  nearbyLocationSlugs: string[];
}

const CITIES: CityData[] = [
  {
    slug: 'san-francisco',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    aboutContent:
      "Boombox is San Francisco's trusted mobile storage solution. We deliver sturdy steel storage units directly to your door across the city — from the Marina to the Mission, SoMa to the Sunset. Whether you're downsizing your apartment, renovating your Victorian, or just need extra space, our team handles the heavy lifting so you don't have to. Every item is securely stored in our climate-monitored warehouse and available for return delivery whenever you need it.",
    stats: [
      { value: '1,214+', label: 'Boomboxes stored in San Francisco' },
      { value: '127+', label: 'Five-star reviews from SF customers' },
      { value: '48hr', label: 'Average delivery time in SF' },
    ],
    nearbyLocationSlugs: ['oakland', 'berkeley', 'south-san-francisco'],
  },
  {
    slug: 'oakland',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94612',
    aboutContent:
      'Oakland residents trust Boombox for reliable, affordable mobile storage. From Temescal to Lake Merritt, Rockridge to Jack London Square, we deliver storage units right to your location. Our service is perfect for apartment moves, home staging, or seasonal storage needs. We pick up, store securely in our monitored facility, and deliver back on your schedule.',
    stats: [
      { value: '783+', label: 'Boomboxes stored in Oakland' },
      { value: '98+', label: 'Five-star reviews from Oakland' },
      { value: '244+', label: 'Deliveries completed in Oakland' },
    ],
    nearbyLocationSlugs: ['berkeley', 'san-francisco', 'fremont'],
  },
  {
    slug: 'berkeley',
    city: 'Berkeley',
    state: 'CA',
    zipCode: '94704',
    aboutContent:
      "Boombox serves the Berkeley community with convenient mobile storage that fits the pace of campus life and city living. Whether you're a Cal student heading home for summer, a professor on sabbatical, or a resident making room during a remodel, our storage units are delivered to your door and picked up when you're done packing. Secure, simple, and stress-free.",
    stats: [
      { value: '645+', label: 'Boomboxes stored in Berkeley' },
      { value: '89+', label: 'Five-star reviews from Berkeley' },
      { value: '198+', label: 'Deliveries completed in Berkeley' },
    ],
    nearbyLocationSlugs: ['oakland', 'san-francisco', 'san-mateo'],
  },
  {
    slug: 'san-jose',
    city: 'San Jose',
    state: 'CA',
    zipCode: '95113',
    aboutContent:
      'As the largest city in the Bay Area, San Jose is home to a thriving community that values convenience and reliability. Boombox brings mobile storage directly to neighborhoods across the city — from Willow Glen to Almaden Valley, Downtown to Evergreen. Our steel storage units keep your belongings safe while you focus on what matters most.',
    stats: [
      { value: '892+', label: 'Boomboxes stored in San Jose' },
      { value: '112+', label: 'Five-star reviews from San Jose' },
      { value: '315+', label: 'Deliveries completed in San Jose' },
    ],
    nearbyLocationSlugs: ['santa-clara', 'campbell', 'sunnyvale'],
  },
  {
    slug: 'pacifica',
    city: 'Pacifica',
    state: 'CA',
    zipCode: '94044',
    aboutContent:
      "Pacifica's coastal charm meets modern storage convenience with Boombox. Our mobile storage units are delivered directly to your home along the coast, making it easy to declutter, prepare for a move, or store seasonal items. Enjoy the peace of mind that comes with secure, climate-monitored storage just a short drive from your doorstep.",
    stats: [
      { value: '187+', label: 'Boomboxes stored in Pacifica' },
      { value: '34+', label: 'Five-star reviews from Pacifica' },
      { value: '89+', label: 'Deliveries completed in Pacifica' },
    ],
    nearbyLocationSlugs: ['south-san-francisco', 'san-francisco', 'san-mateo'],
  },
  {
    slug: 'millbrae',
    city: 'Millbrae',
    state: 'CA',
    zipCode: '94030',
    aboutContent:
      'Boombox provides Millbrae residents with hassle-free mobile storage delivered right to your home. Conveniently located near SFO and major transit lines, Millbrae is a popular spot for families and professionals who need flexible storage options. Our units are perfect for home renovations, downsizing, or extra space between moves.',
    stats: [
      { value: '156+', label: 'Boomboxes stored in Millbrae' },
      { value: '28+', label: 'Five-star reviews from Millbrae' },
      { value: '72+', label: 'Deliveries completed in Millbrae' },
    ],
    nearbyLocationSlugs: ['burlingame', 'san-mateo', 'south-san-francisco'],
  },
  {
    slug: 'burlingame',
    city: 'Burlingame',
    state: 'CA',
    zipCode: '94010',
    aboutContent:
      "Burlingame's tree-lined streets and charming downtown deserve a storage solution that matches the neighborhood's character. Boombox delivers mobile storage units to your Burlingame home, making it easy to create extra space without the hassle of driving to a self-storage facility. Store with confidence knowing your items are in a 24/7 monitored warehouse.",
    stats: [
      { value: '203+', label: 'Boomboxes stored in Burlingame' },
      { value: '41+', label: 'Five-star reviews from Burlingame' },
      { value: '95+', label: 'Deliveries completed in Burlingame' },
    ],
    nearbyLocationSlugs: ['san-mateo', 'millbrae', 'belmont'],
  },
  {
    slug: 'san-mateo',
    city: 'San Mateo',
    state: 'CA',
    zipCode: '94401',
    aboutContent:
      "San Mateo sits at the heart of the Peninsula, and Boombox is proud to serve this vibrant community with mobile storage that comes to you. Whether you're in the Hillsdale area, downtown, or near the bridges, our team delivers, picks up, and securely stores your belongings so you can reclaim your space at home.",
    stats: [
      { value: '267+', label: 'Boomboxes stored in San Mateo' },
      { value: '52+', label: 'Five-star reviews from San Mateo' },
      { value: '134+', label: 'Deliveries completed in San Mateo' },
    ],
    nearbyLocationSlugs: ['burlingame', 'belmont', 'redwood-city'],
  },
  {
    slug: 'belmont',
    city: 'Belmont',
    state: 'CA',
    zipCode: '94002',
    aboutContent:
      'Nestled in the hills of the Peninsula, Belmont is a wonderful community that Boombox is proud to serve. Our mobile storage units are delivered to your doorstep, allowing you to pack at your own pace. Perfect for homeowners tackling renovations or families needing seasonal storage solutions.',
    stats: [
      { value: '134+', label: 'Boomboxes stored in Belmont' },
      { value: '23+', label: 'Five-star reviews from Belmont' },
      { value: '67+', label: 'Deliveries completed in Belmont' },
    ],
    nearbyLocationSlugs: ['san-mateo', 'san-carlos', 'redwood-city'],
  },
  {
    slug: 'san-carlos',
    city: 'San Carlos',
    state: 'CA',
    zipCode: '94070',
    aboutContent:
      "San Carlos, known as the 'City of Good Living,' deserves storage that's just as good. Boombox delivers mobile storage units throughout San Carlos so you can clear out the garage, stage your home for sale, or store items during a remodel — all without leaving your neighborhood.",
    stats: [
      { value: '178+', label: 'Boomboxes stored in San Carlos' },
      { value: '31+', label: 'Five-star reviews from San Carlos' },
      { value: '84+', label: 'Deliveries completed in San Carlos' },
    ],
    nearbyLocationSlugs: ['belmont', 'redwood-city', 'menlo-park'],
  },
  {
    slug: 'redwood-city',
    city: 'Redwood City',
    state: 'CA',
    zipCode: '94063',
    aboutContent:
      "Redwood City's motto is 'Climate Best By Government Test,' and Boombox brings the best in mobile storage to match. From downtown to Emerald Hills, our storage units are delivered to your location, securely stored in our monitored facility, and returned whenever you need them.",
    stats: [
      { value: '234+', label: 'Boomboxes stored in Redwood City' },
      { value: '45+', label: 'Five-star reviews from Redwood City' },
      { value: '112+', label: 'Deliveries completed in Redwood City' },
    ],
    nearbyLocationSlugs: ['san-carlos', 'menlo-park', 'palo-alto'],
  },
  {
    slug: 'emerald-hills',
    city: 'Emerald Hills',
    state: 'CA',
    zipCode: '94062',
    aboutContent:
      'Emerald Hills residents enjoy the quiet of hillside living, and Boombox makes sure storage is just as peaceful. Our mobile units are delivered to your home, letting you pack at your own pace before we transport everything to our secure warehouse facility.',
    stats: [
      { value: '67+', label: 'Boomboxes stored in Emerald Hills' },
      { value: '12+', label: 'Five-star reviews from Emerald Hills' },
      { value: '34+', label: 'Deliveries completed in Emerald Hills' },
    ],
    nearbyLocationSlugs: ['redwood-city', 'san-carlos', 'woodside'],
  },
  {
    slug: 'woodside',
    city: 'Woodside',
    state: 'CA',
    zipCode: '94062',
    aboutContent:
      "Woodside's rural beauty and spacious properties pair perfectly with Boombox mobile storage. Whether you're renovating a barn, clearing space for a home project, or simply need extra room, we bring the storage to you and handle the logistics.",
    stats: [
      { value: '54+', label: 'Boomboxes stored in Woodside' },
      { value: '9+', label: 'Five-star reviews from Woodside' },
      { value: '28+', label: 'Deliveries completed in Woodside' },
    ],
    nearbyLocationSlugs: ['redwood-city', 'menlo-park', 'portola-valley'],
  },
  {
    slug: 'atherton',
    city: 'Atherton',
    state: 'CA',
    zipCode: '94027',
    aboutContent:
      'Atherton is one of the most exclusive communities in the Bay Area, and Boombox provides storage service to match. Our professional team delivers mobile storage units to your estate, handles your belongings with care, and stores everything in our 24/7 monitored facility.',
    stats: [
      { value: '89+', label: 'Boomboxes stored in Atherton' },
      { value: '18+', label: 'Five-star reviews from Atherton' },
      { value: '43+', label: 'Deliveries completed in Atherton' },
    ],
    nearbyLocationSlugs: ['menlo-park', 'palo-alto', 'redwood-city'],
  },
  {
    slug: 'menlo-park',
    city: 'Menlo Park',
    state: 'CA',
    zipCode: '94025',
    aboutContent:
      "Home to tech innovators and tree-lined neighborhoods, Menlo Park is a community that values efficiency. Boombox brings that same efficiency to storage with mobile units delivered to your door. Pack on your schedule, and we'll handle the rest — from pickup to secure storage to return delivery.",
    stats: [
      { value: '198+', label: 'Boomboxes stored in Menlo Park' },
      { value: '37+', label: 'Five-star reviews from Menlo Park' },
      { value: '92+', label: 'Deliveries completed in Menlo Park' },
    ],
    nearbyLocationSlugs: ['palo-alto', 'atherton', 'redwood-city'],
  },
  {
    slug: 'palo-alto',
    city: 'Palo Alto',
    state: 'CA',
    zipCode: '94301',
    aboutContent:
      'Palo Alto is the heart of Silicon Valley, and Boombox is the smart storage solution for this innovative community. From Stanford campus to downtown University Avenue, we deliver mobile storage units that let you reclaim space at home without the inconvenience of a traditional storage facility.',
    stats: [
      { value: '456+', label: 'Boomboxes stored in Palo Alto' },
      { value: '78+', label: 'Five-star reviews from Palo Alto' },
      { value: '187+', label: 'Deliveries completed in Palo Alto' },
    ],
    nearbyLocationSlugs: ['menlo-park', 'mountain-view', 'sunnyvale'],
  },
  {
    slug: 'mountain-view',
    city: 'Mountain View',
    state: 'CA',
    zipCode: '94041',
    aboutContent:
      "Mountain View is home to some of the world's most innovative companies, and Boombox brings that same innovation to storage. Our mobile units are delivered to your Mountain View residence, making it easy to store items during a move, declutter your home office, or make space for life's next chapter.",
    stats: [
      { value: '378+', label: 'Boomboxes stored in Mountain View' },
      { value: '64+', label: 'Five-star reviews from Mountain View' },
      { value: '156+', label: 'Deliveries completed in Mountain View' },
    ],
    nearbyLocationSlugs: ['palo-alto', 'sunnyvale', 'santa-clara'],
  },
  {
    slug: 'sunnyvale',
    city: 'Sunnyvale',
    state: 'CA',
    zipCode: '94086',
    aboutContent:
      'Sunnyvale combines suburban comfort with Silicon Valley energy, and Boombox fits right in. Our mobile storage units are delivered to neighborhoods across Sunnyvale, from Heritage District to Lakewood. Perfect for tech professionals relocating, families growing, or anyone who needs more space.',
    stats: [
      { value: '312+', label: 'Boomboxes stored in Sunnyvale' },
      { value: '56+', label: 'Five-star reviews from Sunnyvale' },
      { value: '145+', label: 'Deliveries completed in Sunnyvale' },
    ],
    nearbyLocationSlugs: ['mountain-view', 'santa-clara', 'cupertino'],
  },
  {
    slug: 'santa-clara',
    city: 'Santa Clara',
    state: 'CA',
    zipCode: '95050',
    aboutContent:
      'Santa Clara is where innovation meets community, and Boombox is here to help residents manage their space. Our mobile storage service delivers units to your Santa Clara home, provides secure 24/7 monitored warehouse storage, and returns your items whenever you need them.',
    stats: [
      { value: '267+', label: 'Boomboxes stored in Santa Clara' },
      { value: '48+', label: 'Five-star reviews from Santa Clara' },
      { value: '123+', label: 'Deliveries completed in Santa Clara' },
    ],
    nearbyLocationSlugs: ['sunnyvale', 'san-jose', 'milpitas'],
  },
  {
    slug: 'milpitas',
    city: 'Milpitas',
    state: 'CA',
    zipCode: '95035',
    aboutContent:
      'Milpitas sits at the crossroads of Silicon Valley, and Boombox makes storage convenient for this growing community. Our mobile storage units are delivered directly to your Milpitas home, eliminating the need to drive to a self-storage facility. Secure, easy, and always available when you need your items back.',
    stats: [
      { value: '189+', label: 'Boomboxes stored in Milpitas' },
      { value: '32+', label: 'Five-star reviews from Milpitas' },
      { value: '87+', label: 'Deliveries completed in Milpitas' },
    ],
    nearbyLocationSlugs: ['santa-clara', 'san-jose', 'fremont'],
  },
  {
    slug: 'saratoga',
    city: 'Saratoga',
    state: 'CA',
    zipCode: '95070',
    aboutContent:
      "Saratoga's charming village atmosphere and beautiful foothill homes deserve a storage solution that respects the community. Boombox delivers mobile storage to your Saratoga residence, providing a convenient way to manage space during renovations, moves, or seasonal transitions.",
    stats: [
      { value: '123+', label: 'Boomboxes stored in Saratoga' },
      { value: '21+', label: 'Five-star reviews from Saratoga' },
      { value: '56+', label: 'Deliveries completed in Saratoga' },
    ],
    nearbyLocationSlugs: ['los-gatos', 'cupertino', 'campbell'],
  },
  {
    slug: 'los-gatos',
    city: 'Los Gatos',
    state: 'CA',
    zipCode: '95030',
    aboutContent:
      "Los Gatos blends small-town charm with Silicon Valley sophistication, and Boombox is the perfect storage partner for this community. Whether you live near downtown or in the surrounding hills, our mobile units are delivered to you. Pack at your own pace, and we'll store everything securely until you need it.",
    stats: [
      { value: '145+', label: 'Boomboxes stored in Los Gatos' },
      { value: '26+', label: 'Five-star reviews from Los Gatos' },
      { value: '67+', label: 'Deliveries completed in Los Gatos' },
    ],
    nearbyLocationSlugs: ['saratoga', 'campbell', 'cupertino'],
  },
  {
    slug: 'cupertino',
    city: 'Cupertino',
    state: 'CA',
    zipCode: '95014',
    aboutContent:
      'Cupertino is known for world-class innovation, and Boombox brings an innovative approach to storage. Our mobile units are delivered to homes across Cupertino, from De Anza to Rancho Rinconada. Perfect for families needing extra space, professionals between moves, or anyone who wants clutter-free living.',
    stats: [
      { value: '234+', label: 'Boomboxes stored in Cupertino' },
      { value: '42+', label: 'Five-star reviews from Cupertino' },
      { value: '98+', label: 'Deliveries completed in Cupertino' },
    ],
    nearbyLocationSlugs: ['sunnyvale', 'saratoga', 'los-gatos'],
  },
  {
    slug: 'portola-valley',
    city: 'Portola Valley',
    state: 'CA',
    zipCode: '94028',
    aboutContent:
      "Portola Valley's natural beauty and spacious properties make it a special place to call home. Boombox complements this lifestyle with mobile storage that comes to you — no need to leave your peaceful surroundings. Store seasonal items, clear space for a project, or prepare for a move with ease.",
    stats: [
      { value: '43+', label: 'Boomboxes stored in Portola Valley' },
      { value: '8+', label: 'Five-star reviews from Portola Valley' },
      { value: '21+', label: 'Deliveries completed in Portola Valley' },
    ],
    nearbyLocationSlugs: ['woodside', 'menlo-park', 'palo-alto'],
  },
  {
    slug: 'fremont',
    city: 'Fremont',
    state: 'CA',
    zipCode: '94536',
    aboutContent:
      'Fremont is one of the most diverse and family-friendly cities in the Bay Area, and Boombox is proud to serve this community. From Niles to Mission San Jose, Warm Springs to Irvington, we deliver mobile storage units to your neighborhood and store your belongings in our secure, monitored facility.',
    stats: [
      { value: '356+', label: 'Boomboxes stored in Fremont' },
      { value: '61+', label: 'Five-star reviews from Fremont' },
      { value: '167+', label: 'Deliveries completed in Fremont' },
    ],
    nearbyLocationSlugs: ['newark', 'union-city', 'milpitas'],
  },
  {
    slug: 'newark',
    city: 'Newark',
    state: 'CA',
    zipCode: '94560',
    aboutContent:
      'Newark offers a tight-knit community feel with easy access to the entire Bay Area, and Boombox makes storage simple for Newark residents. Our mobile units are delivered to your door, letting you pack at your convenience before we transport everything to our secure warehouse.',
    stats: [
      { value: '98+', label: 'Boomboxes stored in Newark' },
      { value: '17+', label: 'Five-star reviews from Newark' },
      { value: '45+', label: 'Deliveries completed in Newark' },
    ],
    nearbyLocationSlugs: ['fremont', 'union-city', 'milpitas'],
  },
  {
    slug: 'union-city',
    city: 'Union City',
    state: 'CA',
    zipCode: '94587',
    aboutContent:
      'Union City bridges the East Bay and South Bay, and Boombox bridges the gap between needing storage and having it delivered to your door. Our mobile storage service is perfect for Union City residents who want convenient, secure storage without the hassle of a traditional self-storage facility.',
    stats: [
      { value: '112+', label: 'Boomboxes stored in Union City' },
      { value: '19+', label: 'Five-star reviews from Union City' },
      { value: '54+', label: 'Deliveries completed in Union City' },
    ],
    nearbyLocationSlugs: ['fremont', 'newark', 'oakland'],
  },
  {
    slug: 'campbell',
    city: 'Campbell',
    state: 'CA',
    zipCode: '95008',
    aboutContent:
      "Campbell's walkable downtown and family-friendly neighborhoods make it one of the most livable cities in the South Bay. Boombox adds to that quality of life with mobile storage delivered to your Campbell home. Free up your garage, prepare for a move, or store items during a renovation — we handle it all.",
    stats: [
      { value: '167+', label: 'Boomboxes stored in Campbell' },
      { value: '29+', label: 'Five-star reviews from Campbell' },
      { value: '78+', label: 'Deliveries completed in Campbell' },
    ],
    nearbyLocationSlugs: ['san-jose', 'los-gatos', 'saratoga'],
  },
  {
    slug: 'south-san-francisco',
    city: 'South San Francisco',
    state: 'CA',
    zipCode: '94080',
    aboutContent:
      "Known as 'The Industrial City,' South San Francisco has evolved into a thriving biotech hub with great neighborhoods. Boombox serves SSF residents with mobile storage units delivered to your home. Whether you're in the Westborough area, Sign Hill, or downtown, secure storage is just a booking away.",
    stats: [
      { value: '198+', label: 'Boomboxes stored in South SF' },
      { value: '35+', label: 'Five-star reviews from South SF' },
      { value: '89+', label: 'Deliveries completed in South SF' },
    ],
    nearbyLocationSlugs: ['san-francisco', 'pacifica', 'millbrae'],
  },
];

async function main() {
  console.log('Seeding location pages...');

  for (const cityData of CITIES) {
    const existing = await prisma.locationPage.findUnique({
      where: { slug: cityData.slug },
    });

    if (existing) {
      console.log(`  Skipping ${cityData.city} (already exists)`);
      continue;
    }

    await prisma.locationPage.create({
      data: {
        slug: cityData.slug,
        city: cityData.city,
        state: cityData.state,
        zipCode: cityData.zipCode,
        heroImageUrl: `/locations/${cityData.slug}.png`,
        heroImageAlt: `Boombox mobile storage in ${cityData.city}`,
        aboutContent: cityData.aboutContent,
        stats: cityData.stats,
        nearbyLocationSlugs: cityData.nearbyLocationSlugs,
        metaTitle: null,
        metaDescription: null,
        ogImageUrl: null,
        status: LocationPageStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    console.log(`  Created: ${cityData.city}`);
  }

  console.log(`\nDone! Seeded ${CITIES.length} location pages.`);
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
