/**
 * @fileoverview Popular blog posts API route
 * @source Created for boombox-11.0 database-driven blog system
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches popular blog posts (most viewed)
 * 
 * QUERY PARAMETERS:
 * - limit: Number of posts to return (default: 6)
 * 
 * @refactor New API route for database-driven blog system
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';
import { convertBlogPostsToPopular } from '@/lib/utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    const posts = await BlogService.getPopularBlogPosts(limit);
    const popularArticles = convertBlogPostsToPopular(posts);
    
    return NextResponse.json({
      articles: popularArticles,
    });

  } catch (error) {
    console.error('Error fetching popular articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular articles' },
      { status: 500 }
    );
  }
}
