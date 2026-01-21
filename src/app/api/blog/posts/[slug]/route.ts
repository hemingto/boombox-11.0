/**
 * @fileoverview Individual blog post API route
 * @source Created for boombox-11.0 database-driven blog system
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches a single blog post by slug with content blocks
 * 
 * ROUTE PARAMETERS:
 * - slug: Blog post slug (URL-friendly identifier)
 * 
 * RESPONSE:
 * Returns full blog post with:
 * - Post metadata (title, author, date, etc.)
 * - Content blocks (ordered array of structured content)
 * - Category information
 * 
 * @refactor New API route for individual blog post fetching
 */

import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    if (!slug) {
      return NextResponse.json(
        { error: 'Blog post slug is required' },
        { status: 400 }
      );
    }

    // Fetch post from database with content blocks
    const post = await BlogService.getBlogPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);

  } catch (error) {
    console.error(`Error fetching blog post [${slug}]:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

