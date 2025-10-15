/**
 * @fileoverview Custom hook for fetching blog data from database
 * @source Created for boombox-11.0 database-driven blog system
 * @refactor Replaces static ContentService calls with async database queries
 */

'use client';

import { useState, useEffect } from 'react';
// Note: Using API routes instead of direct BlogService calls for client-side components
import { 
  BlogCategoryWithCount, 
  LegacyBlogPost,
  PopularArticle,
  FeaturedArticle 
} from '@/types/content.types';

/**
 * Hook for fetching all blog posts with category filtering
 */
export function useBlogData(categorySlug?: string) {
  const [posts, setPosts] = useState<LegacyBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          limit: '100', // Get all posts for now
        });
        
        if (categorySlug) {
          params.append('category', categorySlug);
        }
        
        const response = await fetch(`/api/blog/posts?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        setPosts(data.posts);
        setError(null);
      } catch (err) {
        setError('Failed to fetch blog posts');
        console.error('Error fetching blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [categorySlug]);

  return { posts, loading, error };
}

/**
 * Hook for fetching blog categories
 */
export function useBlogCategories() {
  const [categories, setCategories] = useState<BlogCategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/blog/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        setError('Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

/**
 * Hook for fetching popular articles
 */
export function usePopularArticles(limit: number = 6) {
  const [articles, setArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/blog/popular?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch popular articles');
        }
        
        const data = await response.json();
        setArticles(data.articles);
        setError(null);
      } catch (err) {
        setError('Failed to fetch popular articles');
        console.error('Error fetching popular articles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [limit]);

  return { articles, loading, error };
}

/**
 * Hook for fetching featured articles
 */
export function useFeaturedArticles(limit: number = 1) {
  const [articles, setArticles] = useState<FeaturedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/blog/featured?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch featured articles');
        }
        
        const data = await response.json();
        setArticles(data.articles);
        setError(null);
      } catch (err) {
        setError('Failed to fetch featured articles');
        console.error('Error fetching featured articles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [limit]);

  return { articles, loading, error };
}

/**
 * Hook for fetching recent articles
 */
export function useRecentArticles(limit: number = 5) {
  const [articles, setArticles] = useState<LegacyBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/blog/posts?limit=${limit}&sort=recent`);
        if (!response.ok) {
          throw new Error('Failed to fetch recent articles');
        }
        
        const data = await response.json();
        setArticles(data.posts);
        setError(null);
      } catch (err) {
        setError('Failed to fetch recent articles');
        console.error('Error fetching recent articles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [limit]);

  return { articles, loading, error };
}
