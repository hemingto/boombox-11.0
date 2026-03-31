/**
 * @fileoverview Product seed data for packing supplies
 * @source boombox-10.0/src/app/data/productdata.tsx
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const products = [
  {
    price: 2.15,
    title: 'Small Box',
    description: '16 x 10 x 12 in',
    detailedDescription: 'Great for heavy or dense items like books, canned goods, and small appliances. The compact size keeps weight manageable and prevents overpacking.',
    imageSrc: '/packing-supplies/small-box.png',
    imageAlt: 'Small moving box',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 3.15,
    title: 'Medium Box',
    description: '20 x 16 x 15 in',
    detailedDescription: 'The most versatile box size for moving. Ideal for kitchen items, toys, shoes, and everyday household goods.',
    imageSrc: '/packing-supplies/medium-box.png',
    imageAlt: 'Medium moving box',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 4.15,
    title: 'Large Box',
    description: '26 x 16 x 15 in',
    detailedDescription: 'Best for lightweight, bulky items like pillows, linens, lampshades, and stuffed animals. Avoid filling entirely with heavy items.',
    imageSrc: '/packing-supplies/large-box.png',
    imageAlt: 'Large moving box',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 22.25,
    title: 'Wardrobe Box',
    description: '24 x 24 x 40 in',
    detailedDescription: 'Includes a built-in hanging bar so clothes go straight from closet to box on hangers. Keeps garments wrinkle-free during your move.',
    imageSrc: '/packing-supplies/wardrobe-box.png',
    imageAlt: 'Wardrobe moving box',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 40,
    title: 'Moving Blankets',
    description: '5 pack',
    detailedDescription: 'Heavy-duty padded blankets that protect furniture, appliances, and fragile surfaces from scratches and dents during transit.',
    imageSrc: '/packing-supplies/moving-blankets.png',
    imageAlt: 'Moving blankets',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 50,
    isOutOfStock: false,
  },
  {
    price: 15,
    title: 'Mattress Cover',
    description: 'fits up to a king',
    detailedDescription: 'Tear-resistant plastic bag that shields your mattress from dirt, moisture, and stains during moving and storage.',
    imageSrc: '/packing-supplies/mattress-bag.png',
    imageAlt: 'Mattress cover bag',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 75,
    isOutOfStock: false,
  },
  {
    price: 15,
    title: 'Packing Tape',
    description: 'rolls of 6',
    detailedDescription: 'Strong adhesive tape designed for sealing moving boxes. Six rolls provide enough tape for most household moves.',
    imageSrc: '/packing-supplies/packing-tape.png',
    imageAlt: 'Packing tape',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 150,
    isOutOfStock: false,
  },
  {
    price: 20.25,
    title: 'Bubble Wrap',
    description: '12in x 30ft',
    detailedDescription: 'Cushioning wrap that absorbs impact and protects fragile items like glassware, electronics, and picture frames during your move.',
    imageSrc: '/packing-supplies/bubble-wrap.png',
    imageAlt: 'Bubble wrap',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 25,
    title: 'Packing Paper',
    description: '320 sheets',
    detailedDescription: 'Ink-free newsprint paper for wrapping dishes, glassware, and other breakables. Also works as box filler to prevent items from shifting.',
    imageSrc: '/packing-supplies/packing-paper.png',
    imageAlt: 'Packing paper',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 80,
    isOutOfStock: false,
  },
  {
    price: 24.23,
    title: 'Stretch Wrap',
    description: '18" x 12ft',
    detailedDescription: 'Self-clinging plastic wrap that bundles items together and keeps drawers and doors shut during transport without leaving residue.',
    imageSrc: '/packing-supplies/stretch-wrap.png',
    imageAlt: 'Stretch wrap',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 90,
    isOutOfStock: false,
  },
];

async function seedProducts() {
  console.log('🌱 Seeding products...');

  try {
    // Clear existing products
    await prisma.product.deleteMany({});
    console.log('✨ Cleared existing products');

    // Create products
    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
    }

    console.log(`✅ Successfully seeded ${products.length} products`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

module.exports = { seedProducts };

// Run seed if this file is executed directly
if (require.main === module) {
  seedProducts()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

