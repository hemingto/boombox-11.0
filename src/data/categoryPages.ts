export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryPageData {
  slug: string;
  title: string;
  heroTitle: string;
  heroImagePath: string;
  heroImageAlt: string;
  aboutHeading: string;
  aboutContent: string;
  aboutContentTwo: string;
  aboutImagePath: string;
  aboutImageAlt: string;
  securityHeading: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  faqs: CategoryFaq[];
}

export const categoryPages: Record<string, CategoryPageData> = {
  'holiday-storage': {
    slug: 'holiday-storage',
    title: 'Holiday Storage',
    heroTitle: 'Holiday storage, delivered.',
    heroImagePath: '/categories/holiday-storage-hero.png',
    heroImageAlt: 'Boombox mobile storage unit for holiday decoration storage',
    aboutHeading: 'Holiday Storage Made Simple',
    aboutContent:
      'Holiday decorations, artificial trees, lights, and seasonal furniture take up valuable space in your home for months on end. Boombox holiday storage gives you a better option — a secure, climate-aware storage unit delivered right to your door. Pack your holiday items at your own pace, and we pick it up and store it at our monitored facility until the next season rolls around.',
    aboutContentTwo:
      'When the holidays approach again, simply request a delivery and your decorations arrive ready to go. No driving to a self-storage facility, no hauling boxes through a parking lot. Boombox handles the logistics so you can focus on what matters — spending time with family and enjoying the season.',
    aboutImagePath: '/categories/holiday-storage-about.png',
    aboutImageAlt:
      'Holiday decorations packed securely in a Boombox storage unit',
    securityHeading: 'Holiday storage you can trust',
    metaTitle: 'Holiday Storage Units, Delivered | Boombox',
    metaDescription:
      'Store holiday decorations, seasonal furniture, and more with Boombox mobile storage. Units delivered to your door. Free initial delivery. Get a quote today.',
    keywords: [
      'holiday storage',
      'seasonal storage',
      'decoration storage',
      'christmas decoration storage',
      'holiday storage units',
      'seasonal storage units',
    ],
    faqs: [
      {
        question: 'What holiday items can I store with Boombox?',
        answer:
          'You can store holiday decorations, artificial trees, string lights, wreaths, seasonal tableware, outdoor inflatables, gift wrap supplies, and seasonal furniture. Avoid storing anything flammable, perishable, or liquid-based such as candles with exposed wicks or scented oils.',
      },
      {
        question:
          'How far in advance should I schedule a holiday storage pickup?',
        answer:
          'We recommend scheduling your pickup at least 2–3 days in advance, especially during peak post-holiday periods in January and early July. During off-peak times we can typically deliver a unit within 1 day.',
      },
      {
        question: 'Will my holiday decorations be safe in storage?',
        answer:
          'Yes. Boombox stores your unit in a 24/7 monitored facility with restricted access. Our steel-constructed containers are padlocked so only you have access. We recommend wrapping fragile ornaments in bubble wrap or packing paper for extra protection during transit.',
      },
      {
        question:
          'Can I access my holiday storage unit before the next season?',
        answer:
          'Absolutely. You can request a delivery of your storage unit any time Monday through Saturday, 8:30 am to 5:30 pm. We deliver it right to your door at a flat $75 delivery rate so you can grab what you need.',
      },
      {
        question: 'How much does holiday storage cost?',
        answer:
          'Boombox holiday storage pricing is typically below local self-storage rates and includes free initial delivery. Monthly storage costs vary based on the number of units you need. Visit our pricing page or get a personalized quote for exact pricing.',
      },
    ],
  },

  'commercial-storage': {
    slug: 'commercial-storage',
    title: 'Commercial Storage',
    heroTitle: 'Commercial storage units, delivered.',
    heroImagePath: '/categories/commercial-storage-hero.png',
    heroImageAlt:
      'Boombox commercial storage unit for business inventory and equipment',
    aboutHeading: 'Commercial Storage for Your Business',
    aboutContent:
      'Whether you need to store office furniture during a renovation, archive business inventory between seasons, or free up workspace for your growing team, Boombox commercial storage units are built for the job. We deliver a secure, steel-constructed container directly to your business location. Load it on your schedule, and we transport it to our monitored storage facility.',
    aboutContentTwo:
      'Boombox eliminates the overhead of leasing warehouse space or renting a traditional self-storage unit across town. Our flat-rate delivery pricing and flexible month-to-month plans let you scale storage up or down as your business needs change — no long-term contracts, no surprise fees.',
    aboutImagePath: '/categories/commercial-storage-about.png',
    aboutImageAlt:
      'Office equipment and inventory stored in a Boombox commercial storage unit',
    securityHeading: 'Commercial storage you can trust',
    metaTitle: 'Commercial Storage Units, Delivered | Boombox',
    metaDescription:
      'Secure commercial storage units delivered to your business. Store office furniture, inventory, and equipment with Boombox. Free initial delivery. Get a quote.',
    keywords: [
      'commercial storage units',
      'business storage',
      'office storage',
      'commercial storage',
      'business inventory storage',
      'office furniture storage',
    ],
    faqs: [
      {
        question: 'What types of commercial items can I store?',
        answer:
          'Boombox commercial units can hold office furniture, electronics, retail inventory, trade show materials, marketing collateral, archived files, and equipment. Each unit holds up to 1,000 lbs and approximately 257 cubic feet of storage space.',
      },
      {
        question: 'Can I get multiple storage units for my business?',
        answer:
          'Yes. Many businesses use multiple Boombox containers to organize inventory by category or department. You can add units at any time from your account page and we can typically deliver within 1 day.',
      },
      {
        question: 'Is Boombox commercial storage cheaper than warehouse space?',
        answer:
          'In most cases, yes. Boombox pricing is typically below local self-storage rates, and you avoid the overhead of a warehouse lease — no utility bills, no long-term contracts, and no commute. You only pay for the storage you use on a month-to-month basis.',
      },
      {
        question: 'How do I access my commercial storage unit?',
        answer:
          'Request a delivery through your Boombox account any time Monday through Saturday, 8:30 am to 5:30 pm. We bring your unit to your business location at a flat $75 delivery rate. Load or unload what you need, and we pick it back up.',
      },
      {
        question: 'Do you offer loading help for commercial storage?',
        answer:
          'Yes. You can add professional loading help to any delivery for $189/hr. Our network of local moving pros can handle heavy office furniture, palletized inventory, and bulky equipment safely.',
      },
    ],
  },

  'archival-storage': {
    slug: 'archival-storage',
    title: 'Archival Storage',
    heroTitle: 'Archival storage, delivered.',
    heroImagePath: '/categories/archival-storage-hero.png',
    heroImageAlt: 'Boombox archival storage unit for documents and records',
    aboutHeading: 'Archival Storage for Documents and Records',
    aboutContent:
      'Important documents, business records, legal files, and personal archives deserve more than a dusty attic or overpriced filing room. Boombox archival storage gives you a dedicated, secure container for your paper records, boxed files, photo collections, and media archives. We deliver the unit, you pack it, and we store it safely at our 24/7 monitored facility.',
    aboutContentTwo:
      'Need to retrieve a specific file box? Request a delivery and your entire unit comes back to your door. No digging through a warehouse, no appointment windows at a remote facility. Boombox makes archival storage as convenient as it should be — organized, secure, and always accessible when you need it.',
    aboutImagePath: '/categories/archival-storage-about.png',
    aboutImageAlt:
      'Archived documents and file boxes in a Boombox storage unit',
    securityHeading: 'Archival storage you can trust',
    metaTitle: 'Archival Storage Units, Delivered | Boombox',
    metaDescription:
      'Secure archival storage for documents, records, and files. Boombox delivers a storage unit to your door. 24/7 monitored facility. Get a quote today.',
    keywords: [
      'archival storage',
      'document storage',
      'record storage',
      'file storage units',
      'paper records storage',
      'archive storage',
    ],
    faqs: [
      {
        question: 'What types of documents can I store with Boombox?',
        answer:
          'You can store business records, legal documents, tax files, medical records, personal archives, photo albums, film reels, and boxed paper files. We recommend using sealed, labeled file boxes for easy retrieval later.',
      },
      {
        question: 'How do I protect documents from damage in storage?',
        answer:
          'Use sturdy, sealed file boxes and avoid overpacking. Our steel containers are elevated 6 inches off the ground to protect against moisture. For extra protection, consider using plastic storage bins for irreplaceable documents. Boombox facilities are monitored 24/7 with restricted access.',
      },
      {
        question: 'Can I retrieve individual file boxes from my unit?',
        answer:
          'We deliver your entire storage unit to your door at a flat $75 rate. Once delivered, you can access any box inside. We recommend labeling and organizing boxes by date or category so you can quickly find what you need.',
      },
      {
        question:
          'Is Boombox archival storage compliant with record retention requirements?',
        answer:
          'Boombox provides secure, restricted-access storage with 24/7 monitoring. While we do not provide certified records management services, our security measures support general document retention needs. Consult your compliance officer for industry-specific requirements.',
      },
      {
        question: 'How long can I keep documents in archival storage?',
        answer:
          'There is no maximum storage term. Many customers store archival materials for years. Boombox operates on a month-to-month billing cycle after a 2-month minimum term, so you can store as long as you need.',
      },
    ],
  },

  'moving-and-storage': {
    slug: 'moving-and-storage',
    title: 'Moving and Storage',
    heroTitle: 'Moving and storage, delivered.',
    heroImagePath: '/categories/moving-and-storage-hero.png',
    heroImageAlt:
      'Boombox moving and storage service with delivered storage unit',
    aboutHeading: 'Bay Area Moving and Storage',
    aboutContent:
      'Moving is complicated enough without juggling separate movers and storage facilities. Boombox combines moving and storage into a single, streamlined service. We deliver a portable storage unit to your current address, you pack it on your own schedule — or hire our loading pros — and we pick it up and store it securely until your new place is ready.',
    aboutContentTwo:
      'When you are ready to move in, we deliver your packed unit directly to your new address. No double-handling, no renting a truck and a storage unit separately, no wasted weekends shuttling boxes. Boombox moving and storage simplifies your entire relocation, whether you are moving across town or need temporary storage between leases.',
    aboutImagePath: '/categories/moving-and-storage-about.png',
    aboutImageAlt:
      'Household items being loaded into a Boombox storage unit during a move',
    securityHeading: 'Moving storage you can trust',
    metaTitle: 'Moving and Storage Services, Delivered | Boombox',
    metaDescription:
      'Combine moving and storage with Boombox. Storage units delivered to your door, packed on your schedule, and stored securely. Free initial delivery. Get a quote.',
    keywords: [
      'moving and storage',
      'moving storage',
      'relocation storage',
      'moving and storage service',
      'temporary moving storage',
      'portable moving storage',
    ],
    faqs: [
      {
        question: 'How does Boombox combine moving and storage?',
        answer:
          'We deliver a storage unit to your current address. You pack it yourself or add professional loading help. Once packed, we transport it to our secure facility. When your new place is ready, we deliver it there. One unit, one service — no separate moving truck or storage rental needed.',
      },
      {
        question: 'Can I store my belongings between moves?',
        answer:
          'Yes. Many customers use Boombox as gap storage between leases or during home renovations. There is a 2-month minimum term, and after that you pay month-to-month until you are ready for final delivery.',
      },
      {
        question: 'Do you offer professional loading help for moves?',
        answer:
          'Yes. You can add loading help when booking your delivery. Our network of local moving pros handle heavy lifting, furniture disassembly, and careful packing at $189/hr. They are licensed and insured for your peace of mind.',
      },
      {
        question: 'How many storage units do I need for my move?',
        answer:
          'Each Boombox unit holds about one room to one and a half rooms of furniture and boxes (257 cubic feet, up to 1,000 lbs). Use our storage calculator to estimate the exact number based on your inventory. You can always add more units if needed.',
      },
      {
        question: 'What is included in my initial delivery for a move?',
        answer:
          'Your first delivery includes the storage unit, the first month of storage, 5 complimentary moving blankets, and access to a floor dolly. The initial 60 minutes of loading time are free. Optional add-ons include professional loading help and insurance coverage.',
      },
    ],
  },
};

export const allCategorySlugs = Object.keys(categoryPages);
