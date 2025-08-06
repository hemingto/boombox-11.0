/**
 * @fileoverview API endpoint to fetch storage unit details by unit number
 * @source boombox-10.0/src/app/api/admin/storage-units/[number]/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves detailed storage unit information by unit number.
 * Includes usage history and associated customer information for admin management.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin storage unit management interface
 * - Storage unit lookup and search
 * - Unit history and tracking
 * - Customer relationship management
 * 
 * INTEGRATION NOTES:
 * - Requires admin authentication and authorization
 * - Uses storage unit number as path parameter
 * - Includes storageUnitUsages with associated user details
 * - Returns comprehensive unit information with customer data
 * - User details include id, name, and contact information
 * 
 * @refactor Uses centralized auth configuration from @/lib/auth/nextAuthConfig
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, email: true, role: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const storageUnitNumber = (await params).number;
    
    if (!storageUnitNumber) {
      return NextResponse.json(
        { error: 'Storage unit number is required' },
        { status: 400 }
      );
    }

    // Find the storage unit by its number
    const storageUnit = await prisma.storageUnit.findUnique({
      where: { storageUnitNumber },
      include: {
        storageUnitUsages: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!storageUnit) {
      return NextResponse.json(
        { error: 'Storage unit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(storageUnit);
  } catch (error) {
    console.error('Error fetching storage unit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage unit' },
      { status: 500 }
    );
  }
} 