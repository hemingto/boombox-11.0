import { NextRequest, NextResponse } from 'next/server';
import { BlogService } from '@/lib/services/blogService';
import { BlogStatus, BlogContentBlockType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const post = await BlogService.getBlogPostById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(`[API /api/admin/blog/${id}] Error fetching post:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    const body = await request.json();

    if (body.status && Object.values(BlogStatus).includes(body.status)) {
      const post = await BlogService.updateBlogPostStatus(postId, body.status);
      return NextResponse.json(post);
    }

    const updateData: any = {};
    const allowedFields = [
      'title',
      'slug',
      'excerpt',
      'featuredImage',
      'featuredImageAlt',
      'metaTitle',
      'metaDescription',
      'categoryId',
      'readTime',
      'authorName',
      'authorImage',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.contentBlocks && Array.isArray(body.contentBlocks)) {
      updateData.contentBlocks = body.contentBlocks.map(
        (block: any, index: number) => ({
          type: block.type as BlogContentBlockType,
          content: block.content,
          metadata: block.metadata ?? undefined,
          order: block.order ?? index,
        })
      );
    }

    const post = await BlogService.updateBlogPost(postId, updateData);
    return NextResponse.json(post);
  } catch (error) {
    console.error(`[API /api/admin/blog/${id}] Error updating post:`, error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    await BlogService.deleteBlogPost(postId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API /api/admin/blog/${id}] Error deleting post:`, error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}
