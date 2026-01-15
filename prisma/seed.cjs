/**
 * @fileoverview Main Prisma seed script for boombox-11.0
 * Seeds the database with initial data for development and testing
 */

const { seedBlogData } = require('./seeds/blogSeed.cjs');
const { seedMovingPartnersAndDrivers } = require('./seeds/movingPartnerSeed.cjs');
const { seedProducts } = require('./seeds/productSeed.cjs');
const { seedAdminTasks } = require('./seeds/adminTasksSeed.cjs');

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed products
    await seedProducts();
    
    // Seed moving partners and drivers
    await seedMovingPartnersAndDrivers();
    
    // Seed blog data
    await seedBlogData();
    
    // Seed admin tasks
    await seedAdminTasks();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
