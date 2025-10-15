/**
 * @fileoverview Featured blog posts API route
 * @source Created for boombox-11.0 database-driven blog system
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches featured blog posts (for hero sections)
 * 
 * QUERY PARAMETERS:
 * - limit: Number of posts to return (default: 1)
 * 
 * @refactor New API route for database-driven blog system
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';
import { convertToFeaturedArticle } from '@/lib/utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1', 10);

    const posts = await BlogService.getFeaturedBlogPosts(limit);
    const featuredArticles = posts.map(convertToFeaturedArticle);
    
    return NextResponse.json({
      articles: featuredArticles,
    });

  } catch (error) {
    console.error('Error fetching featured articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured articles' },
      { status: 500 }
    );
  }
}
