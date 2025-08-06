/**
 * @fileoverview Admin API endpoint to fetch complete product inventory
 * @source boombox-10.0/src/app/api/admin/inventory/route.ts
 * @refactor PHASE 4 - Admin Domain
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all products with their inventory details including stock levels.
 * Used by admin interface for inventory management and product oversight.
 * 
 * USED BY (boombox-10.0 files):
 * - Admin inventory dashboard
 * - Product management interface
 * - Stock level monitoring systems
 * - Restock planning workflows
 * 
 * INTEGRATION NOTES:
 * - Fetches all products with essential inventory fields
 * - Includes stock counts, out-of-stock status, and restock dates
 * - Returns product images and pricing information
 * - No authentication required (admin route assumes auth middleware)
 * 
 * @refactor No logic changes - direct port with updated imports
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        quantity: true,
        stockCount: true,
        isOutOfStock: true,
        restockDate: true,
        imageSrc: true,
        imageAlt: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
} 