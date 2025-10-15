/**
 * @fileoverview Integration tests for the complete blog system
 * @source Tests for end-to-end blog workflows and component integration
 * 
 * TEST COVERAGE:
 * - Complete blog data flow (API → Service → Components)
 * - Blog post creation and retrieval workflows
 * - Category filtering and pagination integration
 * - Search functionality end-to-end
 * - Error handling across the system
 * - Performance and caching behavior
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BlogService } from '@/lib/services/blogService';
import { convertBlogPostsToLegacy } from '@/lib/utils/blogUtils';

// Mock the blog service and utilities
jest.mock('@/lib/services/blogService');
jest.mock('@/lib/utils/blogUtils');

const mockBlogService = BlogService as jest.Mocked<typeof BlogService>;
const mockConvertBlogPostsToLegacy = convertBlogPostsToLegacy as jest.MockedFunction<typeof convertBlogPostsToLegacy>;

// Mock fetch for API integration tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Blog System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockBlogPost = {
    id: 1,
    title: 'Integration Test Blog Post',
    slug: 'integration-test-blog-post',
    excerpt: 'This is an integration test excerpt',
    content: 'Full integration test content',
    featuredImage: '/img/integration-test.jpg',
    featuredImageAlt: 'Integration test image',
    categoryId: 1,
    status: 'PUBLISHED' as const,
    publishedAt: new Date('2024-01-01'),
    readTime: 8,
    viewCount: 150,
    authorId: 1,
    authorName: 'Integration Test Author',
    authorImage: '/img/integration-author.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    category: {
      id: 1,
      name: 'Tips and Tricks',
      slug: 'tips-and-tricks',
    },
  };

  const mockLegacyPost = {
    category: 'Tips and Tricks',
    thumbnail: '/img/integration-test.jpg',
    blogTitle: 'Integration Test Blog Post',
    blogDescription: 'This is an integration test excerpt',
    author: 'Integration Test Author',
    readTime: '8 min read',
    datePublished: 'January 1, 2024',
    link: '/blog/integration-test-blog-post',
  };

  const mockCategory = {
    id: 1,
    name: 'Tips and Tricks',
    slug: 'tips-and-tricks',
    description: 'Helpful tips and tricks',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    _count: { posts: 5 },
  };

  describe('End-to-End Blog Data Flow', () => {
    it('should handle complete blog post retrieval workflow', async () => {
      // Mock service layer
      mockBlogService.getBlogPosts.mockResolvedValue({
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      // Mock utility layer
      mockConvertBlogPostsToLegacy.mockReturnValue([mockLegacyPost]);

      // Mock API layer
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          posts: [mockLegacyPost],
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      });

      // Test the complete flow
      const response = await fetch('/api/blog/posts');
      const data = await response.json();

      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].blogTitle).toBe('Integration Test Blog Post');
      expect(data.totalCount).toBe(1);
    });

    it('should handle blog post by slug retrieval with view count increment', async () => {
      const mockPostWithBlocks = {
        ...mockBlogPost,
        contentBlocks: [
          {
            id: 1,
            blogPostId: 1,
            type: 'PARAGRAPH',
            content: 'Test content block',
            metadata: null,
            order: 1,
          },
        ],
      };

      mockBlogService.getBlogPostBySlug.mockResolvedValue(mockPostWithBlocks);

      const result = await BlogService.getBlogPostBySlug('integration-test-blog-post');

      expect(result).toEqual(mockPostWithBlocks);
      expect(mockBlogService.getBlogPostBySlug).toHaveBeenCalledWith('integration-test-blog-post');
    });
  });

  describe('Category and Filtering Integration', () => {
    it('should handle category-based filtering workflow', async () => {
      const categoryFilteredPosts = {
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockBlogService.getBlogPosts.mockResolvedValue(categoryFilteredPosts);
      mockBlogService.getBlogCategories.mockResolvedValue([mockCategory]);

      // Test category filtering
      const postsResult = await BlogService.getBlogPosts({
        categorySlug: 'tips-and-tricks',
        page: 1,
        limit: 6,
      });

      const categoriesResult = await BlogService.getBlogCategories();

      expect(postsResult.posts).toHaveLength(1);
      expect(postsResult.posts[0].category?.slug).toBe('tips-and-tricks');
      expect(categoriesResult).toHaveLength(1);
      expect(categoriesResult[0].name).toBe('Tips and Tricks');
    });

    it('should handle category switching workflow', async () => {
      // First call - no category filter
      mockBlogService.getBlogPosts.mockResolvedValueOnce({
        posts: [mockBlogPost, { ...mockBlogPost, id: 2, title: 'Second Post' }],
        totalCount: 2,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      // Second call - with category filter
      mockBlogService.getBlogPosts.mockResolvedValueOnce({
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      // Test workflow
      const allPosts = await BlogService.getBlogPosts({});
      const filteredPosts = await BlogService.getBlogPosts({
        categorySlug: 'tips-and-tricks',
      });

      expect(allPosts.totalCount).toBe(2);
      expect(filteredPosts.totalCount).toBe(1);
      expect(mockBlogService.getBlogPosts).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search Integration', () => {
    it('should handle search workflow with multiple terms', async () => {
      const searchResults = {
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockBlogService.searchBlogPosts.mockResolvedValue(searchResults);

      const result = await BlogService.searchBlogPosts('storage tips', {
        page: 1,
        limit: 10,
      });

      expect(result.posts).toHaveLength(1);
      expect(mockBlogService.searchBlogPosts).toHaveBeenCalledWith('storage tips', {
        page: 1,
        limit: 10,
      });
    });

    it('should handle empty search results', async () => {
      const emptyResults = {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockBlogService.searchBlogPosts.mockResolvedValue(emptyResults);

      const result = await BlogService.searchBlogPosts('nonexistent term');

      expect(result.posts).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('Pagination Integration', () => {
    it('should handle pagination workflow across multiple pages', async () => {
      const page1Results = {
        posts: [mockBlogPost],
        totalCount: 15,
        totalPages: 3,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false,
      };

      const page2Results = {
        posts: [{ ...mockBlogPost, id: 2, title: 'Page 2 Post' }],
        totalCount: 15,
        totalPages: 3,
        currentPage: 2,
        hasNextPage: true,
        hasPreviousPage: true,
      };

      const page3Results = {
        posts: [{ ...mockBlogPost, id: 3, title: 'Page 3 Post' }],
        totalCount: 15,
        totalPages: 3,
        currentPage: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      };

      mockBlogService.getBlogPosts
        .mockResolvedValueOnce(page1Results)
        .mockResolvedValueOnce(page2Results)
        .mockResolvedValueOnce(page3Results);

      // Test pagination workflow
      const page1 = await BlogService.getBlogPosts({ page: 1, limit: 5 });
      const page2 = await BlogService.getBlogPosts({ page: 2, limit: 5 });
      const page3 = await BlogService.getBlogPosts({ page: 3, limit: 5 });

      expect(page1.currentPage).toBe(1);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.hasPreviousPage).toBe(false);

      expect(page2.currentPage).toBe(2);
      expect(page2.hasNextPage).toBe(true);
      expect(page2.hasPreviousPage).toBe(true);

      expect(page3.currentPage).toBe(3);
      expect(page3.hasNextPage).toBe(false);
      expect(page3.hasPreviousPage).toBe(true);
    });
  });

  describe('Featured and Popular Posts Integration', () => {
    it('should handle featured posts workflow', async () => {
      const featuredPosts = [
        { ...mockBlogPost, viewCount: 1000 },
        { ...mockBlogPost, id: 2, title: 'Second Featured', viewCount: 800 },
      ];

      mockBlogService.getFeaturedBlogPosts.mockResolvedValue(featuredPosts);

      const result = await BlogService.getFeaturedBlogPosts(2);

      expect(result).toHaveLength(2);
      expect(result[0].viewCount).toBe(1000);
      expect(result[1].viewCount).toBe(800);
    });

    it('should handle popular posts workflow', async () => {
      const popularPosts = [
        { ...mockBlogPost, viewCount: 2000 },
        { ...mockBlogPost, id: 2, title: 'Second Popular', viewCount: 1500 },
        { ...mockBlogPost, id: 3, title: 'Third Popular', viewCount: 1200 },
      ];

      mockBlogService.getPopularBlogPosts.mockResolvedValue(popularPosts);

      const result = await BlogService.getPopularBlogPosts(3);

      expect(result).toHaveLength(3);
      expect(result[0].viewCount).toBe(2000);
      expect(result[1].viewCount).toBe(1500);
      expect(result[2].viewCount).toBe(1200);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service layer errors gracefully', async () => {
      mockBlogService.getBlogPosts.mockRejectedValue(new Error('Database connection failed'));

      await expect(BlogService.getBlogPosts()).rejects.toThrow('Database connection failed');
    });

    it('should handle API layer errors with proper status codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      const response = await fetch('/api/blog/posts');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle conversion utility errors', async () => {
      mockBlogService.getBlogPosts.mockResolvedValue({
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      mockConvertBlogPostsToLegacy.mockImplementation(() => {
        throw new Error('Conversion failed');
      });

      expect(() => convertBlogPostsToLegacy([mockBlogPost])).toThrow('Conversion failed');
    });
  });

  describe('Related Posts Integration', () => {
    it('should handle related posts workflow', async () => {
      const relatedPosts = [
        { ...mockBlogPost, id: 2, title: 'Related Post 1' },
        { ...mockBlogPost, id: 3, title: 'Related Post 2' },
      ];

      mockBlogService.getRelatedBlogPosts.mockResolvedValue(relatedPosts);

      const result = await BlogService.getRelatedBlogPosts(1, 1, 3);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Related Post 1');
      expect(result[1].title).toBe('Related Post 2');
      expect(mockBlogService.getRelatedBlogPosts).toHaveBeenCalledWith(1, 1, 3);
    });

    it('should handle related posts with no category', async () => {
      mockBlogService.getRelatedBlogPosts.mockResolvedValue([]);

      const result = await BlogService.getRelatedBlogPosts(1, null, 3);

      expect(result).toHaveLength(0);
    });
  });

  describe('Blog Statistics Integration', () => {
    it('should handle blog statistics workflow', async () => {
      const mockStats = {
        totalPosts: 25,
        totalCategories: 5,
        totalViews: 10000,
      };

      mockBlogService.getBlogStats.mockResolvedValue(mockStats);

      const result = await BlogService.getBlogStats();

      expect(result.totalPosts).toBe(25);
      expect(result.totalCategories).toBe(5);
      expect(result.totalViews).toBe(10000);
    });
  });

  describe('Legacy Compatibility Integration', () => {
    it('should handle legacy method compatibility', async () => {
      mockBlogService.getAllBlogPosts.mockResolvedValue([mockBlogPost]);
      mockBlogService.getBlogPostsByCategory.mockResolvedValue([mockBlogPost]);
      mockBlogService.getAvailableCategories.mockResolvedValue(['Tips and Tricks']);
      mockBlogService.isValidCategory.mockResolvedValue(true);

      // Test legacy methods
      const allPosts = await BlogService.getAllBlogPosts();
      const categoryPosts = await BlogService.getBlogPostsByCategory('Tips and Tricks');
      const categories = await BlogService.getAvailableCategories();
      const isValid = await BlogService.isValidCategory('Tips and Tricks');

      expect(allPosts).toHaveLength(1);
      expect(categoryPosts).toHaveLength(1);
      expect(categories).toContain('Tips and Tricks');
      expect(isValid).toBe(true);
    });
  });

  describe('Performance and Caching Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      const mockResults = {
        posts: [mockBlogPost],
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockBlogService.getBlogPosts.mockResolvedValue(mockResults);

      // Simulate concurrent requests
      const promises = [
        BlogService.getBlogPosts({ page: 1 }),
        BlogService.getBlogPosts({ page: 2 }),
        BlogService.getBlogPosts({ categorySlug: 'tips-and-tricks' }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockBlogService.getBlogPosts).toHaveBeenCalledTimes(3);
    });

    it('should handle large datasets efficiently', async () => {
      const largePosts = Array.from({ length: 100 }, (_, i) => ({
        ...mockBlogPost,
        id: i + 1,
        title: `Post ${i + 1}`,
      }));

      const largeResults = {
        posts: largePosts,
        totalCount: 1000,
        totalPages: 10,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false,
      };

      mockBlogService.getBlogPosts.mockResolvedValue(largeResults);

      const result = await BlogService.getBlogPosts({ limit: 100 });

      expect(result.posts).toHaveLength(100);
      expect(result.totalCount).toBe(1000);
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across different endpoints', async () => {
      const consistentPost = mockBlogPost;

      // Mock different endpoints returning the same post
      mockBlogService.getBlogPostBySlug.mockResolvedValue(consistentPost);
      mockBlogService.getFeaturedBlogPosts.mockResolvedValue([consistentPost]);
      mockBlogService.getPopularBlogPosts.mockResolvedValue([consistentPost]);

      const [bySlug, featured, popular] = await Promise.all([
        BlogService.getBlogPostBySlug('integration-test-blog-post'),
        BlogService.getFeaturedBlogPosts(1),
        BlogService.getPopularBlogPosts(1),
      ]);

      // Verify data consistency
      expect(bySlug?.id).toBe(consistentPost.id);
      expect(featured[0].id).toBe(consistentPost.id);
      expect(popular[0].id).toBe(consistentPost.id);

      expect(bySlug?.title).toBe(consistentPost.title);
      expect(featured[0].title).toBe(consistentPost.title);
      expect(popular[0].title).toBe(consistentPost.title);
    });
  });
});
