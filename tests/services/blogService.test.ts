/**
 * @fileoverview Comprehensive Jest tests for BlogService
 * @source Tests for database-driven blog system
 * 
 * TEST COVERAGE:
 * - All BlogService methods
 * - Database operations with Prisma
 * - Pagination and filtering
 * - Error handling and edge cases
 * - Legacy compatibility methods
 */

import { BlogService, BlogPostWithCategory, BlogCategoryWithCount } from '@/lib/services/blogService';
import { prisma } from '@/lib/database/prismaClient';
import { BlogStatus, BlogContentBlockType } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/database/prismaClient', () => ({
  prisma: {
    blogPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    blogCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('BlogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock data
  const mockBlogPost: BlogPostWithCategory = {
    id: 1,
    title: 'Test Blog Post',
    slug: 'test-blog-post',
    excerpt: 'This is a test excerpt',
    content: 'This is the full content of the blog post',
    featuredImage: '/img/test-image.jpg',
    featuredImageAlt: 'Test image alt text',
    metaTitle: 'Test Meta Title',
    metaDescription: 'Test meta description',
    categoryId: 1,
    status: BlogStatus.PUBLISHED,
    publishedAt: new Date('2024-01-01'),
    readTime: 5,
    viewCount: 100,
    authorId: 1,
    authorName: 'Test Author',
    authorImage: '/img/test-author.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    category: {
      id: 1,
      name: 'Tips and Tricks',
      slug: 'tips-and-tricks',
      description: 'Helpful tips and tricks',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  const mockCategory: BlogCategoryWithCount = {
    id: 1,
    name: 'Tips and Tricks',
    slug: 'tips-and-tricks',
    description: 'Helpful tips and tricks',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: {
      posts: 5,
    },
  };

  describe('getBlogPosts', () => {
    it('should fetch paginated blog posts with default parameters', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(10);

      const result = await BlogService.getBlogPosts();

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 6,
      });

      expect(result).toEqual({
        posts: mockPosts,
        totalCount: 10,
        totalPages: 2,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle custom pagination parameters', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(25);

      const result = await BlogService.getBlogPosts({
        page: 3,
        limit: 10,
      });

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 20,
        take: 10,
      });

      expect(result.currentPage).toBe(3);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should filter by category slug', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(3);

      await BlogService.getBlogPosts({
        categorySlug: 'tips-and-tricks',
      });

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: BlogStatus.PUBLISHED,
          category: { slug: 'tips-and-tricks' },
        },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 6,
      });
    });

    it('should filter by search query', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(2);

      await BlogService.getBlogPosts({
        search: 'test query',
      });

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: BlogStatus.PUBLISHED,
          OR: [
            { title: { contains: 'test query', mode: 'insensitive' } },
            { excerpt: { contains: 'test query', mode: 'insensitive' } },
            { content: { contains: 'test query', mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 6,
      });
    });

    it('should handle combined filters', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(1);

      await BlogService.getBlogPosts({
        categorySlug: 'tips-and-tricks',
        search: 'storage',
        status: BlogStatus.DRAFT,
      });

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: BlogStatus.DRAFT,
          category: { slug: 'tips-and-tricks' },
          OR: [
            { title: { contains: 'storage', mode: 'insensitive' } },
            { excerpt: { contains: 'storage', mode: 'insensitive' } },
            { content: { contains: 'storage', mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 6,
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.blogPost.findMany.mockRejectedValue(new Error('Database error'));

      await expect(BlogService.getBlogPosts()).rejects.toThrow('Database error');
    });
  });

  describe('getBlogPostBySlug', () => {
    it('should fetch a blog post by slug and increment view count', async () => {
      const mockPostWithBlocks = {
        ...mockBlogPost,
        contentBlocks: [
          {
            id: 1,
            blogPostId: 1,
            type: BlogContentBlockType.PARAGRAPH,
            content: 'Test content block',
            metadata: null,
            order: 1,
          },
        ],
      };

      mockPrisma.blogPost.findUnique.mockResolvedValue(mockPostWithBlocks);
      mockPrisma.blogPost.update.mockResolvedValue(mockPostWithBlocks);

      const result = await BlogService.getBlogPostBySlug('test-blog-post');

      expect(mockPrisma.blogPost.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-blog-post' },
        include: {
          category: true,
          contentBlocks: {
            orderBy: { order: 'asc' },
          },
        },
      });

      expect(mockPrisma.blogPost.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { viewCount: { increment: 1 } },
      });

      expect(result).toEqual(mockPostWithBlocks);
    });

    it('should return null for non-existent slug', async () => {
      mockPrisma.blogPost.findUnique.mockResolvedValue(null);

      const result = await BlogService.getBlogPostBySlug('non-existent-slug');

      expect(result).toBeNull();
      expect(mockPrisma.blogPost.update).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.blogPost.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(BlogService.getBlogPostBySlug('test-slug')).rejects.toThrow('Database error');
    });
  });

  describe('getFeaturedBlogPosts', () => {
    it('should fetch featured blog posts ordered by view count and publish date', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);

      const result = await BlogService.getFeaturedBlogPosts(3);

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: [
          { viewCount: 'desc' },
          { publishedAt: 'desc' },
        ],
        take: 3,
      });

      expect(result).toEqual(mockPosts);
    });

    it('should use default limit when not specified', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);

      await BlogService.getFeaturedBlogPosts();

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );
    });
  });

  describe('getPopularBlogPosts', () => {
    it('should fetch popular blog posts ordered by view count', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);

      const result = await BlogService.getPopularBlogPosts(5);

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      });

      expect(result).toEqual(mockPosts);
    });
  });

  describe('getRecentBlogPosts', () => {
    it('should fetch recent blog posts ordered by publish date', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);

      const result = await BlogService.getRecentBlogPosts(10);

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      });

      expect(result).toEqual(mockPosts);
    });
  });

  describe('getBlogCategories', () => {
    it('should fetch all categories with post counts', async () => {
      const mockCategories = [mockCategory];
      mockPrisma.blogCategory.findMany.mockResolvedValue(mockCategories);

      const result = await BlogService.getBlogCategories();

      expect(mockPrisma.blogCategory.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              posts: {
                where: { status: BlogStatus.PUBLISHED },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual(mockCategories);
    });
  });

  describe('getBlogCategoryBySlug', () => {
    it('should fetch a category by slug', async () => {
      const mockCategoryData = {
        id: 1,
        name: 'Tips and Tricks',
        slug: 'tips-and-tricks',
        description: 'Helpful tips',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.blogCategory.findUnique.mockResolvedValue(mockCategoryData);

      const result = await BlogService.getBlogCategoryBySlug('tips-and-tricks');

      expect(mockPrisma.blogCategory.findUnique).toHaveBeenCalledWith({
        where: { slug: 'tips-and-tricks' },
      });

      expect(result).toEqual(mockCategoryData);
    });

    it('should return null for non-existent category', async () => {
      mockPrisma.blogCategory.findUnique.mockResolvedValue(null);

      const result = await BlogService.getBlogCategoryBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchBlogPosts', () => {
    it('should search blog posts using getBlogPosts with search parameter', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
      mockPrisma.blogPost.count.mockResolvedValue(1);

      const result = await BlogService.searchBlogPosts('storage tips', {
        page: 2,
        limit: 5,
      });

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: BlogStatus.PUBLISHED,
          OR: [
            { title: { contains: 'storage tips', mode: 'insensitive' } },
            { excerpt: { contains: 'storage tips', mode: 'insensitive' } },
            { content: { contains: 'storage tips', mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        skip: 5,
        take: 5,
      });

      expect(result.posts).toEqual(mockPosts);
    });
  });

  describe('getRelatedBlogPosts', () => {
    it('should fetch related posts from the same category', async () => {
      const mockPosts = [mockBlogPost];
      mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);

      const result = await BlogService.getRelatedBlogPosts(1, 1, 3);

      expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
        where: {
          status: BlogStatus.PUBLISHED,
          categoryId: 1,
          NOT: { id: 1 },
        },
        include: { category: true },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      });

      expect(result).toEqual(mockPosts);
    });

    it('should return empty array when no category provided', async () => {
      const result = await BlogService.getRelatedBlogPosts(1, null, 3);

      expect(result).toEqual([]);
      expect(mockPrisma.blogPost.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getBlogStats', () => {
    it('should fetch blog statistics', async () => {
      mockPrisma.blogPost.count.mockResolvedValue(25);
      mockPrisma.blogCategory.count.mockResolvedValue(5);
      mockPrisma.blogPost.aggregate.mockResolvedValue({
        _sum: { viewCount: 1500 },
      });

      const result = await BlogService.getBlogStats();

      expect(mockPrisma.blogPost.count).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
      });
      expect(mockPrisma.blogCategory.count).toHaveBeenCalled();
      expect(mockPrisma.blogPost.aggregate).toHaveBeenCalledWith({
        where: { status: BlogStatus.PUBLISHED },
        _sum: { viewCount: true },
      });

      expect(result).toEqual({
        totalPosts: 25,
        totalCategories: 5,
        totalViews: 1500,
      });
    });

    it('should handle null view count sum', async () => {
      mockPrisma.blogPost.count.mockResolvedValue(0);
      mockPrisma.blogCategory.count.mockResolvedValue(0);
      mockPrisma.blogPost.aggregate.mockResolvedValue({
        _sum: { viewCount: null },
      });

      const result = await BlogService.getBlogStats();

      expect(result.totalViews).toBe(0);
    });
  });

  describe('Legacy compatibility methods', () => {
    describe('getAllBlogPosts', () => {
      it('should fetch all blog posts with high limit', async () => {
        const mockPosts = [mockBlogPost];
        mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
        mockPrisma.blogPost.count.mockResolvedValue(50);

        const result = await BlogService.getAllBlogPosts();

        expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
          where: { status: BlogStatus.PUBLISHED },
          include: { category: true },
          orderBy: { publishedAt: 'desc' },
          skip: 0,
          take: 100,
        });

        expect(result).toEqual(mockPosts);
      });
    });

    describe('getBlogPostsByCategory', () => {
      it('should convert category name to slug and fetch posts', async () => {
        const mockPosts = [mockBlogPost];
        mockPrisma.blogPost.findMany.mockResolvedValue(mockPosts);
        mockPrisma.blogPost.count.mockResolvedValue(3);

        const result = await BlogService.getBlogPostsByCategory('Tips and Tricks');

        expect(mockPrisma.blogPost.findMany).toHaveBeenCalledWith({
          where: {
            status: BlogStatus.PUBLISHED,
            category: { slug: 'tips-and-tricks' },
          },
          include: { category: true },
          orderBy: { publishedAt: 'desc' },
          skip: 0,
          take: 100,
        });

        expect(result).toEqual(mockPosts);
      });
    });

    describe('getAvailableCategories', () => {
      it('should return category names as strings', async () => {
        const mockCategories = [mockCategory];
        mockPrisma.blogCategory.findMany.mockResolvedValue(mockCategories);

        const result = await BlogService.getAvailableCategories();

        expect(result).toEqual(['Tips and Tricks']);
      });
    });

    describe('isValidCategory', () => {
      it('should return true for valid category', async () => {
        const mockCategoryData = {
          id: 1,
          name: 'Tips and Tricks',
          slug: 'tips-and-tricks',
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.blogCategory.findUnique.mockResolvedValue(mockCategoryData);

        const result = await BlogService.isValidCategory('Tips and Tricks');

        expect(mockPrisma.blogCategory.findUnique).toHaveBeenCalledWith({
          where: { slug: 'tips-and-tricks' },
        });
        expect(result).toBe(true);
      });

      it('should return false for invalid category', async () => {
        mockPrisma.blogCategory.findUnique.mockResolvedValue(null);

        const result = await BlogService.isValidCategory('Invalid Category');

        expect(result).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle Prisma connection errors', async () => {
      mockPrisma.blogPost.findMany.mockRejectedValue(new Error('Connection failed'));

      await expect(BlogService.getBlogPosts()).rejects.toThrow('Connection failed');
    });

    it('should handle invalid data types', async () => {
      mockPrisma.blogPost.findMany.mockResolvedValue(null as any);
      mockPrisma.blogPost.count.mockResolvedValue(0);

      const result = await BlogService.getBlogPosts();

      expect(result.posts).toBeNull();
      expect(result.totalCount).toBe(0);
    });
  });
});
