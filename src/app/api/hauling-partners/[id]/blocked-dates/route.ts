/**
 * @fileoverview API endpoint to manage blocked dates for hauling partners
 *
 * ROUTE FUNCTIONALITY:
 * GET/POST endpoint that manages availability blocked dates for hauling partners.
 * GET: Returns all blocked dates ordered chronologically
 * POST: Creates new blocked date entries for availability management
 *
 * INTEGRATION NOTES:
 * - GET: Returns blocked dates ordered by date ascending
 * - POST: Requires { blockedDate } in request body
 * - Uses userId field with "hauler" userType for data consistency
 * - Blocked dates affect partner availability for job assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        userId: parseInt(id),
        userType: 'hauler',
      },
      orderBy: {
        blockedDate: 'asc',
      },
    });

    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates for hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { blockedDate } = await request.json();

    const newBlockedDate = await prisma.blockedDate.create({
      data: {
        userId: parseInt(id),
        userType: 'hauler',
        blockedDate: new Date(blockedDate),
      },
    });

    return NextResponse.json(newBlockedDate);
  } catch (error) {
    console.error('Error creating blocked date for hauling partner:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked date' },
      { status: 500 }
    );
  }
}
