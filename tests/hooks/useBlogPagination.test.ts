/**
 * @fileoverview Jest tests for useBlogPagination hook
 * @source Created for boombox-11.0 hook testing
 */

import { renderHook, act } from '@testing-library/react';
import { useBlogPagination } from '@/hooks/useBlogPagination';
import { BlogPost } from '@/types/content.types';

// Mock the sortingUtils
jest.mock('@/lib/utils/sortingUtils', () => ({
  paginateItems: jest.fn(),
}));

const mockBlogPosts: BlogPost[] = [
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/test1.png',
    blogTitle: 'Test Article 1',
    blogDescription: 'Test description 1',
    author: 'Author 1',
    readTime: '5 min read',
    datePublished: 'January 1, 2023',
    link: '/blog/test-1',
  },
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/test2.png',
    blogTitle: 'Test Article 2',
    blogDescription: 'Test description 2',
    author: 'Author 2',
    readTime: '10 min read',
    datePublished: 'January 2, 2023',
    link: '/blog/test-2',
  },
  {
    category: 'Press',
    thumbnail: '/img/test3.png',
    blogTitle: 'Test Article 3',
    blogDescription: 'Test description 3',
    author: 'Author 3',
    readTime: '8 min read',
    datePublished: 'January 3, 2023',
    link: '/blog/test-3',
  },
  {
    category: 'Tips and Tricks',
    thumbnail: '/img/test4.png',
    blogTitle: 'Test Article 4',
    blogDescription: 'Test description 4',
    author: 'Author 4',
    readTime: '12 min read',
    datePublished: 'January 4, 2023',
    link: '/blog/test-4',
  },
];

describe('useBlogPagination', () => {
  const mockPaginateItems = require('@/lib/utils/sortingUtils').paginateItems;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockPaginateItems.mockImplementation((items, config) => ({
      currentItems: items.slice(0, config.itemsPerPage),
      totalPages: Math.ceil(items.length / config.itemsPerPage),
      hasNextPage: config.currentPage < Math.ceil(items.length / config.itemsPerPage),
      hasPrevPage: config.currentPage > 1,
      startIndex: 0,
      endIndex: Math.min(config.itemsPerPage, items.length),
    }));
  });

  describe('Initial State', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      expect(result.current.currentPage).toBe(1);
      expect(result.current.currentPosts).toHaveLength(3); // Default postsPerPage is 3
      expect(mockPaginateItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ category: 'Tips and Tricks' }),
        ]),
        expect.objectContaining({
          currentPage: 1,
          itemsPerPage: 3,
        })
      );
    });

    it('respects custom postsPerPage parameter', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
          postsPerPage: 2,
        })
      );

      expect(mockPaginateItems).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          itemsPerPage: 2,
        })
      );
    });
  });

  describe('Category Filtering', () => {
    it('filters posts by selected category', () => {
      renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      // Should only pass "Tips and Tricks" posts to paginateItems
      const filteredPosts = mockPaginateItems.mock.calls[0][0];
      expect(filteredPosts).toHaveLength(3); // 3 "Tips and Tricks" posts
      expect(filteredPosts.every((post: BlogPost) => post.category === 'Tips and Tricks')).toBe(true);
    });

    it('updates filtered posts when category changes', () => {
      const { result, rerender } = renderHook(
        ({ selectedCategory }) =>
          useBlogPagination({
            blogPosts: mockBlogPosts,
            selectedCategory,
          }),
        {
          initialProps: { selectedCategory: 'Tips and Tricks' as const },
        }
      );

      // Initial call with "Tips and Tricks"
      expect(mockPaginateItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ category: 'Tips and Tricks' }),
        ]),
        expect.any(Object)
      );

      // Change category to "Press"
      rerender({ selectedCategory: 'Press' as const });

      // Should now filter by "Press"
      const lastCall = mockPaginateItems.mock.calls[mockPaginateItems.mock.calls.length - 1];
      const filteredPosts = lastCall[0];
      expect(filteredPosts).toHaveLength(1); // 1 "Press" post
      expect(filteredPosts[0].category).toBe('Press');
    });
  });

  describe('Pagination Navigation', () => {
    beforeEach(() => {
      // Mock pagination result with multiple pages
      mockPaginateItems.mockReturnValue({
        currentItems: mockBlogPosts.slice(0, 2),
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 2,
      });
    });

    it('navigates to next page', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('navigates to previous page', () => {
      // Set up mock to simulate being on page 2 with ability to go back
      mockPaginateItems.mockImplementation((items, config) => {
        if (config.currentPage === 2) {
          return {
            currentItems: items.slice(2, 4),
            totalPages: 2,
            hasNextPage: false,
            hasPrevPage: true,
            startIndex: 2,
            endIndex: 4,
          };
        }
        // Default for page 1
        return {
          currentItems: items.slice(0, 2),
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
          startIndex: 0,
          endIndex: 2,
        };
      });

      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      // First go to page 2
      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);

      // Navigate to previous page
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('does not navigate beyond available pages', () => {
      mockPaginateItems.mockReturnValue({
        currentItems: mockBlogPosts.slice(0, 2),
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 2,
      });

      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      const initialPage = result.current.currentPage;

      // Try to go to next page when there is none
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(initialPage);

      // Try to go to previous page when on first page
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(initialPage);
    });

    it('sets specific page number', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.currentPage).toBe(3);
    });
  });

  describe('Category Change Handler', () => {
    it('resets to page 1 when category changes', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      // Go to page 2
      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);

      // Handle category change
      act(() => {
        result.current.handleCategoryChange('Press');
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty blog posts array', () => {
      mockPaginateItems.mockReturnValue({
        currentItems: [],
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 0,
      });

      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: [],
          selectedCategory: 'Tips and Tricks',
        })
      );

      expect(result.current.currentPosts).toHaveLength(0);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
    });

    it('handles category with no matching posts', () => {
      mockPaginateItems.mockReturnValue({
        currentItems: [],
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        startIndex: 0,
        endIndex: 0,
      });

      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Most Recent', // No posts with this category in mock data
        })
      );

      expect(result.current.currentPosts).toHaveLength(0);
      expect(result.current.totalPages).toBe(0);
    });
  });

  describe('Pagination Utility Integration', () => {
    it('calls paginateItems with correct parameters', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
          postsPerPage: 5,
        })
      );

      expect(mockPaginateItems).toHaveBeenCalledWith(
        expect.any(Array),
        {
          currentPage: 1,
          itemsPerPage: 5,
          totalItems: 3, // 3 "Tips and Tricks" posts
        }
      );
    });

    it('updates pagination when currentPage changes', () => {
      const { result } = renderHook(() =>
        useBlogPagination({
          blogPosts: mockBlogPosts,
          selectedCategory: 'Tips and Tricks',
        })
      );

      const initialCallCount = mockPaginateItems.mock.calls.length;

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(mockPaginateItems.mock.calls.length).toBeGreaterThan(initialCallCount);
      
      const lastCall = mockPaginateItems.mock.calls[mockPaginateItems.mock.calls.length - 1];
      expect(lastCall[1]).toEqual(
        expect.objectContaining({
          currentPage: 2,
        })
      );
    });
  });
});
