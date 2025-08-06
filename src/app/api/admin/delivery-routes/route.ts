/**
 * @fileoverview Admin delivery routes API endpoint for packing supply route management
 * @source boombox-10.0/src/app/api/admin/delivery-routes/route.ts
 *
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns comprehensive list of packing supply delivery routes with optional date filtering
 * - Fetches routes with driver information, orders, customers, products, cancellations, and feedback
 * - Supports optional date parameter to filter routes by specific delivery date
 * - Returns extensive nested data for complete admin dashboard visibility
 * - Orders results by delivery date ascending for chronological display
 *
 * USED BY (boombox-10.0 files):
 * - src/app/admin/delivery-routes/page.tsx (line 407: fetchRoutes function for admin dashboard)
 * - Admin layout navigation menu (src/app/admin/layout.tsx line 43: "Delivery Routes" navigation)
 * - Admin task system (src/app/api/admin/tasks/route.ts line 622: actionUrl redirect)
 *
 * INTEGRATION NOTES:
 * - Pure database query endpoint with extensive Prisma includes for comprehensive data
 * - Date filtering uses day-range logic (start of day to next day) for accurate filtering
 * - No external service integrations - focuses on data aggregation and presentation
 * - Critical for admin oversight of packing supply delivery operations
 * - Includes payment status, driver assignments, and customer feedback for complete visibility
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Complex nested query with multiple includes may be slow on large datasets
 * - Date filtering helps limit result set size when specified
 * - Consider pagination for production use with high route volumes
 *
 * @refactor Migrated from boombox-10.0 with validation schemas and improved error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextAuthConfig';
import { prisma } from '@/lib/database/prismaClient';
import { 
  AdminDeliveryRoutesRequestSchema,
  AdminDeliveryRoutesResponseSchema
} from '@/lib/validations/api.validations';

/**
 * GET /api/admin/delivery-routes
 * 
 * Fetches packing supply delivery routes with comprehensive nested data.
 * Supports optional date filtering for specific delivery dates.
 * 
 * Query Parameters:
 * - date: ISO date string to filter routes by delivery date (optional)
 * 
 * @param request - Next.js request object with optional query parameters
 * @returns {Promise<NextResponse>} Array of delivery routes with extensive nested data
 * @source boombox-10.0/src/app/api/admin/delivery-routes/route.ts (entire endpoint)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate admin session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const queryParams = { date: dateParam };
    const paramValidation = AdminDeliveryRoutesRequestSchema.safeParse(queryParams);
    
    if (!paramValidation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: paramValidation.error.errors
        },
        { status: 400 }
      );
    }

    // Build date filter clause
    let whereClause = {};
    if (dateParam) {
      const targetDate = new Date(dateParam);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause = {
        deliveryDate: {
          gte: targetDate,
          lt: nextDay,
        },
      };
    }

    // Fetch delivery routes with comprehensive nested data
    const routes = await prisma.packingSupplyRoute.findMany({
      where: whereClause,
      select: {
        id: true,
        routeId: true,
        driverId: true,
        deliveryDate: true,
        totalStops: true,
        completedStops: true,
        routeStatus: true,
        totalDistance: true,
        totalTime: true,
        startTime: true,
        endTime: true,
        payoutAmount: true,
        payoutStatus: true,
        payoutTransferId: true,
        payoutProcessedAt: true,
        payoutFailureReason: true,
        onfleetOptimizationId: true,
        driverOfferSentAt: true,
        driverOfferExpiresAt: true,
        driverOfferStatus: true,
        createdAt: true,
        updatedAt: true,
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePicture: true,
          }
        },
        orders: {
          select: {
            id: true,
            userId: true,
            deliveryAddress: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            orderDate: true,
            deliveryDate: true,
            totalPrice: true,
            status: true,
            paymentMethod: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            onfleetTaskId: true,
            onfleetTaskShortId: true,
            assignedDriverId: true,
            deliveryWindowStart: true,
            deliveryWindowEnd: true,
            actualDeliveryTime: true,
            deliveryPhotoUrl: true,
            driverPayoutAmount: true,
            driverPayoutStatus: true,
            routeMetrics: true,
            routeStopNumber: true,
            trackingToken: true,
            trackingUrl: true,
            batchProcessedAt: true,
            optimizationJobId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              }
            },
            orderDetails: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                price: true,
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
            cancellations: {
              select: {
                id: true,
                cancellationReason: true,
                cancellationFee: true,
                cancellationDate: true,
                refundAmount: true,
                refundStatus: true,
                adminNotes: true,
              }
            },
            feedback: {
              select: {
                id: true,
                rating: true,
                comment: true,
                tipAmount: true,
                tipPaymentIntentId: true,
                tipPaymentStatus: true,
                driverRating: true,
                responded: true,
                response: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          }
        }
      },
      orderBy: {
        deliveryDate: 'asc',
      },
    });

    // Validate response structure
    const responseValidation = AdminDeliveryRoutesResponseSchema.safeParse(routes);
    if (!responseValidation.success) {
      console.error('Delivery routes response validation failed:', responseValidation.error);
      return NextResponse.json(
        { 
          error: 'Internal server error - invalid response format',
          details: responseValidation.error.errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json(responseValidation.data);
  } catch (error) {
    console.error('Error fetching delivery routes:', error);
    
    // Return structured error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch delivery routes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}