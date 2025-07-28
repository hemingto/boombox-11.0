/**
 * @fileoverview Packing supply order utility functions
 * @source boombox-10.0/src/app/api/packing-supplies/create-order/route.ts (inline utility functions)
 * @source boombox-10.0/src/app/api/packing-supplies/orders/[orderId]/cancel/route.ts (cancellation logic)
 * @refactor Extracted utility functions from API routes to centralized utils
 */

import { PackingSupplyCartItem } from '@/types/packingSupply.types';
import { formatCurrency } from '@/lib/utils/currencyUtils';
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
  
  // Convert current time to PST/PDT
  const pstOffset = -8; // PST is UTC-8
  const pstNow = new Date(now.getTime() + (pstOffset * 60 * 60 * 1000));
  
  // 12 PM PST cutoff for same-day delivery
  const cutoffTime = new Date(pstNow);
  cutoffTime.setHours(12, 0, 0, 0);
  
  let deliveryDate: Date;
  let isSameDay: boolean;
  
  if (pstNow < cutoffTime) {
    // Same-day delivery (12 PM - 7 PM PST)
    deliveryDate = new Date(pstNow);
    isSameDay = true;
  } else {
    // Next-day delivery
    deliveryDate = new Date(pstNow);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    isSameDay = false;
  }
  
  // Delivery window: 12 PM - 7 PM PST
  const windowStart = new Date(deliveryDate);
  windowStart.setHours(12, 0, 0, 0);
  
  const windowEnd = new Date(deliveryDate);
  windowEnd.setHours(19, 0, 0, 0);
  
  return {
    start: windowStart,
    end: windowEnd,
    isSameDay,
    deliveryDate: deliveryDate.toISOString().split('T')[0]
  };
}

/**
 * Calculate order capacity metrics for route optimization
 */
export function calculateOrderCapacity(cartItems: PackingSupplyCartItem[]): OrderCapacity {
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
    capacityScore
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
export function formatOrderItemsForNotes(cartItems: PackingSupplyCartItem[], totalPrice: number): string {
  const itemsText = cartItems.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
  return `Items:\n${itemsText}\n\nTotal: ${formatCurrency(totalPrice)}`;
} 