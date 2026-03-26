/**
 * @fileoverview Main Prisma seed script for boombox-11.0
 * Seeds the database with initial data for development and testing
 */

import { seedProducts } from './seeds/productSeed.js';
import { seedWarehouses } from './seeds/warehouseSeed.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    await seedProducts();
    await seedWarehouses();

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
