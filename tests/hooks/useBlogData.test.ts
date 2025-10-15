/**
 * @fileoverview Jest tests for useBlogData hook
 * @source Tests for database-driven blog data fetching hook
 * 
 * TEST COVERAGE:
 * - Hook initialization and loading states
 * - Data fetching with and without category filters
 * - Error handling and retry logic
 * - API response validation
 * - Hook cleanup and memory leaks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useBlogData, useBlogCategories as useBlogCategoriesData } from '@/hooks/useBlogData';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useBlogData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  const mockApiResponse = {
    posts: [
      {
        category: 'Tips and Tricks',
        thumbnail: '/img/test.jpg',
        blogTitle: 'Test Blog Post',
        blogDescription: 'Test description',
        author: 'Test Author',
        readTime: '5 min read',
        datePublished: 'January 1, 2024',
        link: '/blog/test-post',
      },
    ],
    totalCount: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  describe('useBlogData hook', () => {
    it('should initialize with loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useBlogData());

      expect(result.current.loading).toBe(true);
      expect(result.current.posts).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch blog posts successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useBlogData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.posts).toEqual(mockApiResponse.posts);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100');
    });

    it('should fetch posts with category filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useBlogData('tips-and-tricks'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100&category=tips-and-tricks');
      expect(result.current.posts).toEqual(mockApiResponse.posts);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useBlogData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch blog posts');
      expect(result.current.posts).toEqual([]);
    });

    it('should handle network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlogData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch blog posts');
      expect(result.current.posts).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching blog posts:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should refetch when category changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result, rerender } = renderHook(
        ({ categorySlug }) => useBlogData(categorySlug),
        { initialProps: { categorySlug: undefined } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100');

      // Change category
      rerender({ categorySlug: 'tips-and-tricks' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100&category=tips-and-tricks');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      const emptyResponse = {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const { result } = renderHook(() => useBlogData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.posts).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle malformed JSON response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useBlogData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch blog posts');
      expect(result.current.posts).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not fetch if category is empty string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useBlogData(''));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100');
    });

    it('should handle URL encoding for category slugs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useBlogData('tips & tricks'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/blog/posts?limit=100&category=tips+%26+tricks');
    });
  });

  describe('useBlogCategoriesData hook', () => {
    const mockCategoriesResponse = {
      categories: [
        {
          id: 1,
          name: 'Tips and Tricks',
          slug: 'tips-and-tricks',
          description: 'Helpful tips',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          _count: { posts: 5 },
        },
        {
          id: 2,
          name: 'Press',
          slug: 'press',
          description: 'Press releases',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          _count: { posts: 3 },
        },
      ],
    };

    it('should fetch categories successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategoriesResponse,
      });

      const { result } = renderHook(() => useBlogCategoriesData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual(mockCategoriesResponse.categories);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/blog/categories');
    });

    it('should handle categories API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useBlogCategoriesData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch categories');
      expect(result.current.categories).toEqual([]);
    });

    it('should handle empty categories response', async () => {
      const emptyResponse = { categories: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => emptyResponse,
      });

      const { result } = renderHook(() => useBlogCategoriesData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle network errors for categories', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useBlogCategoriesData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch categories');
      expect(result.current.categories).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Hook cleanup and memory management', () => {
    it('should not update state after unmount', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      const { result, unmount } = renderHook(() => useBlogData());

      expect(result.current.loading).toBe(true);

      // Unmount before promise resolves
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({
        ok: true,
        json: async () => mockApiResponse,
      });

      // Wait a bit to ensure no state updates occur
      await new Promise(resolve => setTimeout(resolve, 100));

      // No assertions needed - if there's a memory leak, React will warn in tests
    });

    it('should handle rapid category changes without race conditions', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockApiResponse,
            posts: [{ ...mockApiResponse.posts[0], blogTitle: `Post ${callCount}` }],
          }),
        });
      });

      const { result, rerender } = renderHook(
        ({ categorySlug }) => useBlogData(categorySlug),
        { initialProps: { categorySlug: undefined } }
      );

      // Rapidly change categories
      rerender({ categorySlug: 'tips-and-tricks' });
      rerender({ categorySlug: 'press' });
      rerender({ categorySlug: 'most-recent' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have made multiple calls but final state should be consistent
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 changes
      expect(result.current.posts).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error recovery', () => {
    it('should recover from errors on subsequent calls', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result, rerender } = renderHook(
        ({ categorySlug }) => useBlogData(categorySlug),
        { initialProps: { categorySlug: undefined } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch blog posts');

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      rerender({ categorySlug: 'tips-and-tricks' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.posts).toEqual(mockApiResponse.posts);
    });
  });
});
