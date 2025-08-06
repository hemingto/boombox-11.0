/**
 * @fileoverview Admin API endpoint to fetch all customers with related data
 * @source boombox-10.0/src/app/api/admin/customers/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all customers with their appointments, storage units, and orders.
 * Used by admin interface for comprehensive customer management and oversight.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin customer management dashboard
 * - Customer overview and analytics pages
 * - Customer support interfaces
 * - Admin reporting and monitoring systems
 * 
 * INTEGRATION NOTES:
 * - Fetches all users (customers) with related data
 * - Includes appointment history and status
 * - Returns storage unit usage information
 * - Includes packing supply order history
 * - Admin authentication assumed via middleware
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      include: {
        appointments: {
          select: {
            id: true,
            date: true,
            status: true,
            appointmentType: true,
            jobCode: true,
          },
        },
        storageUnitUsages: {
          select: {
            id: true,
            storageUnit: {
              select: {
                storageUnitNumber: true,
              },
            },
            usageStartDate: true,
            usageEndDate: true,
          },
        },
        packingSupplyOrders: {
          select: {
            id: true,
            orderDate: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 