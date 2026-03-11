import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEARBY_MAP: Record<string, string[]> = {
  'san-francisco': [
    'oakland',
    'berkeley',
    'south-san-francisco',
    'pacifica',
    'san-mateo',
    'burlingame',
  ],
  oakland: [
    'berkeley',
    'san-francisco',
    'fremont',
    'union-city',
    'newark',
    'san-mateo',
  ],
  berkeley: [
    'oakland',
    'san-francisco',
    'fremont',
    'union-city',
    'san-mateo',
    'south-san-francisco',
  ],
  'san-jose': [
    'santa-clara',
    'campbell',
    'sunnyvale',
    'milpitas',
    'cupertino',
    'los-gatos',
  ],
  pacifica: [
    'south-san-francisco',
    'san-francisco',
    'san-mateo',
    'millbrae',
    'burlingame',
    'belmont',
  ],
  millbrae: [
    'burlingame',
    'san-mateo',
    'south-san-francisco',
    'san-francisco',
    'belmont',
    'pacifica',
  ],
  burlingame: [
    'san-mateo',
    'millbrae',
    'belmont',
    'south-san-francisco',
    'san-carlos',
    'redwood-city',
  ],
  'san-mateo': [
    'burlingame',
    'belmont',
    'redwood-city',
    'san-carlos',
    'millbrae',
    'south-san-francisco',
  ],
  belmont: [
    'san-mateo',
    'san-carlos',
    'redwood-city',
    'burlingame',
    'menlo-park',
    'millbrae',
  ],
  'san-carlos': [
    'belmont',
    'redwood-city',
    'menlo-park',
    'san-mateo',
    'palo-alto',
    'burlingame',
  ],
  'redwood-city': [
    'san-carlos',
    'menlo-park',
    'palo-alto',
    'belmont',
    'woodside',
    'atherton',
  ],
  'emerald-hills': [
    'redwood-city',
    'san-carlos',
    'woodside',
    'belmont',
    'menlo-park',
    'palo-alto',
  ],
  woodside: [
    'redwood-city',
    'menlo-park',
    'portola-valley',
    'palo-alto',
    'atherton',
    'san-carlos',
  ],
  atherton: [
    'menlo-park',
    'palo-alto',
    'redwood-city',
    'woodside',
    'san-carlos',
    'portola-valley',
  ],
  'menlo-park': [
    'palo-alto',
    'atherton',
    'redwood-city',
    'san-carlos',
    'woodside',
    'mountain-view',
  ],
  'palo-alto': [
    'menlo-park',
    'mountain-view',
    'sunnyvale',
    'atherton',
    'redwood-city',
    'portola-valley',
  ],
  'mountain-view': [
    'palo-alto',
    'sunnyvale',
    'santa-clara',
    'cupertino',
    'menlo-park',
    'milpitas',
  ],
  sunnyvale: [
    'mountain-view',
    'santa-clara',
    'cupertino',
    'palo-alto',
    'milpitas',
    'san-jose',
  ],
  'santa-clara': [
    'sunnyvale',
    'san-jose',
    'milpitas',
    'mountain-view',
    'cupertino',
    'campbell',
  ],
  milpitas: [
    'santa-clara',
    'san-jose',
    'fremont',
    'sunnyvale',
    'newark',
    'union-city',
  ],
  saratoga: [
    'los-gatos',
    'cupertino',
    'campbell',
    'san-jose',
    'sunnyvale',
    'santa-clara',
  ],
  'los-gatos': [
    'saratoga',
    'campbell',
    'cupertino',
    'san-jose',
    'santa-clara',
    'sunnyvale',
  ],
  cupertino: [
    'sunnyvale',
    'saratoga',
    'los-gatos',
    'santa-clara',
    'mountain-view',
    'campbell',
  ],
  'portola-valley': [
    'woodside',
    'menlo-park',
    'palo-alto',
    'atherton',
    'redwood-city',
    'mountain-view',
  ],
  fremont: [
    'newark',
    'union-city',
    'milpitas',
    'oakland',
    'san-jose',
    'santa-clara',
  ],
  newark: [
    'fremont',
    'union-city',
    'milpitas',
    'oakland',
    'san-jose',
    'santa-clara',
  ],
  'union-city': [
    'fremont',
    'newark',
    'oakland',
    'milpitas',
    'berkeley',
    'san-jose',
  ],
  campbell: [
    'san-jose',
    'los-gatos',
    'saratoga',
    'cupertino',
    'santa-clara',
    'sunnyvale',
  ],
  'south-san-francisco': [
    'san-francisco',
    'pacifica',
    'millbrae',
    'burlingame',
    'san-mateo',
    'oakland',
  ],
};

async function main() {
  console.log('Updating nearby location slugs to 6 per city...');

  for (const [slug, nearbySlugs] of Object.entries(NEARBY_MAP)) {
    await prisma.locationPage.update({
      where: { slug },
      data: { nearbyLocationSlugs: nearbySlugs },
    });
    console.log(`  Updated: ${slug} (${nearbySlugs.length} nearby)`);
  }

  console.log('\nDone!');
}

main()
  .catch(e => {
    console.error('Update failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
