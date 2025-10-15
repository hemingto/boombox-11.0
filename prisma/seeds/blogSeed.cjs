/**
 * @fileoverview Blog system seed script - migrates static blog data to database
 * @source boombox-10.0/src/app/components/blog/blogallarticles.tsx (static data)
 * @source boombox-10.0/src/app/components/blog/blogpopulararticles.tsx (static data)
 * @source boombox-10.0/src/app/components/blog/featuredarticlesection.tsx (static data)
 * @source boombox-11.0/src/lib/services/contentService.ts (existing static data)
 * 
 * This seed script creates:
 * - Blog categories (Tips and Tricks, Press, Most Recent)
 * - Blog posts with all metadata from existing components
 * - Admin user for blog authoring
 * - Content blocks for structured content
 */

const { PrismaClient, BlogStatus } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to create URL-friendly slugs
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Helper function to extract read time as number
function extractReadTime(readTimeString) {
  const match = readTimeString.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 10;
}

// Static blog data from existing components
const blogCategories = [
  { name: 'Tips and Tricks', slug: 'tips-and-tricks', description: 'Helpful tips for storage and moving' },
  { name: 'Press', slug: 'press', description: 'Company news and press releases' },
  { name: 'Most Recent', slug: 'most-recent', description: 'Latest blog posts and updates' },
];

const blogPosts = [
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'Best Neighborhoods in San Francisco for Families',
    blogDescription: 'Find out about the best San Francisco neighborhoods for families',
    author: 'Sophie',
    readTime: '15 min read',
    datePublished: 'October 8, 2023',
    link: '/blog/best-neighborhoods-in-san-francisco-for-families',
  },
  {
    category: 'Press',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'New Storage Units in Palo Alto',
    blogDescription: 'Check out the latest storage facilities in Palo Alto',
    author: 'John',
    readTime: '10 min read',
    datePublished: 'September 12, 2023',
    link: '/blog/new-storage-units-in-palo-alto',
  },
  {
    category: 'Most Recent',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'Moving Guide 2023: Everything You Need to Know',
    blogDescription: 'A comprehensive guide for your next big move',
    author: 'Emily',
    readTime: '20 min read',
    datePublished: 'August 25, 2023',
    link: '/blog/moving-guide-2023-everything-you-need-to-know',
  },
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'How to Store Antiques Safely',
    blogDescription: 'Tips for keeping your antiques safe in storage',
    author: 'Michael',
    readTime: '12 min read',
    datePublished: 'July 20, 2023',
    link: '/blog/how-to-store-antiques-safely',
  },
  {
    category: 'Press',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'New York Office Opens in 2023',
    blogDescription: 'Our latest office expansion into the East Coast',
    author: 'Sophia',
    readTime: '8 min read',
    datePublished: 'June 10, 2023',
    link: '/blog/new-york-office-opens-in-2023',
  },
];

// Popular articles data
const popularArticles = [
  {
    title: 'Moving Costs in San Francisco',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/golden-gate.png',
    imageAlt: 'Golden Gate Bridge',
    link: '/locations/san-francisco',
    category: 'Tips and Tricks',
    description: 'Complete guide to moving costs and budgeting for San Francisco relocations',
    datePublished: 'September 1, 2023',
  },
  {
    title: '5 Best Ways to Store Trading Cards',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/oakland.png',
    imageAlt: 'Runners at Lake Merritt',
    link: '/locations/oakland',
    category: 'Tips and Tricks',
    description: 'Protect your valuable trading card collection with these storage methods',
    datePublished: 'August 15, 2023',
  },
  {
    title: 'Moving to San Francisco: Advice & Tips',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley skyline',
    link: '/locations/berkeley',
    category: 'Tips and Tricks',
    description: 'Essential advice for anyone planning to move to San Francisco',
    datePublished: 'August 1, 2023',
  },
  {
    title: 'The 7 Best Jewelry Storage Ideas',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/mountain-view.png',
    imageAlt: 'bike in front of office building',
    link: '/locations/berkeley',
    category: 'Tips and Tricks',
    description: 'Keep your jewelry organized and protected with these storage solutions',
    datePublished: 'July 25, 2023',
  },
  {
    title: 'The Complete Guide to RV Storage',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Stanford University archways',
    link: '/locations/berkeley',
    category: 'Tips and Tricks',
    description: 'Everything you need to know about storing your RV safely and securely',
    datePublished: 'July 10, 2023',
  },
  {
    title: '7 Tips on How to Pack Dishes',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/san-jose.png',
    imageAlt: 'Downtown San Jose office buildings and palm trees',
    link: '/locations/berkeley',
    category: 'Tips and Tricks',
    description: 'Professional tips for packing dishes safely during your move',
    datePublished: 'June 25, 2023',
  },
];

// Featured article data
const featuredArticle = {
  title: 'How to store paintings the right way',
  author: 'Sophie',
  date: 'June 15, 2023',
  readTime: '10 min read',
  description: 'You can never have enough artwork! Not only do paintings liven up a room, but they are great family heirlooms that can be passed down from generation to generation...',
  authorImage: '/img/berkeley.png',
  articleImage: '/img/palo-alto.png',
  link: '/blog/how-to-store-paintings-the-right-way',
  category: 'Tips and Tricks',
};

// Sample content blocks for the featured article
const sampleContentBlocks = [
  {
    type: 'PARAGRAPH',
    content: 'The space under your bed isn\'t just for dust bunnies and the boogie man. Utilizing the space under your bed can be a great tool to save clothes storage space and reduce the amount of clutter around your room.',
    order: 1,
  },
  {
    type: 'HEADING',
    content: 'How to Store Items Under Your Bed',
    order: 2,
    metadata: { level: 2 },
  },
  {
    type: 'PARAGRAPH',
    content: 'We recommend storing items such as handbags, shoes and other accessories in bins under the bed and leaving your closet as your main clothing storage space.',
    order: 3,
  },
  {
    type: 'IMAGE',
    content: '/img/mountain-view.png',
    order: 4,
    metadata: { alt: 'Storage organization example', caption: 'Proper storage organization techniques' },
  },
  {
    type: 'PARAGRAPH',
    content: 'Keeping your clothes wrinkle free is somewhat difficult if you store clothing under your bed but handbags, shoes and other items can be easily stored under the bed without taking up valuable clothing storage space.',
    order: 5,
  },
];

async function seedBlogData() {
  console.log('🌱 Starting blog data seeding...');

  try {
    // 1. Create or find admin user for blog authoring
    let adminUser = await prisma.admin.findFirst({
      where: { email: 'admin@boombox.com' }
    });

    if (!adminUser) {
      adminUser = await prisma.admin.create({
        data: {
          email: 'admin@boombox.com',
          name: 'Blog Admin',
          role: 'ADMIN',
        }
      });
      console.log('✅ Created admin user for blog authoring');
    } else {
      console.log('✅ Found existing admin user');
    }

    // 2. Create blog categories
    console.log('📁 Creating blog categories...');
    const createdCategories = new Map();

    for (const categoryData of blogCategories) {
      const category = await prisma.blogCategory.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData,
      });
      createdCategories.set(categoryData.name, category);
      console.log(`✅ Created/updated category: ${category.name}`);
    }

    // 3. Create blog posts from static data
    console.log('📝 Creating blog posts...');
    
    // Combine all blog post data
    const allBlogPosts = [
      ...blogPosts,
      ...popularArticles.map(article => ({
        category: article.category,
        thumbnail: article.imageSrc,
        blogTitle: article.title,
        blogDescription: article.description,
        author: article.author,
        readTime: article.readTime,
        datePublished: article.datePublished,
        link: article.link,
      })),
      {
        category: featuredArticle.category,
        thumbnail: featuredArticle.articleImage,
        blogTitle: featuredArticle.title,
        blogDescription: featuredArticle.description,
        author: featuredArticle.author,
        readTime: featuredArticle.readTime,
        datePublished: featuredArticle.date,
        link: featuredArticle.link,
      }
    ];

    // Remove duplicates based on title
    const uniqueBlogPosts = allBlogPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.blogTitle === post.blogTitle)
    );

    for (const postData of uniqueBlogPosts) {
      const category = createdCategories.get(postData.category);
      if (!category) {
        console.warn(`⚠️ Category not found: ${postData.category}`);
        continue;
      }

      const slug = createSlug(postData.blogTitle);
      const publishedAt = new Date(postData.datePublished);
      const readTime = extractReadTime(postData.readTime);

      // Create the blog post
      const blogPost = await prisma.blogPost.upsert({
        where: { slug },
        update: {
          title: postData.blogTitle,
          excerpt: postData.blogDescription,
          featuredImage: postData.thumbnail,
          featuredImageAlt: `Featured image for ${postData.blogTitle}`,
          categoryId: category.id,
          status: BlogStatus.PUBLISHED,
          publishedAt,
          readTime,
          authorId: adminUser.id,
          authorName: postData.author,
          content: `# ${postData.blogTitle}\n\n${postData.blogDescription}\n\n*This is a migrated blog post. Full content to be added.*`,
        },
        create: {
          title: postData.blogTitle,
          slug,
          excerpt: postData.blogDescription,
          content: `# ${postData.blogTitle}\n\n${postData.blogDescription}\n\n*This is a migrated blog post. Full content to be added.*`,
          featuredImage: postData.thumbnail,
          featuredImageAlt: `Featured image for ${postData.blogTitle}`,
          categoryId: category.id,
          status: BlogStatus.PUBLISHED,
          publishedAt,
          readTime,
          authorId: adminUser.id,
          authorName: postData.author,
        }
      });

      console.log(`✅ Created/updated blog post: ${blogPost.title}`);

      // Add content blocks for the featured article
      if (postData.blogTitle === featuredArticle.title) {
        console.log('📄 Adding content blocks for featured article...');
        
        // Delete existing content blocks
        await prisma.blogContentBlock.deleteMany({
          where: { blogPostId: blogPost.id }
        });

        // Create new content blocks
        for (const blockData of sampleContentBlocks) {
          await prisma.blogContentBlock.create({
            data: {
              blogPostId: blogPost.id,
              type: blockData.type,
              content: blockData.content,
              order: blockData.order,
              metadata: blockData.metadata || null,
            }
          });
        }
        console.log('✅ Added content blocks for featured article');
      }
    }

    console.log('🎉 Blog data seeding completed successfully!');
    
    // Print summary
    const categoryCount = await prisma.blogCategory.count();
    const postCount = await prisma.blogPost.count();
    const blockCount = await prisma.blogContentBlock.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categoryCount}`);
    console.log(`   - Blog Posts: ${postCount}`);
    console.log(`   - Content Blocks: ${blockCount}`);

  } catch (error) {
    console.error('❌ Error seeding blog data:', error);
    throw error;
  }
}

// Export the function
module.exports = { seedBlogData };

// Run the seed if this file is executed directly
if (require.main === module) {
  seedBlogData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
