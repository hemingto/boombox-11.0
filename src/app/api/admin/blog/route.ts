import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';
import { BlogStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status') || undefined;

    const status =
      statusParam &&
      Object.values(BlogStatus).includes(statusParam as BlogStatus)
        ? (statusParam as BlogStatus)
        : null;

    const result = await BlogService.getBlogPosts({
      page,
      limit,
      search,
      status,
    });

    return NextResponse.json({
      posts: result.posts,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    });
  } catch (error) {
    console.error('[API /api/admin/blog] Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
