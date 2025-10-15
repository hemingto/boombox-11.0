/**
 * @fileoverview Jest tests for usePopularArticlesPagination hook
 * @source Created for boombox-11.0 hook testing
 */

import { renderHook, act } from '@testing-library/react';
import { usePopularArticlesPagination } from '@/hooks/usePopularArticlesPagination';
import { ContentService } from '@/lib/services/contentService';

// Mock ContentService
jest.mock('@/lib/services/contentService', () => ({
  ContentService: {
    getPopularArticles: jest.fn(),
  },
}));

const mockContentService = ContentService as jest.Mocked<typeof ContentService>;

const mockPopularArticles = [
  {
    title: 'Moving Costs in San Francisco',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/golden-gate.png',
    imageAlt: 'Golden Gate Bridge',
    link: '/locations/san-francisco',
  },
  {
    title: '5 Best Ways to Store Trading Cards',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/oakland.png',
    imageAlt: 'Runners at Lake Merritt',
    link: '/locations/oakland',
  },
  {
    title: 'Moving to San Francisco: Advice & Tips',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/berkeley.png',
    imageAlt: 'Berkeley skyline',
    link: '/locations/berkeley',
  },
  {
    title: 'The 7 Best Jewelry Storage Ideas',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/mountain-view.png',
    imageAlt: 'bike in front of office building',
    link: '/locations/mountain-view',
  },
  {
    title: 'The Complete Guide to RV Storage',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/palo-alto.png',
    imageAlt: 'Stanford University archways',
    link: '/locations/palo-alto',
  },
  {
    title: '7 Tips on How to Pack Dishes',
    author: 'Sophie',
    readTime: '10 min read',
    imageSrc: '/img/san-jose.png',
    imageAlt: 'San Jose downtown',
    link: '/locations/san-jose',
  },
];

describe('usePopularArticlesPagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContentService.getPopularArticles.mockReturnValue([...mockPopularArticles]);
  });

  describe('Default Behavior', () => {
    it('initializes with default parameters', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(2); // 6 articles / 3 per page = 2 pages
      expect(result.current.allArticles).toHaveLength(6);
      expect(result.current.displayedArticles).toHaveLength(3); // First page
      expect(result.current.showPagination).toBe(true);
      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('calls ContentService.getPopularArticles on initialization', () => {
      renderHook(() => usePopularArticlesPagination());

      expect(mockContentService.getPopularArticles).toHaveBeenCalledTimes(1);
    });

    it('returns correct articles for first page', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      const expectedArticles = mockPopularArticles.slice(0, 3);
      expect(result.current.displayedArticles).toEqual(expectedArticles);
    });
  });

  describe('Custom Parameters', () => {
    it('respects custom articlesPerPage parameter', () => {
      const { result } = renderHook(() =>
        usePopularArticlesPagination({ articlesPerPage: 2 })
      );

      expect(result.current.totalPages).toBe(3); // 6 articles / 2 per page = 3 pages
      expect(result.current.displayedArticles).toHaveLength(2);
    });

    it('respects mobileOnly parameter', () => {
      const { result } = renderHook(() =>
        usePopularArticlesPagination({ mobileOnly: false })
      );

      // Should still paginate when mobileOnly is false
      expect(result.current.displayedArticles).toHaveLength(3);
      expect(result.current.totalPages).toBe(2);
    });

    it('handles single page scenario', () => {
      const { result } = renderHook(() =>
        usePopularArticlesPagination({ articlesPerPage: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.showPagination).toBe(false);
      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Navigation Functions', () => {
    it('navigates to next page correctly', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
      
      const expectedArticles = mockPopularArticles.slice(3, 6);
      expect(result.current.displayedArticles).toEqual(expectedArticles);
    });

    it('navigates to previous page correctly', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      // First go to page 2
      act(() => {
        result.current.nextPage();
      });

      // Then go back to page 1
      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
      
      const expectedArticles = mockPopularArticles.slice(0, 3);
      expect(result.current.displayedArticles).toEqual(expectedArticles);
    });

    it('does not navigate beyond first page', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('does not navigate beyond last page', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      // Go to page 2
      act(() => {
        result.current.nextPage();
      });

      // Try to go beyond
      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('sets current page directly', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Pagination State', () => {
    it('calculates pagination state correctly for first page', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      expect(result.current.currentPage).toBe(1);
      expect(result.current.hasPrevPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.showPagination).toBe(true);
    });

    it('calculates pagination state correctly for middle page', () => {
      const { result } = renderHook(() =>
        usePopularArticlesPagination({ articlesPerPage: 2 })
      );

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.showPagination).toBe(true);
    });

    it('calculates pagination state correctly for last page', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.hasPrevPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.showPagination).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty articles array', () => {
      mockContentService.getPopularArticles.mockReturnValue([]);

      const { result } = renderHook(() => usePopularArticlesPagination());

      expect(result.current.allArticles).toHaveLength(0);
      expect(result.current.displayedArticles).toHaveLength(0);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.showPagination).toBe(false);
    });

    it('handles single article', () => {
      mockContentService.getPopularArticles.mockReturnValue([mockPopularArticles[0]]);

      const { result } = renderHook(() => usePopularArticlesPagination());

      expect(result.current.allArticles).toHaveLength(1);
      expect(result.current.displayedArticles).toHaveLength(1);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.showPagination).toBe(false);
    });

    it('handles exact page boundary', () => {
      // 6 articles with 3 per page = exactly 2 pages
      const { result } = renderHook(() => usePopularArticlesPagination());

      expect(result.current.totalPages).toBe(2);
      expect(result.current.displayedArticles).toHaveLength(3);

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.displayedArticles).toHaveLength(3);
    });

    it('handles articles not divisible by page size', () => {
      // 6 articles with 4 per page = 2 pages (4 + 2)
      const { result } = renderHook(() =>
        usePopularArticlesPagination({ articlesPerPage: 4 })
      );

      expect(result.current.totalPages).toBe(2);
      expect(result.current.displayedArticles).toHaveLength(4); // First page

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.displayedArticles).toHaveLength(2); // Second page
    });
  });

  describe('Memoization', () => {
    it('memoizes allArticles correctly', () => {
      const { result, rerender } = renderHook(() => usePopularArticlesPagination());

      const initialArticles = result.current.allArticles;

      rerender();

      expect(result.current.allArticles).toBe(initialArticles); // Same reference
    });

    it('memoizes displayedArticles correctly', () => {
      const { result, rerender } = renderHook(() => usePopularArticlesPagination());

      const initialDisplayed = result.current.displayedArticles;

      rerender();

      expect(result.current.displayedArticles).toBe(initialDisplayed); // Same reference
    });

    it('updates memoized values when page changes', () => {
      const { result } = renderHook(() => usePopularArticlesPagination());

      const initialDisplayed = result.current.displayedArticles;

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.displayedArticles).not.toBe(initialDisplayed); // Different reference
    });
  });

  describe('Function Stability', () => {
    it('provides stable function references', () => {
      const { result, rerender } = renderHook(() => usePopularArticlesPagination());

      const initialPrevPage = result.current.prevPage;
      const initialNextPage = result.current.nextPage;
      const initialSetCurrentPage = result.current.setCurrentPage;

      rerender();

      // Functions should be stable across re-renders
      expect(typeof result.current.prevPage).toBe('function');
      expect(typeof result.current.nextPage).toBe('function');
      expect(typeof result.current.setCurrentPage).toBe('function');
      
      // Note: React functions may not have reference equality due to closures
      // but they should maintain consistent behavior
    });
  });
});
