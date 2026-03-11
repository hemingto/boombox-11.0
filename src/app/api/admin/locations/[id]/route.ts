import { NextRequest, NextResponse } from 'next/server';
import { LocationPageService } from '@/lib/services/locationPageService';
import { LocationPageStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const location = await LocationPageService.getById(id);
    if (!location) {
      return NextResponse.json(
        { error: 'Location page not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(location);
  } catch (error) {
    console.error(`[API /api/admin/locations/${id}] Error fetching:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch location page' },
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
    const body = await request.json();

    if (
      body.status &&
      Object.values(LocationPageStatus).includes(body.status)
    ) {
      if (body.status === LocationPageStatus.PUBLISHED) {
        const location = await LocationPageService.publish(id);
        return NextResponse.json(location);
      }
      if (body.status === LocationPageStatus.ARCHIVED) {
        const location = await LocationPageService.archive(id);
        return NextResponse.json(location);
      }
      const location = await LocationPageService.unpublish(id);
      return NextResponse.json(location);
    }

    const allowedFields = [
      'slug',
      'city',
      'state',
      'zipCode',
      'heroImageUrl',
      'heroImageAlt',
      'aboutContent',
      'stats',
      'nearbyLocationSlugs',
      'metaTitle',
      'metaDescription',
      'ogImageUrl',
    ] as const;

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const location = await LocationPageService.update(id, updateData);
    return NextResponse.json(location);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A location page with this slug already exists' },
        { status: 409 }
      );
    }
    console.error(`[API /api/admin/locations/${id}] Error updating:`, error);
    return NextResponse.json(
      { error: 'Failed to update location page' },
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
    await LocationPageService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API /api/admin/locations/${id}] Error deleting:`, error);
    return NextResponse.json(
      { error: 'Failed to delete location page' },
      { status: 500 }
    );
  }
}
