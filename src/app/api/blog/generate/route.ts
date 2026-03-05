import { NextRequest, NextResponse } from 'next/server';
import { BlogGenerationService } from '@/lib/services/blogGenerationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, tone, keywords, categoryId, authorId } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!authorId || typeof authorId !== 'number') {
      return NextResponse.json(
        { error: 'Valid authorId is required' },
        { status: 400 }
      );
    }

    const validTones = ['professional', 'casual', 'educational'] as const;
    const selectedTone = validTones.includes(tone) ? tone : 'professional';

    const post = await BlogGenerationService.generateAndSaveBlogPost({
      topic: topic.trim(),
      tone: selectedTone,
      keywords: Array.isArray(keywords) ? keywords : [],
      categoryId: categoryId ? Number(categoryId) : undefined,
      authorId,
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
