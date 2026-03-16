/**
 * @fileoverview Static content data for guide pages
 *
 * Each guide expands on FAQ answers from faq.tsx into a narrative format.
 * Content blocks follow a similar pattern to blog content blocks but are
 * statically defined rather than database-driven.
 */

export interface GuideContentBlock {
  type: 'paragraph' | 'heading' | 'image' | 'list' | 'callout';
  content: string;
  metadata?: {
    level?: number;
    alt?: string;
    ordered?: boolean;
  };
}

export interface GuidePage {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  readTime: string;
  heroImage: string;
  heroImageAlt: string;
  contentBlocks: GuideContentBlock[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export const guidePages: Record<string, GuidePage> = {
  'delivery-guide': {
    slug: 'delivery-guide',
    title: 'Delivery Guide',
    subtitle: 'What to expect on delivery day',
    excerpt:
      'Learn what to expect on the day of your first Boombox appointment, from scheduling to loading your container.',
    readTime: '5 min read',
    heroImage: '/guides/delivery-guide-hero.png',
    heroImageAlt: 'Boombox delivery truck arriving at a home',
    metaTitle: 'Delivery Day Guide | What to Expect | Boombox',
    metaDescription:
      'Everything you need to know about your first Boombox delivery. Learn about delivery windows, loading time, what is included, and how to prepare for a smooth experience.',
    keywords: [
      'boombox delivery',
      'storage delivery guide',
      'mobile storage delivery',
      'first storage appointment',
      'boombox how it works',
    ],
    contentBlocks: [
      {
        type: 'paragraph',
        content:
          'Your first Boombox delivery is designed to be simple and stress-free. A delivery driver brings a mobile storage unit directly to your location, you pack it on your schedule, and we transport it to our secure storage facility. This guide walks you through every step of the process so you know exactly what to expect.',
      },
      {
        type: 'heading',
        content: 'Scheduling Your Delivery',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'When you book your delivery appointment, you can select a 1-hour delivery window that works best for you. With real-time tracking, you will always know exactly when your Boombox is set to arrive within that window. We can typically deliver a container with as little as 1 day of notice, so you have plenty of flexibility.',
      },
      {
        type: 'heading',
        content: 'What Happens When the Driver Arrives',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Once the Boombox delivery driver arrives at your delivery address, they will contact you and your free loading time begins. The driver will position the container at your location and make it accessible for loading. Each container rests about 6 inches off the ground to keep your belongings safe and dry.',
      },
      {
        type: 'heading',
        content: 'Loading Time and Costs',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'You can take as much time as you need to pack your unit. The first 60 minutes of loading time are free. If you pack your container within that first hour, you will not be charged anything extra for the delivery. If you need more time, the driver can wait at your location at a rate of $50 per hour after the first free hour.',
      },
      {
        type: 'callout',
        content:
          'Tip: Go through our pre-delivery checklist before your appointment to make sure you are prepared and ready to go when the driver arrives. Having your items staged near the loading area will help you stay within the free loading window.',
      },
      {
        type: 'heading',
        content: "What's Included in Your Delivery",
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Your Boombox quote includes everything you need to get started. Here is what comes with your initial delivery:',
      },
      {
        type: 'list',
        content:
          'Your first month of storage rent\n5 complimentary moving blankets\nAccess to a floor dolly\nThe storage container itself (5 ft wide x 8 ft long x 8 ft tall, 257 cubic feet of space)',
        metadata: { ordered: false },
      },
      {
        type: 'paragraph',
        content:
          'You can also add optional services when booking your delivery, including professional loading help from our network of local moving pros and insurance coverage for extra peace of mind.',
      },
      {
        type: 'heading',
        content: 'Multiple Container Deliveries',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'If you need more than one container, we will send a maximum of two Boombox containers at the same time to ensure there is enough space at your delivery address. Any remaining containers will be staggered about an hour after the first two have been delivered.',
      },
      {
        type: 'heading',
        content: 'Payment and Billing',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'You will not be charged until the day of your delivery. When you book your reservation, we ask for credit card information to hold your spot and charge a reversible $10 hold to verify the card. On delivery day, you will be charged for your first month of storage along with any optional add-ons you selected. After that, your storage bill recurs every 30 days.',
      },
      {
        type: 'heading',
        content: 'After Your Container Is Packed',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Once your storage unit is packed, the Boombox delivery driver will return it to our secure storage facility. We recommend taking photos of your stored items before the container is closed so you can remember what you packed. You can upload these photos to your account page later for easy reference.',
      },
    ],
  },

  'packing-guide': {
    slug: 'packing-guide',
    title: 'Packing Guide',
    subtitle: 'How to pack your Boombox safely',
    excerpt:
      'Learn how to pack your Boombox storage container safely and securely with these expert tips and guidelines.',
    readTime: '7 min read',
    heroImage: '/guides/packing-guide-hero.png',
    heroImageAlt: 'Items being packed into a Boombox container',
    metaTitle: 'Packing Guide | Tips for Safe Storage | Boombox',
    metaDescription:
      'Expert tips for packing your Boombox storage container. Learn about weight distribution, box sizes, furniture protection, and what items are prohibited.',
    keywords: [
      'packing storage container',
      'storage packing tips',
      'how to pack storage unit',
      'moving packing guide',
      'boombox packing',
    ],
    contentBlocks: [
      {
        type: 'paragraph',
        content:
          'Packing your Boombox container correctly is the single most important thing you can do to protect your belongings during transit and storage. Each container is 5 feet wide by 8 feet long by 8 feet tall with an internal capacity of approximately 257 cubic feet, holding up to 1,000 lbs. A king-size or California king mattress will fit standing up. This guide covers everything you need to know to pack safely and efficiently.',
      },
      {
        type: 'heading',
        content: 'The Four-Tier Loading Strategy',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Think of each tier as a wall or stack within the container. This method helps maintain balance and stability during transit. Follow these four steps when loading:',
      },
      {
        type: 'list',
        content:
          'Organize items into tiers: Start with the heaviest items at the bottom and lighter items on top to maintain balance and stability during transit.\nLoad from back to front: Begin at the back of the container and work forward. The base of each tier should be your sturdiest items like dressers or desks.\nDistribute weight evenly: Place heavy items around the base of the container so weight is spread across the floor, not concentrated on one side.\nFill gaps and protect items: Use soft materials like furniture pads, blankets, and pillows to fill spaces between items, preventing shifts and scratches.',
        metadata: { ordered: true },
      },
      {
        type: 'heading',
        content: 'Choosing the Right Box Sizes',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Using the right box size for each type of item makes a big difference in how well your container stays packed:',
      },
      {
        type: 'list',
        content:
          'Small boxes: Ideal for heavy, compact items like books, tools, and small appliances.\nMedium boxes: Best for larger appliances, lamp shades, and mid-weight household items.\nLarge boxes: Use for bulky, lighter items like pillows, linens, and comforters. These soft items can also be used to fill gaps in the container.\nSpecialty boxes: Use for fragile items such as lamps, mirrors, and framed artwork. Pack dishes and kitchenware in sturdy boxes with extra wrapping.\nWardrobe boxes: Keep clothing that needs to remain hanging wrinkle-free and protected.',
        metadata: { ordered: false },
      },
      {
        type: 'heading',
        content: 'Preparing Your Belongings',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Before you start loading, take care of these preparation steps:',
      },
      {
        type: 'list',
        content:
          'Disassemble furniture as much as you can, especially bed frames and table legs.\nDrain water connections from appliances like mini-fridges and washing machines.\nLabel boxes clearly to quickly identify them during unpacking.\nWrap furniture items in moving blankets and plastic to prevent scratches.\nMeasure larger items beforehand to make sure they will fit in the container.',
        metadata: { ordered: false },
      },
      {
        type: 'heading',
        content: 'Preventing Items from Shifting',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'The best way to avoid shifting is to pack your container properly from the start. Place your heaviest items toward the bottom center of the container and distribute weight evenly. Fill any remaining gaps with furniture pads, soft items, or packing materials so there is no room for contents to move. Inside boxes, use bubble wrap, packing peanuts, or packing paper to fill voids and keep items stationary.',
      },
      {
        type: 'callout',
        content:
          'Remember: Each container has a strict weight limit of 1,000 lbs. If you have a lot of heavy furniture, split it between multiple containers. Please let us know if you plan on storing heavy items like pallets of books or large furniture pieces.',
      },
      {
        type: 'heading',
        content: 'Protecting Electronics',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Electronics require special care. For items like flat-screen TVs, use specialized moving boxes and pad them against cushioned surfaces to prevent damage. Wrap screens with soft blankets or foam padding and store them upright whenever possible. Keep cords bundled and labeled so you can easily reconnect everything later.',
      },
      {
        type: 'heading',
        content: 'Storing Furniture',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'You can absolutely store furniture in your Boombox. All we ask is that you protect it appropriately and let us know if any single furniture item weighs over 100 lbs. Disassemble larger items such as bed frames and dining tables to save space and reduce the risk of damage during transit. Wrap each piece in moving blankets to prevent scratches.',
      },
      {
        type: 'heading',
        content: 'Items You Cannot Store',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'For safety reasons, certain items are prohibited from being stored in a Boombox container:',
      },
      {
        type: 'list',
        content:
          'Weapons, explosives, fireworks, and flammables like gas, oil, kerosene, paint, and lighter fluid.\nAnything alive or that was alive, including food, fruit, meats, cheeses, animals, insects, and bacterial cultures.\nAll perishable and non-perishable food items.\nIllegal items such as drugs, drug paraphernalia, or stolen property.\nHazardous materials, toxic substances, items that produce gas or odors, containers with liquids, or anything that may increase in size or burst.',
        metadata: { ordered: false },
      },
      {
        type: 'heading',
        content: 'Need Help Packing?',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'If you are not confident about packing your container yourself, you can add professional loading help when booking your delivery. Our network of local moving pros are licensed, insured, and experienced at packing containers correctly. They can handle heavy furniture, fragile items, and ensure everything is loaded safely.',
      },
    ],
  },

  'storage-access-guide': {
    slug: 'storage-access-guide',
    title: 'Storage Access Guide',
    subtitle: 'Accessing your items in storage',
    excerpt:
      'Everything you need to know about accessing your stored items, from scheduling a delivery to ending your storage plan.',
    readTime: '5 min read',
    heroImage: '/guides/storage-access-guide-hero.png',
    heroImageAlt: 'Boombox storage facility with containers',
    metaTitle: 'Storage Access Guide | How to Get Your Items | Boombox',
    metaDescription:
      'Learn how to access your Boombox storage unit, add or remove items, and manage your storage plan. Flat-rate delivery, flexible scheduling, and 24/7 security.',
    keywords: [
      'storage access',
      'retrieve stored items',
      'storage unit delivery',
      'boombox storage access',
      'access storage unit',
    ],
    contentBlocks: [
      {
        type: 'paragraph',
        content:
          'One of the biggest advantages of Boombox over traditional self-storage is how easy it is to access your belongings. Instead of driving to a facility and navigating hallways and elevators, your storage unit comes to you. This guide covers everything you need to know about accessing, updating, and managing your items in storage.',
      },
      {
        type: 'heading',
        content: 'Requesting a Delivery',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'You can access your storage unit Monday through Saturday, 8:30 am to 5:30 pm, by setting up a delivery request on your account page. A Boombox delivery driver will bring your storage unit straight to your door at a flat rate of $45 per delivery. Simply log in, select the unit you need, and choose a delivery window that works for you.',
      },
      {
        type: 'heading',
        content: 'Adding More Items',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Need to add items to your existing storage unit? Request a delivery from your account page and the driver will bring your container to you. Load your additional items, and the driver will return the unit to our facility. The same $45 flat-rate delivery fee applies.',
      },
      {
        type: 'paragraph',
        content:
          'If your additional items will not fit in your existing container, you can request a new unit from your account page. We can typically deliver an additional container within 1 day.',
      },
      {
        type: 'heading',
        content: 'Retrieving Items',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          "When you need items back, the process is the same: schedule a delivery, and your unit arrives at your door. Take out what you need, and the driver returns the container to storage. Please be mindful of the driver's time and limit the loading and unloading to just what is needed to keep things moving smoothly.",
      },
      {
        type: 'callout',
        content:
          'Tip: Label and organize your boxes by category or room when you first pack your container. This makes it much faster to find specific items during future access appointments.',
      },
      {
        type: 'heading',
        content: 'Can I Visit My Items in Storage?',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'For security purposes, Boombox storage facilities are closed to the public. Only authorized personnel are allowed on premises. However, you can always view your storage units online by logging into your Boombox account. If you uploaded photos of your stored items, those will be available on your account page as well.',
      },
      {
        type: 'heading',
        content: 'Security and Protection',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'Security is one of our top priorities. Boombox storage locations are monitored 24/7, and only authorized personnel are allowed on premises. Each storage unit is made of sturdy, steel construction and padlocked so that only you have access to your items.',
      },
      {
        type: 'paragraph',
        content:
          'We always handle your storage unit with care. Our comprehensive insurance coverage protects against potential hazards in the unlikely event that they occur. However, it is your responsibility to make sure the unit is packed properly so items do not shift during transit. We do not insure items that are damaged due to improper packing.',
      },
      {
        type: 'heading',
        content: 'Managing Your Reservations',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'You can edit or cancel existing reservations from your account page, where you will see all your upcoming appointments. We ask for at least 12 hours of notice for cancellations. If we do not receive 24 hours of notice, a $65 cancellation fee may apply.',
      },
      {
        type: 'heading',
        content: 'Ending Your Storage Plan',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'To end your storage term, log in to your account and book a delivery. In the delivery form, make sure to note that this is your final delivery. You will need to ensure your container is completely empty at the end of the appointment. Once your container is returned empty, your monthly storage bill ends and you will no longer be charged.',
      },
      {
        type: 'paragraph',
        content:
          'Keep in mind that Boombox has a 2-month minimum payment term. You can receive your items back before the two months are up, but you will still be charged for the full minimum term.',
      },
    ],
  },

  'location-guide': {
    slug: 'location-guide',
    title: 'Location Guide',
    subtitle: 'Where Boombox delivers',
    excerpt:
      'Find out all the locations Boombox serves across the San Francisco Bay Area.',
    readTime: '3 min read',
    heroImage: '/guides/location-guide-hero.png',
    heroImageAlt: 'Map showing Boombox service locations',
    metaTitle: 'Location Guide | Service Areas | Boombox',
    metaDescription:
      'Boombox proudly serves the San Francisco Bay Area. Explore our service areas including San Francisco, Oakland, San Jose, Palo Alto, and 25+ more cities.',
    keywords: [
      'boombox locations',
      'boombox service area',
      'san francisco storage',
      'bay area storage',
      'mobile storage near me',
    ],
    contentBlocks: [
      {
        type: 'paragraph',
        content:
          'Boombox proudly serves the San Francisco Bay Area with mobile storage and moving services. Our fleet of delivery drivers covers a wide range of cities across the Peninsula, South Bay, East Bay, and San Francisco. This guide helps you understand our service area and what to do if your needs fall outside it.',
      },
      {
        type: 'heading',
        content: 'Our Service Area',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'We deliver storage containers throughout the San Francisco Bay Area. Our service area spans from San Francisco and South San Francisco in the north, through the Peninsula cities of Millbrae, Burlingame, San Mateo, Belmont, San Carlos, and Redwood City, down to Menlo Park, Palo Alto, Mountain View, Sunnyvale, and Santa Clara in the South Bay, and into San Jose, Campbell, Saratoga, Los Gatos, and Cupertino.',
      },
      {
        type: 'paragraph',
        content:
          'On the East Bay side, we serve Oakland, Berkeley, Fremont, Newark, Union City, and Milpitas. We also cover smaller communities including Pacifica, Emerald Hills, Woodside, Atherton, and Portola Valley.',
      },
      {
        type: 'heading',
        content: 'Cities We Serve',
        metadata: { level: 2 },
      },
      {
        type: 'list',
        content:
          'San Francisco\nSouth San Francisco\nOakland\nBerkeley\nSan Jose\nPacifica\nMillbrae\nBurlingame\nSan Mateo\nBelmont\nSan Carlos\nRedwood City\nEmerald Hills\nWoodside\nAtherton\nMenlo Park\nPalo Alto\nMountain View\nSunnyvale\nSanta Clara\nMilpitas\nSaratoga\nLos Gatos\nCupertino\nPortola Valley\nFremont\nNewark\nUnion City\nCampbell',
        metadata: { ordered: false },
      },
      {
        type: 'heading',
        content: 'Finding Your Nearest Location',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'To see detailed information about Boombox services in your area, visit our <a href="/locations">Locations page</a>. Each city page includes local storage pricing, service details, and information specific to that area. You can also enter your zip code when getting a quote to confirm that we deliver to your address.',
      },
      {
        type: 'heading',
        content: 'Delivery Logistics',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'No matter where you are in our service area, the process is the same. You book a delivery window, our driver brings the container to your address, and you load or unload on your schedule. Our mobile storage containers are designed to fit in standard driveways and parking areas across Bay Area neighborhoods.',
      },
      {
        type: 'heading',
        content: 'Moving Outside the Service Area',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'If you move outside our service area while your belongings are in storage, we can still help. While we do not offer shipping services outside the Bay Area, you can contact us at <a href="mailto:help@boomboxstorage.com">help@boomboxstorage.com</a> and we will help facilitate a move with a moving company of your choosing. We will coordinate the handoff so your items get to their new destination.',
      },
      {
        type: 'heading',
        content: 'Coverage Expanding',
        metadata: { level: 2 },
      },
      {
        type: 'paragraph',
        content:
          'We are always evaluating new areas to serve. If your city is not currently listed but is near our existing service area, reach out to us — we may be able to accommodate your delivery. Visit our <a href="/locations">Locations page</a> for the most up-to-date list of cities we serve.',
      },
    ],
  },
};

export const allGuideSlugs = Object.keys(guidePages);
