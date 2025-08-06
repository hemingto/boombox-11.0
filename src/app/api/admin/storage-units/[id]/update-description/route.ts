/**
 * @fileoverview Admin API endpoint to update storage unit description
 * @source boombox-10.0/src/app/api/storage-unit/[id]/update-description/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that updates the description field of a storage unit usage record.
 * Used by admin interface to add or modify descriptions for storage unit contents.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin storage unit management interface
 * - Storage unit detail views with description editing
 * - Inventory management workflows
 * 
 * INTEGRATION NOTES:
 * - Updates storageUnitUsage table, not storageUnit table
 * - Requires description in request body
 * - Basic validation for required fields
 * - Uses parseInt for ID conversion (assumes numeric IDs)
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { description } = await req.json();

  if (!description) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  try {
    const updatedStorageUnit = await prisma.storageUnitUsage.update({
      where: { id: parseInt(id) },
      data: { description },
    });

    return NextResponse.json(updatedStorageUnit, { status: 200 });
  } catch (error) {
    console.error('Error updating storage unit description:', error);
    return NextResponse.json({ error: 'Failed to update description' }, { status: 500 });
  }
} 