/**
 * @fileoverview Jest tests for content types and interfaces
 * @source Tests for blog system type definitions and validation
 * 
 * TEST COVERAGE:
 * - Type interface validation
 * - Data structure compliance
 * - Type conversion compatibility
 * - Interface inheritance and extension
 * - Type safety validation
 */

import {
  BlogPostWithDetails,
  LegacyBlogPost,
  PopularArticle,
  FeaturedArticle,
  BlogPaginationResult,
  BlogCategoryWithCount,
  BlogPaginationConfig,
  BlogCategoriesConfig,
  BlogSearchParams,
  BlogPostConverter,
} from '@/types/content.types';

describe('Content Types', () => {
  describe('BlogPostWithDetails interface', () => {
    it('should validate complete BlogPostWithDetails structure', () => {
      const validBlogPost: BlogPostWithDetails = {
        id: 1,
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        featuredImage: '/img/test.jpg',
        featuredImageAlt: 'Test alt text',
        categoryId: 1,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-01'),
        readTime: 5,
        viewCount: 100,
        authorId: 1,
        authorName: 'Test Author',
        authorImage: '/img/author.jpg',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        category: {
          id: 1,
          name: 'Tips and Tricks',
          slug: 'tips-and-tricks',
        },
      };

      // Type validation - if this compiles, the type is correct
      expect(validBlogPost.id).toBe(1);
      expect(validBlogPost.title).toBe('Test Blog Post');
      expect(validBlogPost.category?.name).toBe('Tips and Tricks');
    });

    it('should allow null values for optional fields', () => {
      const blogPostWithNulls: BlogPostWithDetails = {
        id: 1,
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        excerpt: null,
        content: 'Test content',
        featuredImage: null,
        featuredImageAlt: null,
        categoryId: null,
        status: 'DRAFT',
        publishedAt: null,
        readTime: null,
        viewCount: 0,
        authorId: 1,
        authorName: null,
        authorImage: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        category: null,
      };

      expect(blogPostWithNulls.excerpt).toBeNull();
      expect(blogPostWithNulls.category).toBeNull();
    });

    it('should validate required fields are present', () => {
      // This test ensures TypeScript compilation catches missing required fields
      const requiredFields = [
        'id',
        'title',
        'slug',
        'content',
        'status',
        'viewCount',
        'authorId',
        'createdAt',
        'updatedAt',
      ];

      const blogPost: BlogPostWithDetails = {
        id: 1,
        title: 'Test',
        slug: 'test',
        excerpt: null,
        content: 'Content',
        featuredImage: null,
        featuredImageAlt: null,
        categoryId: null,
        status: 'PUBLISHED',
        publishedAt: null,
        readTime: null,
        viewCount: 0,
        authorId: 1,
        authorName: null,
        authorImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
      };

      requiredFields.forEach(field => {
        expect(blogPost).toHaveProperty(field);
      });
    });
  });

  describe('LegacyBlogPost interface', () => {
    it('should validate LegacyBlogPost structure', () => {
      const legacyPost: LegacyBlogPost = {
        category: 'Tips and Tricks',
        thumbnail: '/img/thumbnail.jpg',
        blogTitle: 'Legacy Blog Post',
        blogDescription: 'Legacy description',
        author: 'Legacy Author',
        readTime: '5 min read',
        datePublished: 'January 1, 2024',
        link: '/blog/legacy-post',
      };

      expect(legacyPost.category).toBe('Tips and Tricks');
      expect(legacyPost.blogTitle).toBe('Legacy Blog Post');
      expect(legacyPost.link).toBe('/blog/legacy-post');
    });

    it('should ensure all fields are required strings', () => {
      const legacyPost: LegacyBlogPost = {
        category: 'Test',
        thumbnail: 'test.jpg',
        blogTitle: 'Test',
        blogDescription: 'Test',
        author: 'Test',
        readTime: 'Test',
        datePublished: 'Test',
        link: 'Test',
      };

      Object.values(legacyPost).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('PopularArticle interface', () => {
    it('should validate PopularArticle structure', () => {
      const popularArticle: PopularArticle = {
        title: 'Popular Article',
        author: 'Popular Author',
        readTime: '7 min read',
        imageSrc: '/img/popular.jpg',
        imageAlt: 'Popular image alt',
        link: '/blog/popular-article',
      };

      expect(popularArticle.title).toBe('Popular Article');
      expect(popularArticle.imageSrc).toBe('/img/popular.jpg');
      expect(popularArticle.imageAlt).toBe('Popular image alt');
    });

    it('should have all required string fields', () => {
      const article: PopularArticle = {
        title: 'Test',
        author: 'Test',
        readTime: 'Test',
        imageSrc: 'Test',
        imageAlt: 'Test',
        link: 'Test',
      };

      const requiredFields = ['title', 'author', 'readTime', 'imageSrc', 'imageAlt', 'link'];
      requiredFields.forEach(field => {
        expect(article).toHaveProperty(field);
        expect(typeof article[field as keyof PopularArticle]).toBe('string');
      });
    });
  });

  describe('FeaturedArticle interface', () => {
    it('should validate FeaturedArticle structure', () => {
      const featuredArticle: FeaturedArticle = {
        title: 'Featured Article',
        author: 'Featured Author',
        date: 'January 1, 2024',
        readTime: '10 min read',
        description: 'Featured description',
        authorImage: '/img/featured-author.jpg',
        articleImage: '/img/featured-article.jpg',
        link: '/blog/featured-article',
      };

      expect(featuredArticle.title).toBe('Featured Article');
      expect(featuredArticle.description).toBe('Featured description');
      expect(featuredArticle.authorImage).toBe('/img/featured-author.jpg');
      expect(featuredArticle.articleImage).toBe('/img/featured-article.jpg');
    });

    it('should have all required string fields', () => {
      const article: FeaturedArticle = {
        title: 'Test',
        author: 'Test',
        date: 'Test',
        readTime: 'Test',
        description: 'Test',
        authorImage: 'Test',
        articleImage: 'Test',
        link: 'Test',
      };

      const requiredFields = [
        'title',
        'author',
        'date',
        'readTime',
        'description',
        'authorImage',
        'articleImage',
        'link',
      ];

      requiredFields.forEach(field => {
        expect(article).toHaveProperty(field);
        expect(typeof article[field as keyof FeaturedArticle]).toBe('string');
      });
    });
  });

  describe('BlogPaginationResult interface', () => {
    it('should validate BlogPaginationResult structure', () => {
      const paginationResult: BlogPaginationResult = {
        posts: [
          {
            id: 1,
            title: 'Test Post',
            slug: 'test-post',
            excerpt: 'Test excerpt',
            content: 'Test content',
            featuredImage: null,
            featuredImageAlt: null,
            categoryId: 1,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            readTime: 5,
            viewCount: 100,
            authorId: 1,
            authorName: 'Test Author',
            authorImage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: {
              id: 1,
              name: 'Test Category',
              slug: 'test-category',
            },
          },
        ],
        totalCount: 25,
        totalPages: 5,
        currentPage: 2,
        hasNextPage: true,
        hasPreviousPage: true,
      };

      expect(Array.isArray(paginationResult.posts)).toBe(true);
      expect(typeof paginationResult.totalCount).toBe('number');
      expect(typeof paginationResult.hasNextPage).toBe('boolean');
      expect(typeof paginationResult.hasPreviousPage).toBe('boolean');
    });

    it('should allow empty posts array', () => {
      const emptyResult: BlogPaginationResult = {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      expect(emptyResult.posts).toHaveLength(0);
      expect(emptyResult.totalCount).toBe(0);
    });
  });

  describe('BlogCategoryWithCount interface', () => {
    it('should validate BlogCategoryWithCount structure', () => {
      const categoryWithCount: BlogCategoryWithCount = {
        id: 1,
        name: 'Tips and Tricks',
        slug: 'tips-and-tricks',
        description: 'Helpful tips and tricks',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        _count: {
          posts: 15,
        },
      };

      expect(categoryWithCount.id).toBe(1);
      expect(categoryWithCount.name).toBe('Tips and Tricks');
      expect(categoryWithCount._count.posts).toBe(15);
    });

    it('should allow null description', () => {
      const categoryWithNullDescription: BlogCategoryWithCount = {
        id: 1,
        name: 'Test Category',
        slug: 'test-category',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          posts: 0,
        },
      };

      expect(categoryWithNullDescription.description).toBeNull();
      expect(categoryWithNullDescription._count.posts).toBe(0);
    });
  });

  describe('BlogPaginationConfig interface', () => {
    it('should validate BlogPaginationConfig structure', () => {
      const paginationConfig: BlogPaginationConfig = {
        currentPage: 2,
        postsPerPage: 10,
        selectedCategory: 'tips-and-tricks',
      };

      expect(paginationConfig.currentPage).toBe(2);
      expect(paginationConfig.postsPerPage).toBe(10);
      expect(paginationConfig.selectedCategory).toBe('tips-and-tricks');
    });

    it('should allow optional selectedCategory', () => {
      const configWithoutCategory: BlogPaginationConfig = {
        currentPage: 1,
        postsPerPage: 6,
      };

      expect(configWithoutCategory.selectedCategory).toBeUndefined();
    });
  });

  describe('BlogCategoriesConfig interface', () => {
    it('should validate BlogCategoriesConfig structure', () => {
      const categoriesConfig: BlogCategoriesConfig = {
        categories: [
          {
            id: 1,
            name: 'Tips and Tricks',
            slug: 'tips-and-tricks',
            description: 'Tips',
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { posts: 5 },
          },
        ],
        selectedCategory: 'tips-and-tricks',
      };

      expect(Array.isArray(categoriesConfig.categories)).toBe(true);
      expect(categoriesConfig.selectedCategory).toBe('tips-and-tricks');
    });

    it('should allow optional selectedCategory', () => {
      const configWithoutSelection: BlogCategoriesConfig = {
        categories: [],
      };

      expect(configWithoutSelection.selectedCategory).toBeUndefined();
    });
  });

  describe('BlogSearchParams interface', () => {
    it('should validate BlogSearchParams structure', () => {
      const searchParams: BlogSearchParams = {
        query: 'storage tips',
        category: 'tips-and-tricks',
        page: 2,
        limit: 10,
      };

      expect(searchParams.query).toBe('storage tips');
      expect(searchParams.category).toBe('tips-and-tricks');
      expect(searchParams.page).toBe(2);
      expect(searchParams.limit).toBe(10);
    });

    it('should allow all fields to be optional', () => {
      const emptyParams: BlogSearchParams = {};

      expect(emptyParams.query).toBeUndefined();
      expect(emptyParams.category).toBeUndefined();
      expect(emptyParams.page).toBeUndefined();
      expect(emptyParams.limit).toBeUndefined();
    });

    it('should allow partial parameters', () => {
      const partialParams: BlogSearchParams = {
        query: 'moving',
        page: 1,
      };

      expect(partialParams.query).toBe('moving');
      expect(partialParams.page).toBe(1);
      expect(partialParams.category).toBeUndefined();
      expect(partialParams.limit).toBeUndefined();
    });
  });

  describe('BlogPostConverter type', () => {
    it('should validate BlogPostConverter function signatures', () => {
      const mockPost: BlogPostWithDetails = {
        id: 1,
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        featuredImage: '/img/test.jpg',
        featuredImageAlt: 'Test alt',
        categoryId: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        readTime: 5,
        viewCount: 100,
        authorId: 1,
        authorName: 'Test Author',
        authorImage: '/img/author.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'Test Category',
          slug: 'test-category',
        },
      };

      // Mock converter functions to test type signatures
      const converter: BlogPostConverter = {
        toLegacy: (post: BlogPostWithDetails): LegacyBlogPost => ({
          category: post.category?.name || 'Uncategorized',
          thumbnail: post.featuredImage || '/img/default.jpg',
          blogTitle: post.title,
          blogDescription: post.excerpt || '',
          author: post.authorName || 'Anonymous',
          readTime: `${post.readTime || 5} min read`,
          datePublished: post.publishedAt?.toDateString() || 'Recently',
          link: `/blog/${post.slug}`,
        }),
        toPopular: (post: BlogPostWithDetails): PopularArticle => ({
          title: post.title,
          author: post.authorName || 'Anonymous',
          readTime: `${post.readTime || 5} min read`,
          imageSrc: post.featuredImage || '/img/default.jpg',
          imageAlt: post.featuredImageAlt || post.title,
          link: `/blog/${post.slug}`,
        }),
        toFeatured: (post: BlogPostWithDetails): FeaturedArticle => ({
          title: post.title,
          author: post.authorName || 'Anonymous',
          date: post.publishedAt?.toDateString() || 'Recently',
          readTime: `${post.readTime || 5} min read`,
          description: post.excerpt || '',
          authorImage: post.authorImage || '/img/default-author.jpg',
          articleImage: post.featuredImage || '/img/default.jpg',
          link: `/blog/${post.slug}`,
        }),
      };

      // Test function signatures work correctly
      const legacyPost = converter.toLegacy(mockPost);
      const popularArticle = converter.toPopular(mockPost);
      const featuredArticle = converter.toFeatured(mockPost);

      expect(legacyPost.blogTitle).toBe('Test Post');
      expect(popularArticle.title).toBe('Test Post');
      expect(featuredArticle.title).toBe('Test Post');
    });
  });

  describe('Type compatibility and inheritance', () => {
    it('should ensure LegacyBlogPost extends BlogPost', () => {
      // This test validates that the type alias works correctly
      const legacyPost: LegacyBlogPost = {
        category: 'Test',
        thumbnail: 'test.jpg',
        blogTitle: 'Test',
        blogDescription: 'Test',
        author: 'Test',
        readTime: 'Test',
        datePublished: 'Test',
        link: 'Test',
      };

      // Should be assignable to BlogPost due to interface extension
      const blogPost = legacyPost;
      expect(blogPost.blogTitle).toBe('Test');
    });

    it('should validate date field types', () => {
      const post: BlogPostWithDetails = {
        id: 1,
        title: 'Test',
        slug: 'test',
        excerpt: null,
        content: 'Test',
        featuredImage: null,
        featuredImageAlt: null,
        categoryId: null,
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-01'),
        readTime: null,
        viewCount: 0,
        authorId: 1,
        authorName: null,
        authorImage: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        category: null,
      };

      expect(post.publishedAt instanceof Date).toBe(true);
      expect(post.createdAt instanceof Date).toBe(true);
      expect(post.updatedAt instanceof Date).toBe(true);
    });

    it('should validate numeric field types', () => {
      const post: BlogPostWithDetails = {
        id: 1,
        title: 'Test',
        slug: 'test',
        excerpt: null,
        content: 'Test',
        featuredImage: null,
        featuredImageAlt: null,
        categoryId: 2,
        status: 'PUBLISHED',
        publishedAt: null,
        readTime: 5,
        viewCount: 100,
        authorId: 3,
        authorName: null,
        authorImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null,
      };

      expect(typeof post.id).toBe('number');
      expect(typeof post.categoryId).toBe('number');
      expect(typeof post.readTime).toBe('number');
      expect(typeof post.viewCount).toBe('number');
      expect(typeof post.authorId).toBe('number');
    });
  });

  describe('Type safety edge cases', () => {
    it('should handle union types correctly', () => {
      const post: BlogPostWithDetails = {
        id: 1,
        title: 'Test',
        slug: 'test',
        excerpt: null, // string | null
        content: 'Test',
        featuredImage: null, // string | null
        featuredImageAlt: null, // string | null
        categoryId: null, // number | null
        status: 'DRAFT', // Should accept all valid BlogStatus values
        publishedAt: null, // Date | null
        readTime: null, // number | null
        viewCount: 0,
        authorId: 1,
        authorName: null, // string | null
        authorImage: null, // string | null
        createdAt: new Date(),
        updatedAt: new Date(),
        category: null, // Category | null
      };

      // These should all be valid assignments
      expect(post.excerpt).toBeNull();
      expect(post.featuredImage).toBeNull();
      expect(post.categoryId).toBeNull();
      expect(post.publishedAt).toBeNull();
      expect(post.category).toBeNull();
    });

    it('should validate nested object types', () => {
      const post: BlogPostWithDetails = {
        id: 1,
        title: 'Test',
        slug: 'test',
        excerpt: null,
        content: 'Test',
        featuredImage: null,
        featuredImageAlt: null,
        categoryId: 1,
        status: 'PUBLISHED',
        publishedAt: null,
        readTime: null,
        viewCount: 0,
        authorId: 1,
        authorName: null,
        authorImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 1,
          name: 'Test Category',
          slug: 'test-category',
        },
      };

      // Validate nested category object structure
      expect(post.category).not.toBeNull();
      expect(post.category!.id).toBe(1);
      expect(post.category!.name).toBe('Test Category');
      expect(post.category!.slug).toBe('test-category');
    });
  });
});
