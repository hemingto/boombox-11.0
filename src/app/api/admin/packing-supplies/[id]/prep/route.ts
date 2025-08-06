/**
 * @fileoverview API endpoint to mark packing supply orders as prepped
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/prep/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * PATCH endpoint that updates packing supply order prep status with admin tracking.
 * Records prep completion timestamp and admin responsible for prep work.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin packing supply prep workflow
 * - Order fulfillment management
 * - Prep status tracking interface
 * - Admin audit logging
 * 
 * INTEGRATION NOTES:
 * - Requires admin authentication and authorization
 * - Requires { isPrepped } in request body
 * - Uses database transaction for data consistency
 * - Updates order with prep status, timestamp, and admin ID
 * - Creates adminLog entry for audit trail
 * - Sets preppedAt and preppedBy fields when marked as prepped
 * 
 * @refactor Uses centralized auth configuration from @/lib/auth/nextAuthConfig
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await request.json();
    const { isPrepped } = body;

    // Execute the database operations in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Update the packing supply order
      const updatedOrder = await prisma.packingSupplyOrder.update({
        where: {
          id: parseInt(id)
        },
        data: {
          isPrepped: isPrepped,
          preppedAt: isPrepped ? new Date() : null,
          preppedBy: isPrepped ? admin.id : null,
        }
      });

      // 2. Create admin log entry
      const adminLog = await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: 'PREP_PACKING_SUPPLY_ORDER',
          targetType: 'PackingSupplyOrder',
          targetId: id,
        }
      });

      return { updatedOrder, adminLog };
    });

    return NextResponse.json({ 
      success: true, 
      order: result.updatedOrder 
    });

  } catch (error) {
    console.error('Error updating packing supply order:', error);
    return NextResponse.json(
      { error: 'Failed to update packing supply order' },
      { status: 500 }
    );
  }
} 