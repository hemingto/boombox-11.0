import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ABOUT_CONTENT_TWO: Record<string, string> = {
  'san-francisco':
    'From studio apartments in Nob Hill to family homes in the Outer Richmond, San Franciscans are discovering a smarter way to store. Boombox eliminates the need to rent a car, drive across town, and wrestle with a storage unit lock. We bring the unit to you, wait while you load it, and transport everything to our secure facility. When you need something back — a winter coat, holiday decorations, that surfboard — we deliver it right back to your door, usually within 48 hours.',

  oakland:
    "Oakland's neighborhoods are as diverse as its residents, and Boombox adapts to every situation. Whether you're a renter in a compact Temescal apartment or a homeowner in the Oakland Hills, our mobile storage fits your life. No long-term contracts, no surprise fees, and no trips across town to access your stuff. We've built our service around the way Oakland actually lives — flexible, community-minded, and always moving forward.",

  berkeley:
    "With limited parking and dense housing, traditional self-storage can be a real challenge in Berkeley. Boombox solves that by bringing storage to you. Our team navigates Berkeley's unique streets and delivers sturdy steel units right to your curb. Students love us for summer storage, and long-time residents rely on us during renovations and downsizing. Every item is inventoried, photographed, and stored in our climate-monitored warehouse until you're ready for it.",

  'san-jose':
    "San Jose's sprawling neighborhoods mean that a self-storage facility is never exactly close to home. Boombox changes that equation entirely. Our mobile storage units arrive at your door on your schedule, and our team can even help with loading. Whether you're in a Willow Glen bungalow or an Evergreen townhome, you get the same white-glove experience. Flexible month-to-month plans mean you only pay for the storage you actually need.",

  pacifica:
    'Living along the coast means dealing with salt air, fog, and moisture — none of which are great for your belongings. Boombox stores your items in a climate-monitored inland facility, keeping everything safe from the coastal elements. Our team handles the drive so you can stay in Pacifica enjoying the views. From surfboards to seasonal furniture, we store it all and bring it back whenever you need it.',

  millbrae:
    "Millbrae's proximity to SFO makes it a hub for frequent travelers and relocating professionals. Boombox is the perfect partner for that lifestyle — store your excess belongings while you're abroad, and we'll have everything ready when you return. Our flexible scheduling works around your travel plans, and our month-to-month pricing means you're never locked into a contract that doesn't fit your life.",

  burlingame:
    "Burlingame homeowners know that space comes at a premium on the Peninsula. Boombox helps you make the most of every square foot by providing secure off-site storage that feels like an extension of your home. Need your holiday decorations in December? Your patio furniture in spring? Just request a delivery through our app and we'll have it at your door. It's storage that works the way you actually live.",

  'san-mateo':
    "San Mateo's central Peninsula location means you're always close to everything — except affordable storage space. Boombox fills that gap with mobile units delivered to your home and stored in our secure facility nearby. Our transparent pricing, easy online scheduling, and reliable two-day delivery windows make managing your storage as simple as ordering anything else online.",

  belmont:
    "Belmont's hillside homes often have unique storage challenges — limited garages, steep driveways, and tight spaces. Boombox's experienced team knows how to work with these constraints. We deliver right to your property, help you figure out the best loading approach, and handle all the heavy lifting. Your belongings are then transported to our flat, secure warehouse where they stay safe and accessible.",

  'san-carlos':
    "San Carlos families know that life moves fast — kids outgrow sports equipment, home offices expand, and seasonal items pile up. Boombox gives you a flexible solution that grows and shrinks with your needs. Store a single unit or several, adjust month to month, and request deliveries whenever life changes direction. It's the kind of practical, no-nonsense service that San Carlos residents appreciate.",

  'redwood-city':
    "Redwood City is experiencing a renaissance, with new housing and businesses transforming the downtown core. Whether you're moving into one of those new condos or renovating a classic bungalow, Boombox mobile storage makes the transition smoother. We handle the logistics of storing your belongings while contractors work, and deliver everything back once the dust settles. No storage unit keys to manage, no facility hours to work around.",

  'emerald-hills':
    "Living in Emerald Hills means enjoying some of the most beautiful views on the Peninsula. Boombox helps you keep your home as beautiful as the surroundings by storing items you don't need every day. Our team is experienced with hillside deliveries and understands the unique access considerations of the area. Secure, professional, and always on your schedule.",

  woodside:
    "Woodside properties often have room to spare, but that doesn't mean you want to fill every barn and garage with stored items. Boombox provides a professional off-site alternative, keeping your property clean and organized while your belongings are safely stored in our monitored facility. From antique furniture to seasonal equipment, we handle everything with the care that Woodside residents expect.",

  atherton:
    'Atherton homeowners expect premium service, and Boombox delivers exactly that. Our white-glove team handles your belongings with meticulous care, from fine furniture to delicate artwork. Every item is catalogued and stored in our secure, climate-monitored facility. When you need something back — for a dinner party, a seasonal refresh, or a family event — we deliver it to your estate on your timeline.',

  'menlo-park':
    "Menlo Park's blend of residential charm and tech-industry energy creates a unique storage demand. Professionals moving between opportunities, families upgrading homes, and remote workers reclaiming office space all turn to Boombox. Our service integrates seamlessly into busy schedules — book online, pack at your pace, and let us handle the rest. Storage shouldn't be another errand on your to-do list.",

  'palo-alto':
    "In a city where square footage comes at a premium, Boombox effectively gives you more space at a fraction of the cost. Stanford students use us for summer and gap-year storage. Homeowners rely on us during kitchen remodels and garage cleanouts. And Palo Alto's many entrepreneurs store business inventory and equipment between office moves. Whatever your reason, our secure facility and reliable delivery make storage effortless.",

  'mountain-view':
    "Mountain View residents live at the intersection of innovation and community, and Boombox reflects both values. Our technology-driven scheduling and inventory system makes managing your stored items intuitive, while our local team provides the personal, hands-on service you'd expect from a neighborhood business. From Castro Street condos to Cuesta Park family homes, we're here to help you live with more space and less stress.",

  sunnyvale:
    "Sunnyvale's mix of tech campuses and residential neighborhoods means people are always on the move — new jobs, growing families, home upgrades. Boombox is built for exactly these transitions. Our month-to-month storage adapts to your life, not the other way around. And with our item-level tracking, you always know exactly what's in storage and can request specific pieces back anytime.",

  'santa-clara':
    "Santa Clara sits at the heart of Silicon Valley's innovation corridor, and Boombox brings that same forward-thinking approach to storage. No more wasting weekends driving to a storage facility and digging through a dark unit. We deliver, store, and return your belongings on demand. Our online dashboard gives you full visibility into what's stored, and our team is just a message away.",

  milpitas:
    "Milpitas is growing fast, with new housing developments and a thriving community. Boombox grows with you — whether you need storage during a move into your first home, between apartments, or while renovating. Our flexible plans mean no wasted money on space you don't need, and our delivery service means no wasted time driving to a storage lot across town.",

  saratoga:
    "Saratoga residents value quality, craftsmanship, and attention to detail — and that's exactly what Boombox delivers. Our storage units are built from heavy-gauge steel to protect your belongings, and our warehouse features 24/7 monitoring and climate management. Whether you're storing heirloom furniture during a remodel or seasonal items between uses, everything receives the same level of care and protection.",

  'los-gatos':
    'Los Gatos living is all about enjoying the best of the South Bay — the trails, the restaurants, the community events. Boombox helps you spend more time doing what you love by taking storage off your plate entirely. We handle pickup, warehousing, and delivery so you never have to spend a Saturday afternoon at a self-storage facility. More time for the Los Gatos lifestyle, less time managing stuff.',

  cupertino:
    "Cupertino families often find themselves caught between needing more space and loving their current home. Boombox offers a third option — keep your home, store the overflow. Our mobile units are perfect for rotating seasonal items, storing kids' outgrown furniture, or clearing space for a home office. With Boombox, you get the extra room without the extra mortgage payment.",

  'portola-valley':
    "Portola Valley's serene environment calls for a storage solution that's equally unobtrusive. Boombox operates on your schedule, delivering and picking up storage units at times that work for you. There's no construction of on-site storage, no unsightly pods sitting in your driveway for weeks. We come, we go, and your belongings are safe in our facility until you need them again.",

  fremont:
    "Fremont's position as the gateway between the East Bay and South Bay makes it one of the most connected cities in the region. Boombox takes advantage of that connectivity to provide fast, reliable storage service across all of Fremont's districts. From the tech corridors of Warm Springs to the historic charm of Niles, our mobile storage adapts to every neighborhood and every need.",

  newark:
    "Newark may be one of the Bay Area's smaller cities, but its tight-knit community deserves big-city service. Boombox provides exactly that — professional mobile storage with the personal touch of a local business. We know the neighborhoods, we understand the parking situations, and we work around your schedule to make storage as convenient as possible.",

  'union-city':
    "Union City families juggle a lot — commutes, school activities, home projects — and the last thing you need is another errand. Boombox eliminates the storage errand entirely by bringing the unit to your door and handling all the transportation. Our secure facility is nearby, so when you need items back, delivery is fast. It's storage designed for real life in Union City.",

  campbell:
    "Campbell's charming downtown and established neighborhoods attract people who appreciate convenience and quality. Boombox fits right into that lifestyle with a storage service that's as easy as placing an online order. Our mobile units are clean, secure, and delivered on time. Whether you're clearing out for a garage sale, staging your home for the market, or just creating breathing room, we've got you covered.",

  'south-san-francisco':
    "South San Francisco's evolving identity — from industrial roots to biotech powerhouse — means the community is always changing. Boombox supports those changes with flexible storage that moves at your pace. Relocating for a new lab position? Renovating your home near Sign Hill? Downsizing after the kids move out? Our mobile storage handles every scenario with the same level of professionalism and care.",
};

async function main() {
  console.log('Updating aboutContentTwo for all location pages...\n');

  let updated = 0;
  let skipped = 0;

  for (const [slug, content] of Object.entries(ABOUT_CONTENT_TWO)) {
    const location = await prisma.locationPage.findUnique({
      where: { slug },
      select: { id: true, city: true },
    });

    if (!location) {
      console.log(`  Skipped: ${slug} (not found in database)`);
      skipped++;
      continue;
    }

    await prisma.locationPage.update({
      where: { slug },
      data: { aboutContentTwo: content },
    });

    console.log(`  Updated: ${location.city}`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} locations, skipped ${skipped}.`);
}

main()
  .catch(e => {
    console.error('Update failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
