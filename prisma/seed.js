/**
 * @fileoverview Main Prisma seed script for boombox-11.0
 * Seeds the database with initial data for development and testing
 */

const { seedBlogData } = require('./seeds/blogSeed.js');

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Seed blog data
    await seedBlogData();
    
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
