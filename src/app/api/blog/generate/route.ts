import { NextRequest, NextResponse } from 'next/server';
import { BlogGenerationService } from '@/lib/services/blogGenerationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      keywords,
      categoryId,
      authorId,
      authorName,
      authorImage,
      featuredImageUrl,
      featuredImageAlt,
    } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!authorId || typeof authorId !== 'number') {
      return NextResponse.json(
        { error: 'Valid authorId is required' },
        { status: 400 }
      );
    }

    if (!featuredImageUrl || typeof featuredImageUrl !== 'string') {
      return NextResponse.json(
        { error: 'A featured image is required' },
        { status: 400 }
      );
    }

    const post = await BlogGenerationService.generateAndSaveBlogPost({
      topic: topic.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      categoryId: categoryId ? Number(categoryId) : undefined,
      authorId,
      authorName: authorName || undefined,
      authorImage: authorImage || undefined,
      featuredImageUrl,
      featuredImageAlt:
        featuredImageAlt || `Featured image for: ${topic.trim()}`,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error(
      '[API /api/blog/generate] Error generating blog post:',
      error
    );

    if (error instanceof Error) {
      if (
        error.message.includes('API key') ||
        error.message.includes('quota')
      ) {
        return NextResponse.json(
          {
            error:
              'AI service temporarily unavailable. Please try again later.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate blog post. Please try again.' },
      { status: 500 }
    );
  }
}
