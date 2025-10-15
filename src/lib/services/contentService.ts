/**
 * @fileoverview Static content service for boombox-11.0
 * @source Legacy ContentService interface maintained for backward compatibility
 * 
 * SERVICE FUNCTIONALITY:
 * - Provides static blog posts and popular articles data
 * - Maintains interface compatibility with existing hooks and tests
 * - Acts as a bridge while migrating to database-driven BlogService
 * 
 * INTEGRATION NOTES:
 * - Static data implementation for testing and development
 * - Will be replaced by BlogService for production database queries
 * - Maintains same interface as expected by useBlogCategories and tests
 * 
 * @refactor Temporary static implementation for test compatibility
 */

import { BlogCategory, BlogPost, PopularArticle } from '@/types/content.types';

// Static blog posts data
const BLOG_POSTS: BlogPost[] = [
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/palo-alto.png',
    blogTitle: 'How to store paintings the right way',
    blogDescription: 'Learn the best practices for storing artwork safely and securely.',
    author: 'Sophie',
    readTime: '10 min read',
    datePublished: 'June 15, 2023',
    link: '/blog/how-to-store-paintings'
  },
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/berkeley.png',
    blogTitle: 'Packing fragile items for storage',
    blogDescription: 'Essential tips for protecting your delicate belongings.',
    author: 'Michael',
    readTime: '8 min read',
    datePublished: 'June 10, 2023',
    link: '/blog/packing-fragile-items'
  },
  {
    category: 'Press',
    thumbnail: '/img/san-jose.png',
    blogTitle: 'Boombox featured in TechCrunch',
    blogDescription: 'Our innovative storage solution gets recognition.',
    author: 'Press Team',
    readTime: '5 min read',
    datePublished: 'June 5, 2023',
    link: '/blog/techcrunch-feature'
  },
  {
    category: 'Most Recent',
    thumbnail: '/img/mountain-view.png',
    blogTitle: 'New storage locations now open',
    blogDescription: 'Expanding our service to more Bay Area locations.',
    author: 'Operations',
    readTime: '6 min read',
    datePublished: 'June 20, 2023',
    link: '/blog/new-locations'
  }
];

// Static popular articles data
const POPULAR_ARTICLES: PopularArticle[] = [
  {
    title: 'Berkeley Storage Solutions',
    author: 'Location Team',
    readTime: '7 min read',
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley storage facility',
    link: '/locations/berkeley'
  },
  {
    title: 'Palo Alto Premium Storage',
    author: 'Location Team',
    readTime: '6 min read',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Palo Alto storage facility',
    link: '/locations/palo-alto'
  },
  {
    title: 'San Jose Storage Hub',
    author: 'Location Team',
    readTime: '8 min read',
    imageSrc: '/img/san-jose.png',
    imageAlt: 'San Jose storage facility',
    link: '/locations/san-jose'
  }
];

// Available blog categories
const BLOG_CATEGORIES: BlogCategory[] = ['Tips and Tricks', 'Press', 'Most Recent'];

/**
 * Static content service providing blog posts and popular articles
 */
export class ContentService {
  /**
   * Get all blog posts
   * @returns Array of all blog posts
   */
  static getAllBlogPosts(): BlogPost[] {
    return [...BLOG_POSTS]; // Return a copy to maintain immutability
  }

  /**
   * Get blog posts filtered by category
   * @param category - Blog category to filter by
   * @returns Array of blog posts in the specified category
   */
  static getBlogPostsByCategory(category: BlogCategory): BlogPost[] {
    return BLOG_POSTS.filter(post => post.category === category);
  }

  /**
   * Get all popular articles
   * @returns Array of all popular articles
   */
  static getPopularArticles(): PopularArticle[] {
    return [...POPULAR_ARTICLES]; // Return a copy to maintain immutability
  }

  /**
   * Get all available blog categories
   * @returns Array of blog categories
   */
  static getBlogCategories(): BlogCategory[] {
    return [...BLOG_CATEGORIES]; // Return a copy to maintain immutability
  }

  /**
   * Check if a category is valid
   * @param category - Category to validate
   * @returns True if category is valid, false otherwise
   */
  static isValidCategory(category: any): category is BlogCategory {
    return typeof category === 'string' && BLOG_CATEGORIES.includes(category as BlogCategory);
  }

  /**
   * Get the count of blog posts in a specific category
   * @param category - Blog category
   * @returns Number of posts in the category
   */
  static getBlogPostCount(category: BlogCategory): number {
    return this.getBlogPostsByCategory(category).length;
  }

  /**
   * Get the total count of all blog posts
   * @returns Total number of blog posts
   */
  static getTotalBlogPostCount(): number {
    return BLOG_POSTS.length;
  }

  /**
   * Get the primary featured article (first blog post for now)
   * @returns Primary featured article or null if none available
   */
  static getPrimaryFeaturedArticle(): BlogPost | null {
    return BLOG_POSTS.length > 0 ? BLOG_POSTS[0] : null;
  }
}
