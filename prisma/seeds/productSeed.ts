/**
 * @fileoverview Product seed data for packing supplies
 * @source boombox-10.0/src/app/data/productdata.tsx
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    price: 2.15,
    title: 'Small Box',
    description: 'dimensions',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 3.15,
    title: 'Medium Box',
    description: 'dimensions',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 4.15,
    title: 'Large Box',
    description: 'dimensions',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 22.25,
    title: 'Wardrobe Box',
    description: 'description',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Moving Boxes',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 40,
    title: 'Moving Blankets',
    description: '5 pack',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 50,
    isOutOfStock: false,
  },
  {
    price: 15,
    title: 'Mattress Cover',
    description: 'fits up to a king',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 75,
    isOutOfStock: false,
  },
  {
    price: 15,
    title: 'Packing Tape',
    description: 'rolls of 6',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 150,
    isOutOfStock: false,
  },
  {
    price: 20.25,
    title: 'Bubble Wrap',
    description: '12in x 30ft',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 100,
    isOutOfStock: false,
  },
  {
    price: 25,
    title: 'Packing Paper',
    description: '320 sheets',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 80,
    isOutOfStock: false,
  },
  {
    price: 24.23,
    title: 'Stretch Wrap',
    description: '18" x 12ft',
    detailedDescription: 'This kit is perfect for a studio or small moving project. It includes a variety of boxes, packing materials, and moving supplies to help you pack and move your belongings safely and efficiently.',
    imageSrc: '/palo-alto.png',
    imageAlt: 'Product Picture',
    category: 'Packing Supplies',
    quantity: 0,
    stockCount: 90,
    isOutOfStock: false,
  },
];

export async function seedProducts() {
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
  } finally {
    await prisma.$disconnect();
  }
}

