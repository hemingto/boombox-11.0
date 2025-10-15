/**
 * @fileoverview Jest tests for blog utility functions
 * @source Tests for blog data conversion and formatting utilities
 * 
 * TEST COVERAGE:
 * - Data conversion functions (toLegacy, toPopular, toFeatured)
 * - Date and time formatting utilities
 * - Slug generation and validation
 * - Batch conversion functions
 * - Edge cases and error handling
 */

import {
  convertToLegacyBlogPost,
  convertToPopularArticle,
  convertToFeaturedArticle,
  formatReadTime,
  formatPublishDate,
  createSlug,
  extractReadTime,
  convertBlogPostsToLegacy,
  convertBlogPostsToPopular,
  getCategorySlug,
  getCategoryName,
} from '@/lib/utils/blogUtils';
import { BlogPostWithDetails } from '@/types/content.types';

describe('blogUtils', () => {
  const mockBlogPost: BlogPostWithDetails = {
    id: 1,
    title: 'Test Blog Post Title',
    slug: 'test-blog-post-title',
    excerpt: 'This is a test excerpt for the blog post',
    content: 'Full content of the blog post goes here',
    featuredImage: '/img/test-featured.jpg',
    featuredImageAlt: 'Test featured image alt text',
    categoryId: 1,
    status: 'PUBLISHED',
    publishedAt: new Date('2024-01-15T10:30:00Z'),
    readTime: 7,
    viewCount: 250,
    authorId: 1,
    authorName: 'John Doe',
    authorImage: '/img/john-doe.jpg',
    createdAt: new Date('2024-01-10T08:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    category: {
      id: 1,
      name: 'Tips and Tricks',
      slug: 'tips-and-tricks',
    },
  };

  describe('convertToLegacyBlogPost', () => {
    it('should convert database post to legacy format', () => {
      const result = convertToLegacyBlogPost(mockBlogPost);

      expect(result).toEqual({
        category: 'Tips and Tricks',
        thumbnail: '/img/test-featured.jpg',
        blogTitle: 'Test Blog Post Title',
        blogDescription: 'This is a test excerpt for the blog post',
        author: 'John Doe',
        readTime: '7 min read',
        datePublished: 'January 15, 2024',
        link: '/blog/test-blog-post-title',
      });
    });

    it('should handle null category', () => {
      const postWithoutCategory = { ...mockBlogPost, category: null };
      const result = convertToLegacyBlogPost(postWithoutCategory);

      expect(result.category).toBe('Uncategorized');
    });

    it('should handle null featured image', () => {
      const postWithoutImage = { ...mockBlogPost, featuredImage: null };
      const result = convertToLegacyBlogPost(postWithoutImage);

      expect(result.thumbnail).toBe('/img/default-blog.png');
    });

    it('should handle null excerpt', () => {
      const postWithoutExcerpt = { ...mockBlogPost, excerpt: null };
      const result = convertToLegacyBlogPost(postWithoutExcerpt);

      expect(result.blogDescription).toBe('');
    });

    it('should handle null author name', () => {
      const postWithoutAuthor = { ...mockBlogPost, authorName: null };
      const result = convertToLegacyBlogPost(postWithoutAuthor);

      expect(result.author).toBe('Anonymous');
    });

    it('should handle null read time', () => {
      const postWithoutReadTime = { ...mockBlogPost, readTime: null };
      const result = convertToLegacyBlogPost(postWithoutReadTime);

      expect(result.readTime).toBe('5 min read');
    });

    it('should handle null publish date', () => {
      const postWithoutDate = { ...mockBlogPost, publishedAt: null };
      const result = convertToLegacyBlogPost(postWithoutDate);

      expect(result.datePublished).toBe('Recently');
    });
  });

  describe('convertToPopularArticle', () => {
    it('should convert database post to popular article format', () => {
      const result = convertToPopularArticle(mockBlogPost);

      expect(result).toEqual({
        title: 'Test Blog Post Title',
        author: 'John Doe',
        readTime: '7 min read',
        imageSrc: '/img/test-featured.jpg',
        imageAlt: 'Test featured image alt text',
        link: '/blog/test-blog-post-title',
      });
    });

    it('should handle null featured image', () => {
      const postWithoutImage = {
        ...mockBlogPost,
        featuredImage: null,
        featuredImageAlt: null,
      };
      const result = convertToPopularArticle(postWithoutImage);

      expect(result.imageSrc).toBe('/img/default-blog.png');
      expect(result.imageAlt).toBe('Test Blog Post Title');
    });

    it('should handle null author name', () => {
      const postWithoutAuthor = { ...mockBlogPost, authorName: null };
      const result = convertToPopularArticle(postWithoutAuthor);

      expect(result.author).toBe('Anonymous');
    });

    it('should handle null read time', () => {
      const postWithoutReadTime = { ...mockBlogPost, readTime: null };
      const result = convertToPopularArticle(postWithoutReadTime);

      expect(result.readTime).toBe('5 min read');
    });
  });

  describe('convertToFeaturedArticle', () => {
    it('should convert database post to featured article format', () => {
      const result = convertToFeaturedArticle(mockBlogPost);

      expect(result).toEqual({
        title: 'Test Blog Post Title',
        author: 'John Doe',
        date: 'January 15, 2024',
        readTime: '7 min read',
        description: 'This is a test excerpt for the blog post',
        authorImage: '/img/john-doe.jpg',
        articleImage: '/img/test-featured.jpg',
        link: '/blog/test-blog-post-title',
      });
    });

    it('should handle null excerpt', () => {
      const postWithoutExcerpt = { ...mockBlogPost, excerpt: null };
      const result = convertToFeaturedArticle(postWithoutExcerpt);

      expect(result.description).toBe('');
    });

    it('should handle null author image', () => {
      const postWithoutAuthorImage = { ...mockBlogPost, authorImage: null };
      const result = convertToFeaturedArticle(postWithoutAuthorImage);

      expect(result.authorImage).toBe('/img/default-author.png');
    });

    it('should handle null featured image', () => {
      const postWithoutImage = { ...mockBlogPost, featuredImage: null };
      const result = convertToFeaturedArticle(postWithoutImage);

      expect(result.articleImage).toBe('/img/default-blog.png');
    });
  });

  describe('formatReadTime', () => {
    it('should format read time correctly', () => {
      expect(formatReadTime(1)).toBe('1 min read');
      expect(formatReadTime(5)).toBe('5 min read');
      expect(formatReadTime(15)).toBe('15 min read');
    });

    it('should handle null read time', () => {
      expect(formatReadTime(null)).toBe('5 min read');
    });

    it('should handle zero read time', () => {
      expect(formatReadTime(0)).toBe('5 min read');
    });

    it('should handle negative read time', () => {
      expect(formatReadTime(-5)).toBe('-5 min read');
    });
  });

  describe('formatPublishDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatPublishDate(date);
      expect(result).toBe('January 15, 2024');
    });

    it('should handle null date', () => {
      expect(formatPublishDate(null)).toBe('Recently');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2024-12-31T23:59:59Z');
      expect(formatPublishDate(date1)).toBe('December 31, 2024');

      const date2 = new Date('2024-06-01T00:00:00Z');
      expect(formatPublishDate(date2)).toBe('May 31, 2024'); // UTC conversion
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      // Invalid dates will throw an error in Intl.DateTimeFormat
      expect(() => formatPublishDate(invalidDate)).toThrow();
    });
  });

  describe('createSlug', () => {
    it('should create URL-friendly slugs', () => {
      expect(createSlug('Test Blog Post Title')).toBe('test-blog-post-title');
      expect(createSlug('Tips & Tricks for Storage')).toBe('tips-tricks-for-storage');
      expect(createSlug('Moving: A Complete Guide!')).toBe('moving-a-complete-guide');
    });

    it('should handle special characters', () => {
      expect(createSlug('Test@#$%^&*()Post')).toBe('test-post');
      expect(createSlug('Post with "quotes" and spaces')).toBe('post-with-quotes-and-spaces');
    });

    it('should handle multiple spaces and dashes', () => {
      expect(createSlug('Test    Multiple    Spaces')).toBe('test-multiple-spaces');
      expect(createSlug('Test---Multiple---Dashes')).toBe('test-multiple-dashes');
    });

    it('should handle leading and trailing spaces', () => {
      expect(createSlug('  Test Post  ')).toBe('test-post');
      expect(createSlug('---Test Post---')).toBe('test-post');
    });

    it('should handle empty strings', () => {
      expect(createSlug('')).toBe('');
      expect(createSlug('   ')).toBe('');
    });

    it('should handle numbers', () => {
      expect(createSlug('Top 10 Storage Tips')).toBe('top-10-storage-tips');
      expect(createSlug('2024 Moving Guide')).toBe('2024-moving-guide');
    });
  });

  describe('extractReadTime', () => {
    it('should extract read time from strings', () => {
      expect(extractReadTime('5 min read')).toBe(5);
      expect(extractReadTime('15 min read')).toBe(15);
      expect(extractReadTime('1 minute read')).toBe(1);
    });

    it('should handle different formats', () => {
      expect(extractReadTime('Read time: 8 minutes')).toBe(8);
      expect(extractReadTime('Approximately 12 min')).toBe(12);
      expect(extractReadTime('3min')).toBe(3);
    });

    it('should handle strings without numbers', () => {
      expect(extractReadTime('Quick read')).toBe(5);
      expect(extractReadTime('Long article')).toBe(5);
      expect(extractReadTime('')).toBe(5);
    });

    it('should handle multiple numbers', () => {
      expect(extractReadTime('Published on 2024-01-15, 7 min read')).toBe(2024);
    });
  });

  describe('convertBlogPostsToLegacy', () => {
    it('should convert array of posts to legacy format', () => {
      const posts = [mockBlogPost, { ...mockBlogPost, id: 2, title: 'Second Post' }];
      const result = convertBlogPostsToLegacy(posts);

      expect(result).toHaveLength(2);
      expect(result[0].blogTitle).toBe('Test Blog Post Title');
      expect(result[1].blogTitle).toBe('Second Post');
    });

    it('should handle empty array', () => {
      const result = convertBlogPostsToLegacy([]);
      expect(result).toEqual([]);
    });

    it('should handle posts with missing data', () => {
      const postsWithMissingData = [
        { ...mockBlogPost, category: null, authorName: null },
        { ...mockBlogPost, id: 2, featuredImage: null, excerpt: null },
      ];

      const result = convertBlogPostsToLegacy(postsWithMissingData);

      expect(result[0].category).toBe('Uncategorized');
      expect(result[0].author).toBe('Anonymous');
      expect(result[1].thumbnail).toBe('/img/default-blog.png');
      expect(result[1].blogDescription).toBe('');
    });
  });

  describe('convertBlogPostsToPopular', () => {
    it('should convert array of posts to popular format', () => {
      const posts = [mockBlogPost, { ...mockBlogPost, id: 2, title: 'Popular Post' }];
      const result = convertBlogPostsToPopular(posts);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Test Blog Post Title');
      expect(result[1].title).toBe('Popular Post');
    });

    it('should handle empty array', () => {
      const result = convertBlogPostsToPopular([]);
      expect(result).toEqual([]);
    });
  });

  describe('getCategorySlug', () => {
    it('should convert category names to slugs', () => {
      expect(getCategorySlug('Tips and Tricks')).toBe('tips-and-tricks');
      expect(getCategorySlug('Most Recent')).toBe('most-recent');
      expect(getCategorySlug('Press')).toBe('press');
    });

    it('should handle special characters', () => {
      expect(getCategorySlug('Tips & Tricks')).toBe('tips-&-tricks');
      expect(getCategorySlug('Storage: Best Practices')).toBe('storage:-best-practices');
    });

    it('should handle multiple spaces', () => {
      expect(getCategorySlug('Tips    and    Tricks')).toBe('tips-and-tricks');
    });

    it('should handle empty strings', () => {
      expect(getCategorySlug('')).toBe('');
    });
  });

  describe('getCategoryName', () => {
    it('should convert slugs to category names', () => {
      expect(getCategoryName('tips-and-tricks')).toBe('Tips And Tricks');
      expect(getCategoryName('most-recent')).toBe('Most Recent');
      expect(getCategoryName('press')).toBe('Press');
    });

    it('should handle single words', () => {
      expect(getCategoryName('storage')).toBe('Storage');
      expect(getCategoryName('moving')).toBe('Moving');
    });

    it('should handle empty strings', () => {
      expect(getCategoryName('')).toBe('');
    });

    it('should handle slugs with numbers', () => {
      expect(getCategoryName('top-10-tips')).toBe('Top 10 Tips');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined values gracefully', () => {
      const postWithUndefined = {
        ...mockBlogPost,
        title: undefined as any,
        excerpt: undefined as any,
        authorName: undefined as any,
      };

      const legacyResult = convertToLegacyBlogPost(postWithUndefined);
      expect(legacyResult.blogTitle).toBe(undefined);
      expect(legacyResult.blogDescription).toBe('');
      expect(legacyResult.author).toBe('Anonymous');
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(1000);
      const postWithLongTitle = { ...mockBlogPost, title: longTitle };
      
      const result = convertToLegacyBlogPost(postWithLongTitle);
      expect(result.blogTitle).toBe(longTitle);
      
      const slug = createSlug(longTitle);
      expect(slug).toBe('a'.repeat(1000));
    });

    it('should handle special date edge cases', () => {
      const futureDate = new Date('2030-12-31T23:59:59Z');
      const veryOldDate = new Date('1900-01-01T00:00:00Z');
      
      expect(formatPublishDate(futureDate)).toBe('December 31, 2030');
      expect(formatPublishDate(veryOldDate)).toBe('December 31, 1899'); // UTC conversion
    });

    it('should handle extreme read times', () => {
      expect(formatReadTime(0)).toBe('5 min read');
      expect(formatReadTime(1000)).toBe('1000 min read');
      expect(formatReadTime(-100)).toBe('-100 min read');
    });

    it('should handle malformed data structures', () => {
      const malformedPost = {
        ...mockBlogPost,
        category: { name: null } as any,
      };

      const result = convertToLegacyBlogPost(malformedPost);
      expect(result.category).toBe('Uncategorized');
    });
  });
});
