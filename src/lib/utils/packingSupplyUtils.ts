/**
 * @fileoverview Packing supply order utility functions
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts (inline utility functions)
 * @source boombox-10.0/src/app/api/packing-supplies/orders/[orderId]/cancel/route.ts (cancellation logic)
 * @source boombox-10.0/src/app/api/drivers/[driverId]/packing-supply-routes/route.ts (driver route fetching)
 * @refactor Extracted utility functions from API routes to centralized utils
 */

import { PackingSupplyCartItem } from '@/types/packingSupply.types';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { prisma } from '@/lib/database/prismaClient';
import crypto from 'crypto';

export interface DeliveryTimeWindow {
  start: Date;
  end: Date;
  isSameDay: boolean;
  deliveryDate: string;
}

export interface OrderCapacity {
  itemCount: number;
  totalWeight: number;
  totalVolume: number;
  capacityScore: number;
}

export interface CreateOrderRequest {
  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;

  // Order details
  cartItems: PackingSupplyCartItem[];
  totalPrice: number;
  paymentMethod: string;
  stripePaymentMethodId?: string;

  // Optional
  deliveryNotes?: string;
  userId?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: number;
  onfleetTaskId?: string;
  onfleetTaskShortId?: string;
  trackingUrl?: string;
  deliveryWindow?: DeliveryTimeWindow;
  estimatedServiceTime?: number;
  capacityInfo?: OrderCapacity;
  paymentStatus?: string;
  paymentIntentId?: string;
  error?: string;
  details?: any;
}

/**
 * Calculate delivery time window based on current time and PST cutoff
 * Same-day delivery if ordered before 12 PM PST, otherwise next day
 */
export function calculateDeliveryTimeWindow(): DeliveryTimeWindow {
  const now = new Date();

  // Convert current time to Pacific Time (America/Los_Angeles)
  // This properly handles PST/PDT transitions
  const pstTimeString = now.toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles' 
  });
  const pstNow = new Date(pstTimeString);

  // 12 PM PST cutoff for same-day delivery
  const cutoffHour = 12;
  const currentHour = pstNow.getHours();

  let deliveryDate: Date;
  let isSameDay: boolean;

  if (currentHour < cutoffHour) {
    // Same-day delivery (before 12 PM PST)
    deliveryDate = new Date(pstNow);
    isSameDay = true;
  } else {
    // Next-day delivery (after 12 PM PST)
    deliveryDate = new Date(pstNow);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    isSameDay = false;
  }

  // Delivery window: 12 PM - 7 PM PST on the delivery date
  const windowStart = new Date(deliveryDate);
  windowStart.setHours(12, 0, 0, 0);

  const windowEnd = new Date(deliveryDate);
  windowEnd.setHours(19, 0, 0, 0);

  // Format delivery date as YYYY-MM-DD to avoid timezone issues
  const year = deliveryDate.getFullYear();
  const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
  const day = String(deliveryDate.getDate()).padStart(2, '0');
  const deliveryDateString = `${year}-${month}-${day}`;

  return {
    start: windowStart,
    end: windowEnd,
    isSameDay,
    deliveryDate: deliveryDateString,
  };
}

/**
 * Calculate order capacity metrics for route optimization
 */
export function calculateOrderCapacity(
  cartItems: PackingSupplyCartItem[]
): OrderCapacity {
  let totalWeight = 0;
  let totalVolume = 0;
  let itemCount = 0;

  for (const item of cartItems) {
    itemCount += item.quantity;

    // Estimate weight and volume based on item type
    // These are rough estimates for common packing supplies
    let itemWeight = 0.5; // Default 0.5 lbs per item
    let itemVolume = 0.1; // Default 0.1 cubic feet per item

    const itemName = item.name.toLowerCase();

    if (itemName.includes('small box')) {
      itemWeight = 0.3;
      itemVolume = 0.8;
    } else if (itemName.includes('medium box')) {
      itemWeight = 0.5;
      itemVolume = 2.0;
    } else if (itemName.includes('large box')) {
      itemWeight = 0.8;
      itemVolume = 4.0;
    } else if (itemName.includes('tape')) {
      itemWeight = 0.2;
      itemVolume = 0.05;
    } else if (itemName.includes('bubble wrap')) {
      itemWeight = 0.1;
      itemVolume = 0.5;
    } else if (itemName.includes('paper')) {
      itemWeight = 0.3;
      itemVolume = 0.2;
    }

    totalWeight += itemWeight * item.quantity;
    totalVolume += itemVolume * item.quantity;
  }

  // Calculate capacity score (1-5 scale based on volume)
  let capacityScore = 1;
  if (totalVolume > 20) capacityScore = 5;
  else if (totalVolume > 15) capacityScore = 4;
  else if (totalVolume > 10) capacityScore = 3;
  else if (totalVolume > 5) capacityScore = 2;

  return {
    itemCount,
    totalWeight: Math.round(totalWeight * 10) / 10, // Round to 1 decimal
    totalVolume: Math.round(totalVolume * 10) / 10,
    capacityScore,
  };
}

/**
 * Generate secure tracking token for order tracking
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Validate order request data
 */
export function validateOrderRequest(body: CreateOrderRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields validation
  if (!body.customerName?.trim()) {
    errors.push('Customer name is required');
  }

  if (!body.customerEmail?.trim()) {
    errors.push('Customer email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail)) {
    errors.push('Invalid email format');
  }

  if (!body.customerPhone?.trim()) {
    errors.push('Customer phone number is required');
  }

  if (!body.deliveryAddress?.trim()) {
    errors.push('Delivery address is required');
  }

  if (!body.cartItems || body.cartItems.length === 0) {
    errors.push('Cart items are required');
  } else {
    // Validate cart items
    body.cartItems.forEach((item, index) => {
      if (!item.name?.trim()) {
        errors.push(`Cart item ${index + 1}: Product name is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Cart item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Cart item ${index + 1}: Price must be greater than 0`);
      }
    });
  }

  if (!body.totalPrice || body.totalPrice <= 0) {
    errors.push('Total price must be greater than 0');
  }

  if (!body.paymentMethod?.trim()) {
    errors.push('Payment method is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create tracking URL for order
 */
export function createTrackingUrl(trackingToken: string): string {
  return `/packing-supplies/tracking/${trackingToken}`;
}

/**
 * Format order items for Onfleet task notes
 */
export function formatOrderItemsForNotes(
  cartItems: PackingSupplyCartItem[],
  totalPrice: number
): string {
  const itemsText = cartItems
    .map(item => `- ${item.quantity}x ${item.name}`)
    .join('\n');
  return `Items:\n${itemsText}\n\nTotal: ${formatCurrency(totalPrice)}`;
}

/**
 * Fetch packing supply routes for a driver with detailed metrics and formatting
 * @source boombox-10.0/src/app/api/drivers/[driverId]/packing-supply-routes/route.ts
 * @param driverId - The ID of the driver
 * @returns Array of formatted packing supply routes with metrics and order details
 */
export async function getDriverPackingSupplyRoutes(driverId: number) {
  // Get current date for filtering
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  // Fetch packing supply routes assigned to this driver
  const routes = await prisma.packingSupplyRoute.findMany({
    where: {
      driverId: driverId,
      deliveryDate: {
        gte: thirtyDaysAgo, // Get routes from last 30 days to include recent history
      },
      routeStatus: {
        in: ['in_progress', 'completed'], // Include both in progress and completed routes
      },
    },
    include: {
      orders: {
        select: {
          id: true,
          deliveryAddress: true,
          contactName: true,
          contactEmail: true,
          contactPhone: true,
          deliveryDate: true,
          totalPrice: true,
          status: true,
          routeStopNumber: true,
          actualDeliveryTime: true,
          trackingUrl: true,
          orderDetails: {
            include: {
              product: {
                select: {
                  title: true,
                  description: true,
                  imageSrc: true,
                },
              },
            },
          },
        },
        orderBy: { routeStopNumber: 'asc' },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          email: true,
        },
      },
    },
    orderBy: {
      deliveryDate: 'asc',
    },
  });

  // Transform the data to match the expected format for the components
  const formattedRoutes = routes.map(route => {
    // Calculate route metrics
    const totalStops = route.orders.length;
    const completedStops = route.orders.filter(
      order => order.status === 'Delivered' || order.actualDeliveryTime
    ).length;

    const estimatedMiles = route.totalDistance
      ? parseFloat(route.totalDistance.toString())
      : 0;
    const estimatedDurationMinutes = route.totalTime
      ? Math.ceil(route.totalTime / 60)
      : totalStops * 15;

    // Calculate payout estimate ($15 per stop + $0.50 per mile)
    const basePayPerStop = 15;
    const mileageRate = 0.5;
    const estimatedPayout = Math.round(
      totalStops * basePayPerStop + estimatedMiles * mileageRate
    );

    return {
      id: route.id,
      routeId: route.routeId,
      appointmentType: 'Packing Supply Delivery',
      address: `${totalStops} stops - ${route.orders[0]?.deliveryAddress || 'Multiple locations'}`,
      date: route.deliveryDate,
      time: route.deliveryDate, // Use delivery date as time for consistency
      numberOfUnits: totalStops,
      planType: 'Packing Supply Route',
      insuranceCoverage: null,
      description: `Route with ${totalStops} deliveries`,
      user: null, // Routes don't have a single user
      driver: route.driver,
      routeStatus: route.routeStatus,
      totalStops,
      completedStops,
      estimatedMiles,
      estimatedDurationMinutes,
      estimatedPayout: route.payoutAmount
        ? parseFloat(route.payoutAmount.toString())
        : estimatedPayout,
      payoutStatus: route.payoutStatus,
      orders: route.orders,
      // Additional route-specific fields
      routeMetrics: {
        totalDistance: estimatedMiles,
        totalTime: estimatedDurationMinutes,
        startTime: route.startTime,
        endTime: route.endTime,
      },
      coordinates: null, // Will be handled by geocoding in the component
    };
  });

  return formattedRoutes;
}

/**
 * Fetch live tracking URL from Onfleet API
 * @source boombox-10.0/src/app/api/packing-supplies/tracking/verify/route.ts (lines 6-28)
 */
export async function fetchOnfleetTrackingUrl(
  shortId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://onfleet.com/api/v2/tasks/shortId/${shortId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.ONFLEET_API_KEY + ':').toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Onfleet API error for task ${shortId}:`,
        response.status,
        response.statusText
      );
      return null;
    }

    const taskData = await response.json();
    return taskData.trackingURL || null;
  } catch (error) {
    console.error(
      `Error fetching Onfleet tracking URL for task ${shortId}:`,
      error
    );
    return null;
  }
}

/**
 * Format delivery progress steps for packing supply order tracking
 * @source boombox-10.0/src/app/api/packing-supplies/tracking/verify/route.ts (lines 79-125)
 */
export function formatPackingSupplyDeliveryProgress(order: any) {
  return {
    steps: [
      {
        title: 'Order received and confirmed',
        description:
          'Your packing supply order has been received and confirmed',
        status: 'complete' as const,
        timestamp: order.orderDate
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })
          .toLowerCase(),
      },
      {
        title: 'Your delivery driver has been assigned',
        description: order.assignedDriver
          ? `${order.assignedDriver.firstName} ${order.assignedDriver.lastName} will deliver your order`
          : 'Driver will be assigned shortly',
        status: order.assignedDriver
          ? ('complete' as const)
          : ('pending' as const),
        timestamp: order.assignedDriver ? '' : '',
      },
      {
        title: 'Your order is out for delivery',
        description: 'Your packing supplies are on the way',
        status:
          order.status === 'Delivered'
            ? ('complete' as const)
            : order.status === 'In Transit'
              ? ('in_transit' as const)
              : order.status === 'Driver Arrived'
                ? ('in_transit' as const)
                : ('pending' as const),
        timestamp:
          order.status === 'In Transit'
            ? new Date()
                .toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
                .toLowerCase()
            : '',
      },
      {
        title: 'Your order has been delivered',
        description: 'Your packing supplies have been delivered',
        status:
          order.status === 'Delivered'
            ? ('complete' as const)
            : ('pending' as const),
        timestamp: order.actualDeliveryTime
          ? order.actualDeliveryTime
              .toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
              .toLowerCase()
          : '',
      },
    ],
    currentStep:
      order.status === 'Delivered'
        ? 3
        : ['In Transit', 'Driver Arrived'].includes(order.status)
          ? 2
          : 1,
  };
}

/**
 * Calculate delivery window information
 * @source boombox-10.0/src/app/api/packing-supplies/tracking/verify/route.ts (lines 127-133)
 */
export function calculatePackingSupplyDeliveryWindow(order: any) {
  return {
    start: order.deliveryWindowStart,
    end: order.deliveryWindowEnd,
    isSameDay: order.deliveryWindowStart
      ? new Date(order.deliveryWindowStart).toDateString() ===
        new Date().toDateString()
      : false,
  };
}

/**
 * Format packing supply tracking response data
 * @source boombox-10.0/src/app/api/packing-supplies/tracking/verify/route.ts (lines 145-172)
 */
export function formatPackingSupplyTrackingResponse(
  order: any,
  liveTrackingUrl?: string,
  feedbackToken?: string
) {
  return {
    orderId: order.id,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryWindowStart || new Date(),
    customerName: order.contactName,
    deliveryAddress: order.deliveryAddress,
    totalPrice: parseFloat(order.totalPrice.toString()),
    status: order.status,
    driverName: order.assignedDriver
      ? `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`
      : 'TBD',
    driverProfilePicture: order.assignedDriver?.profilePicture || undefined,
    deliveryPhotoUrl: order.deliveryPhotoUrl || undefined,
    items: order.orderDetails.map((detail: any) => ({
      name: detail.product.title,
      quantity: detail.quantity,
      price: parseFloat(detail.price.toString()),
    })),
    deliveryProgress: formatPackingSupplyDeliveryProgress(order),
    deliveryWindow: calculatePackingSupplyDeliveryWindow(order),
    taskId: order.onfleetTaskShortId,
    trackingUrl: liveTrackingUrl,
    estimatedArrival: order.deliveryWindowStart
      ? new Date(order.deliveryWindowStart).toISOString()
      : undefined,
    feedbackToken: feedbackToken,
    canLeaveFeedback: order.status === 'Delivered',
  };
}

/**
 * Calculate route payout estimate
 * Uses consistent formula with formatRouteMetrics: $15 per stop + $0.50 per mile
 * @source boombox-10.0 (legacy payout calculation logic)
 * @refactor Updated to use consistent formula across SMS and dashboard displays
 */
export function calculateRoutePayoutEstimate(routeData: any): string {
  const totalStops = routeData.totalStops ?? routeData.stops?.length ?? 0;
  const totalDistance = routeData.totalDistance 
    ? parseFloat(routeData.totalDistance.toString()) 
    : 0;
  
  // Consistent formula: $15 per stop + $0.50 per mile
  const basePayPerStop = 15;
  const mileageRate = 0.50;
  const estimatedPayout = Math.round((totalStops * basePayPerStop) + (totalDistance * mileageRate));
  
  return `$${estimatedPayout}`;
}

/**
 * Get delivery area for address
 * @source boombox-10.0 (legacy delivery area logic)
 * @refactor Added function for determining delivery areas
 */
export function getDeliveryArea(address: string): string {
  // @REFACTOR-P9-TEMP: Mock implementation
  console.log('PLACEHOLDER: getDeliveryArea called', { address });

  // Simple area determination based on address keywords
  if (address.toLowerCase().includes('berkeley')) return 'Berkeley';
  if (address.toLowerCase().includes('oakland')) return 'Oakland';
  if (address.toLowerCase().includes('san francisco')) return 'SF';

  return 'Bay Area'; // Default area
}

/**
 * Calculate estimated duration for route
 * @source boombox-10.0 (legacy duration calculation logic)
 * @refactor Added function for calculating estimated route duration
 */
export function calculateEstimatedDuration(routeData: any): number {
  // @REFACTOR-P9-TEMP: Mock implementation
  console.log('PLACEHOLDER: calculateEstimatedDuration called', { routeData });

  const baseTime = 30; // Base time in minutes
  const timePerStop = 15; // Time per stop in minutes
  const stopCount = routeData.stops?.length || 0;
  const drivingTime = routeData.totalDistance
    ? (routeData.totalDistance / 25) * 60
    : 60; // Assume 25 mph avg speed

  return baseTime + stopCount * timePerStop + drivingTime;
}
