/**
 * @fileoverview Blog posts API route
 * @source Created for boombox-11.0 database-driven blog system
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches blog posts with optional filtering and pagination
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Posts per page (default: 6)
 * - category: Category slug filter
 * - search: Search query
 * 
 * @refactor New API route for database-driven blog system
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';
import { convertBlogPostsToLegacy } from '@/lib/utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    const categorySlug = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    // Fetch posts from database
    const result = await BlogService.getBlogPosts({
      page,
      limit,
      categorySlug,
      search,
    });

    // Convert to legacy format for component compatibility
    const legacyPosts = convertBlogPostsToLegacy(result.posts);

    return NextResponse.json({
      posts: legacyPosts,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
