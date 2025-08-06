/**
 * @fileoverview Get packing supply products with stock information for catalog display
 * @source boombox-10.0/src/app/api/packing-supplies/products/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint that returns all packing supply products with stock information.
 * Supports filtering out-of-stock items and provides stock level warnings for low inventory.
 * Returns products sorted by availability (in-stock first) then alphabetically by title.
 *
 * USED BY (boombox-10.0 files):
 * - src/app/components/packing-supplies/packingsupplieslayout.tsx (line 95: Product catalog loading)
 *
 * INTEGRATION NOTES:
 * - Provides real-time stock information for inventory management
 * - Supports optional includeOutOfStock query parameter for admin views
 * - Returns hasLowStock flag for UI stock warnings (< 50 items)
 * - Filters by 'Packing Supplies' and 'Moving Boxes' categories
 *
 * @refactor Moved from /api/packing-supplies/products/ to /api/orders/packing-supplies/products/
 * @refactor Added proper validation and enhanced stock information
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true';

    // Build where clause for product filtering
    const whereClause: any = {
      category: {
        in: ['Packing Supplies', 'Moving Boxes'],
      },
    };

    // Optionally filter out out-of-stock items
    if (!includeOutOfStock) {
      whereClause.isOutOfStock = false;
    }

    // Get all products with stock information
    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        detailedDescription: true,
        price: true,
        imageSrc: true,
        imageAlt: true,
        category: true,
        stockCount: true,
        isOutOfStock: true,
        restockDate: true,
      },
      orderBy: [
        { isOutOfStock: 'asc' }, // In stock items first
        { title: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      products: products.map(product => ({
        ...product,
        price: parseFloat(product.price.toString()),
        hasLowStock: product.stockCount < 50, // Flag for low stock warning
      })),
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
