/**
 * @fileoverview Blog categories API route
 * @source Created for boombox-11.0 database-driven blog system
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that fetches all blog categories with post counts
 * 
 * @refactor New API route for database-driven blog system
 */

import { NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';

export async function GET() {
  try {
    const categories = await BlogService.getBlogCategories();
    
    return NextResponse.json({
      categories,
    });

  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog categories' },
      { status: 500 }
    );
  }
}
