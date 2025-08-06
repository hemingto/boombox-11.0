/**
 * @fileoverview API endpoint to mark storage units as clean after maintenance
 * @source boombox-10.0/src/app/api/admin/storage-units/mark-clean/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * POST endpoint that marks storage units as clean after maintenance work.
 * Updates unit status, records cleaning photos, creates audit logs in a transaction.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin storage unit management interface
 * - Cleaning workflow completion
 * - Maintenance tracking systems
 * - Unit status management tools
 * 
 * INTEGRATION NOTES:
 * - Requires admin authentication and authorization
 * - Requires { storageUnitId, photos } in request body
 * - Photos array must contain at least one cleaning photo URL
 * - Uses database transaction for data consistency
 * - Updates storage unit status to "Empty" with cleaning metadata
 * - Creates storageUnitCleaning record for audit trail
 * - Creates adminLog entry for action tracking
 * 
 * @refactor Uses centralized auth configuration from @/lib/auth/nextAuthConfig
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';

export async function POST(request: NextRequest) {
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

    // Get request body data
    const data = await request.json();
    const { storageUnitId, photos } = data;

    if (!storageUnitId) {
      return NextResponse.json({ error: 'Storage unit ID is required' }, { status: 400 });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }

    // Find the storage unit
    const storageUnit = await prisma.storageUnit.findUnique({
      where: { id: storageUnitId },
      select: { id: true, storageUnitNumber: true, status: true }
    });

    if (!storageUnit) {
      return NextResponse.json({ error: 'Storage unit not found' }, { status: 404 });
    }

    // Execute the database operations in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Update the storage unit status to "Empty"
      const updatedUnit = await prisma.storageUnit.update({
        where: { id: storageUnitId },
        data: {
          status: 'Empty',
          cleaningPhotos: photos,
          lastCleanedAt: new Date()
        }
      });

      // 2. Create a new cleaning record
      const cleaningRecord = await prisma.storageUnitCleaning.create({
        data: {
          storageUnitId,
          adminId: admin.id,
          photos,
        }
      });

      // 3. Create admin log entry
      const adminLog = await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'MARK_UNIT_CLEAN',
          targetType: 'StorageUnit', 
          targetId: storageUnitId.toString(),
        }
      });

      return { updatedUnit, cleaningRecord, adminLog };
    });

    return NextResponse.json({
      message: 'Storage unit marked as clean successfully',
      data: result
    });
  } catch (error) {
    console.error('Error marking storage unit as clean:', error);
    return NextResponse.json(
      { error: 'Failed to mark storage unit as clean' },
      { status: 500 }
    );
  }
} 