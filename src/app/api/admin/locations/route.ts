import { NextRequest, NextResponse } from 'next/server';
import { LocationPageService } from '@/lib/services/locationPageService';
import { LocationPageStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') as LocationPageStatus | null;
    const search = searchParams.get('search') || undefined;

    const result = await LocationPageService.getAll({
      page,
      limit,
      status: status || undefined,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      '[API /api/admin/locations] Error fetching locations:',
      error
    );
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.slug || !body.city || !body.aboutContent) {
      return NextResponse.json(
        { error: 'slug, city, and aboutContent are required' },
        { status: 400 }
      );
    }

    const location = await LocationPageService.create({
      slug: body.slug,
      city: body.city,
      state: body.state || 'CA',
      zipCode: body.zipCode || null,
      heroImageUrl: body.heroImageUrl || null,
      heroImageAlt: body.heroImageAlt || null,
      aboutContent: body.aboutContent,
      stats: body.stats || null,
      nearbyLocationSlugs: body.nearbyLocationSlugs || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      ogImageUrl: body.ogImageUrl || null,
      status: body.status || LocationPageStatus.DRAFT,
      publishedAt:
        body.status === LocationPageStatus.PUBLISHED ? new Date() : null,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A location page with this slug already exists' },
        { status: 409 }
      );
    }
    console.error('[API /api/admin/locations] Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location page' },
      { status: 500 }
    );
  }
}
