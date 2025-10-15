/**
 * @fileoverview Database-driven blog service for boombox-11.0
 * @source Replaces boombox-11.0/src/lib/services/contentService.ts (static data)
 * 
 * SERVICE FUNCTIONALITY:
 * - Fetches blog posts from Prisma database
 * - Provides pagination and filtering capabilities
 * - Handles blog categories and featured articles
 * - Replaces static ContentService with dynamic database queries
 * 
 * INTEGRATION NOTES:
 * - Uses Prisma client for database operations
 * - Maintains same interface as ContentService for easy migration
 * - Adds new capabilities like search, filtering, and analytics
 * 
 * @refactor Migrated from static data to database-driven approach
 */

import { prisma } from '@/lib/database/prismaClient';
import { BlogPost, BlogCategory, BlogStatus } from '@prisma/client';

// Extended types that include relations
export interface BlogPostWithCategory extends BlogPost {
  category: BlogCategory | null;
  contentBlocks?: BlogContentBlockWithMetadata[];
}

export interface BlogContentBlockWithMetadata {
  id: number;
  type: string;
  content: string;
  metadata: any;
  order: number;
}

export interface BlogPaginationResult {
  posts: BlogPostWithCategory[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BlogCategoryWithCount extends BlogCategory {
  _count: {
    posts: number;
  };
}

/**
 * Database-driven blog service
 * Provides methods for fetching and managing blog content from the database
 */
export class BlogService {
  /**
   * Get paginated blog posts with optional filtering
   */
  static async getBlogPosts(options: {
    page?: number;
    limit?: number;
    categorySlug?: string;
    status?: BlogStatus;
    search?: string;
  } = {}): Promise<BlogPaginationResult> {
    const {
      page = 1,
      limit = 6,
      categorySlug,
      status = BlogStatus.PUBLISHED,
      search,
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status,
    };

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get posts and total count
    const [posts, totalCount] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      posts,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Get a single blog post by slug
   */
  static async getBlogPostBySlug(slug: string): Promise<BlogPostWithCategory | null> {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        contentBlocks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (post) {
      // Increment view count
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return post;
  }

  /**
   * Get featured blog posts (for hero sections)
   */
  static async getFeaturedBlogPosts(limit: number = 1): Promise<BlogPostWithCategory[]> {
    return prisma.blogPost.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
      },
      include: {
        category: true,
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
      take: limit,
    });
  }

  /**
   * Get popular blog posts (most viewed)
   */
  static async getPopularBlogPosts(limit: number = 6): Promise<BlogPostWithCategory[]> {
    return prisma.blogPost.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
      },
      include: {
        category: true,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent blog posts
   */
  static async getRecentBlogPosts(limit: number = 5): Promise<BlogPostWithCategory[]> {
    return prisma.blogPost.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
      },
      include: {
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get all blog categories with post counts
   */
  static async getBlogCategories(): Promise<BlogCategoryWithCount[]> {
    return prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: BlogStatus.PUBLISHED,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get blog category by slug
   */
  static async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
    return prisma.blogCategory.findUnique({
      where: { slug },
    });
  }

  /**
   * Search blog posts
   */
  static async searchBlogPosts(
    query: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<BlogPaginationResult> {
    return this.getBlogPosts({
      ...options,
      search: query,
    });
  }

  /**
   * Get related blog posts (same category, excluding current post)
   */
  static async getRelatedBlogPosts(
    postId: number,
    categoryId: number | null,
    limit: number = 3
  ): Promise<BlogPostWithCategory[]> {
    if (!categoryId) {
      return [];
    }

    return prisma.blogPost.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
        categoryId,
        NOT: {
          id: postId,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get blog statistics
   */
  static async getBlogStats() {
    const [totalPosts, totalCategories, totalViews] = await Promise.all([
      prisma.blogPost.count({
        where: { status: BlogStatus.PUBLISHED },
      }),
      prisma.blogCategory.count(),
      prisma.blogPost.aggregate({
        where: { status: BlogStatus.PUBLISHED },
        _sum: { viewCount: true },
      }),
    ]);

    return {
      totalPosts,
      totalCategories,
      totalViews: totalViews._sum.viewCount || 0,
    };
  }

  /**
   * Legacy compatibility methods (matching ContentService interface)
   */

  /**
   * Get all blog posts (legacy method for backward compatibility)
   * @deprecated Use getBlogPosts() instead
   */
  static async getAllBlogPosts(): Promise<BlogPostWithCategory[]> {
    const result = await this.getBlogPosts({ limit: 100 });
    return result.posts;
  }

  /**
   * Get blog posts by category (legacy method)
   * @deprecated Use getBlogPosts({ categorySlug }) instead
   */
  static async getBlogPostsByCategory(categoryName: string): Promise<BlogPostWithCategory[]> {
    // Convert category name to slug for database lookup
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const result = await this.getBlogPosts({ categorySlug, limit: 100 });
    return result.posts;
  }

  /**
   * Get available categories (legacy method)
   * @deprecated Use getBlogCategories() instead
   */
  static async getAvailableCategories(): Promise<string[]> {
    const categories = await this.getBlogCategories();
    return categories.map(cat => cat.name);
  }

  /**
   * Validate category (legacy method)
   * @deprecated Use getBlogCategoryBySlug() instead
   */
  static async isValidCategory(categoryName: string): Promise<boolean> {
    const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
    const category = await this.getBlogCategoryBySlug(categorySlug);
    return !!category;
  }
}
