/**
 * @fileoverview Content types for database-driven blog system
 * @source Migrated from static content types to database-compatible interfaces
 * @refactor Updated to work with Prisma database models and BlogService
 */

// Re-export Prisma types for consistency
export type { 
  BlogPost as PrismaBlogPost, 
  BlogCategory as PrismaBlogCategory, 
  BlogStatus, 
  BlogContentBlock 
} from '@prisma/client';

/**
 * Extended blog post with relations (for component compatibility)
 */
export interface BlogPostWithDetails {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  categoryId: number | null;
  status: string;
  publishedAt: Date | null;
  readTime: number | null;
  viewCount: number;
  authorId: number;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

/**
 * Legacy blog post interface (for backward compatibility with existing components)
 * Maps database fields to component expectations
 */
export interface LegacyBlogPost {
  /** Post category name */
  category: string;
  /** Thumbnail image path (maps to featuredImage) */
  thumbnail: string;
  /** Blog post title */
  blogTitle: string;
  /** Short description (maps to excerpt) */
  blogDescription: string;
  /** Author name */
  author: string;
  /** Read time estimate (formatted string) */
  readTime: string;
  /** Publication date (formatted string) */
  datePublished: string;
  /** Post URL/link (maps to slug) */
  link: string;
}

/**
 * Popular article interface (for popular articles components)
 */
export interface PopularArticle {
  /** Article title */
  title: string;
  /** Author name */
  author: string;
  /** Estimated read time */
  readTime: string;
  /** Image source path */
  imageSrc: string;
  /** Image alt text for accessibility */
  imageAlt: string;
  /** Link to article */
  link: string;
}

/**
 * Featured article interface (for blog hero sections)
 */
export interface FeaturedArticle {
  /** Article title */
  title: string;
  /** Author name */
  author: string;
  /** Publication date */
  date: string;
  /** Estimated read time */
  readTime: string;
  /** Article description/excerpt */
  description: string;
  /** Author profile image path */
  authorImage: string;
  /** Featured article image path */
  articleImage: string;
  /** Link to full article */
  link: string;
}

/**
 * Blog pagination result (updated for database service)
 */
export interface BlogPaginationResult {
  /** Posts for current page */
  posts: BlogPostWithDetails[];
  /** Total number of posts */
  totalCount: number;
  /** Total number of pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Blog category with post count
 */
export interface BlogCategoryWithCount {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    posts: number;
  };
}

/**
 * Blog pagination configuration
 */
export interface BlogPaginationConfig {
  /** Current page number (1-based) */
  currentPage: number;
  /** Number of posts per page */
  postsPerPage: number;
  /** Selected category slug */
  selectedCategory?: string;
}

/**
 * Blog categories configuration (updated for database)
 */
export interface BlogCategoriesConfig {
  /** Available categories */
  categories: BlogCategoryWithCount[];
  /** Currently selected category slug */
  selectedCategory?: string;
}

/**
 * Blog search parameters
 */
export interface BlogSearchParams {
  /** Search query */
  query?: string;
  /** Category filter */
  category?: string;
  /** Page number */
  page?: number;
  /** Number of results per page */
  limit?: number;
}

/**
 * Utility type for converting database posts to legacy format
 */
export type BlogPostConverter = {
  toLegacy: (post: BlogPostWithDetails) => LegacyBlogPost;
  toPopular: (post: BlogPostWithDetails) => PopularArticle;
  toFeatured: (post: BlogPostWithDetails) => FeaturedArticle;
};

// Legacy type aliases for backward compatibility
export type BlogCategory = string;
export interface BlogPost extends LegacyBlogPost {}