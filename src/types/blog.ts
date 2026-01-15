/**
 * @fileoverview Type definitions for blog system
 * @source Created for boombox-11.0 blog system
 * 
 * TYPE DEFINITIONS:
 * - Blog content block input types for admin portal
 * - Blog post creation and update types
 * - Extends Prisma types for frontend use
 * 
 * USAGE:
 * - Admin portal form validation
 * - API route type safety
 * - Component prop types
 * 
 * @refactor New type definitions for structured blog content system
 */

import { BlogContentBlockType, BlogStatus } from '@prisma/client';

/**
 * Input type for creating a new content block
 * Used in admin portal forms
 */
export interface BlogContentBlockInput {
  type: BlogContentBlockType;
  content: string;
  metadata?: {
    alt?: string; // For IMAGE blocks
    level?: number; // For HEADING blocks (1-6)
    language?: string; // For CODE blocks
    ordered?: boolean; // For LIST blocks
    width?: number; // For IMAGE blocks
    height?: number; // For IMAGE blocks
    [key: string]: any; // Allow additional custom metadata
  };
  order: number;
}

/**
 * Input type for creating a new blog post
 * Used in admin portal create form
 */
export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryId?: number;
  status: BlogStatus;
  publishedAt?: Date;
  readTime?: number;
  authorId: number;
  authorName?: string;
  authorImage?: string;
  contentBlocks: BlogContentBlockInput[];
}

/**
 * Input type for updating an existing blog post
 * All fields optional except contentBlocks (if provided, replaces all blocks)
 */
export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryId?: number;
  status?: BlogStatus;
  publishedAt?: Date;
  readTime?: number;
  authorName?: string;
  authorImage?: string;
  contentBlocks?: BlogContentBlockInput[];
}

/**
 * Form state for blog post editor
 * Tracks validation and submission state
 */
export interface BlogPostFormState {
  data: Partial<CreateBlogPostInput>;
  errors: Partial<Record<keyof CreateBlogPostInput, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Content block editor state
 * Tracks editing state for individual blocks
 */
export interface ContentBlockEditorState {
  blocks: BlogContentBlockInput[];
  activeBlockId: number | null;
  isReordering: boolean;
}

/**
 * Blog post preview data
 * Used for live preview in admin portal
 */
export interface BlogPostPreview {
  title: string;
  excerpt?: string;
  featuredImage?: string;
  contentBlocks: BlogContentBlockInput[];
  authorName?: string;
  authorImage?: string;
  categoryName?: string;
  readTime?: number;
}

/**
 * Validation result for blog post form
 */
export interface BlogPostValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof CreateBlogPostInput, string>>;
}

