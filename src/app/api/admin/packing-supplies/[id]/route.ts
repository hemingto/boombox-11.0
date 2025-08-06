/**
 * @fileoverview API endpoint to fetch packing supply order details
 * @source boombox-10.0/src/app/api/admin/packing-supplies/[orderId]/route.ts
 * @refactor PHASE 4 - Admin Domain Routes
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that retrieves detailed packing supply order information including products and customer data.
 * Provides comprehensive order data for admin management and fulfillment tracking.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin packing supply order management
 * - Order fulfillment tracking interface
 * - Customer order support
 * - Driver assignment management
 * 
 * INTEGRATION NOTES:
 * - Requires orderId path parameter
 * - Includes orderDetails with complete product information
 * - Includes customer details (user) with contact information
 * - Includes assigned driver information if available
 * - Returns 404 if order not found
 * - Product details include title, description, category, and image
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const order = await prisma.packingSupplyOrder.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        orderDetails: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                description: true,
                category: true,
                imageSrc: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        },
        assignedDriver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching packing supply order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
} 