/**
 * @fileoverview Packing Supply domain types
 * @source boombox-10.0/src/types/packing-supply.ts
 * @refactor Direct migration with enhanced organization and documentation
 */

// ===== CORE PACKING SUPPLY TYPES =====

export interface PackingSupplyCartItem {
  name: string;
  quantity: number;
  price: number; // Unit price
  weight?: number; // in pounds
  volume?: number; // in cubic feet
  category?: string;
}

export interface CreatePackingSupplyOrderRequest {
  // Customer information
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  deliveryAddress: string;

  // Order items
  cartItems: PackingSupplyCartItem[];

  // Payment information
  paymentMethod: string;
  totalPrice: number;

  // Optional user ID for logged-in users
  userId?: number;

  // Delivery preferences
  deliveryNotes?: string;
  preferredDeliveryTime?: 'morning' | 'afternoon' | 'evening';
}

export interface PackingSupplyOrderWithOnfleet {
  id: number;
  userId?: number;
  deliveryAddress: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  orderDate: Date;
  deliveryDate: Date;
  totalPrice: number;
  status: string;
  paymentMethod: string;

  // Onfleet integration fields
  onfleetTaskId?: string;
  onfleetTaskShortId?: string;
  assignedDriverId?: number;
  deliveryWindowStart?: Date;
  deliveryWindowEnd?: Date;
  actualDeliveryTime?: Date;
  driverPayoutAmount?: number;
  driverPayoutStatus?: string;
  routeMetrics?: RouteMetrics;

  // Relations
  orderDetails: Array<{
    id: number;
    productId: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      title: string;
      description: string;
      imageSrc: string;
    };
  }>;
  assignedDriver?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

// ===== DELIVERY & LOGISTICS TYPES =====

export interface OrderCapacity {
  totalWeight: number;
  totalVolume: number;
  itemCount: number;
  capacityScore: number;
}

export interface DeliveryTimeWindow {
  start: Date;
  end: Date;
  isSameDay: boolean;
  deliveryDate: string;
}

export interface RouteMetrics {
  drivingTime: number; // in seconds
  drivingDistance: number; // in meters
  idleTime?: number;
  serviceTime?: number;
  stopsCount: number;
  startTime?: number;
  endTime?: number;
  totalMiles?: number; // converted from meters
  totalHours?: number; // converted from seconds
}

export interface DriverPayoutCalculation {
  baseFee: number; // $20 base
  stopFee: number; // $2 per stop
  mileageFee: number; // $0.67 per mile
  timeFee: number; // $14 per hour
  totalPayout: number;
  breakdown: {
    baseAmount: number;
    stopsAmount: number;
    mileageAmount: number;
    timeAmount: number;
  };
  metrics: RouteMetrics;
}

// ===== STATUS & PREFERENCE TYPES =====

export type OrderStatus =
  | 'Pending' // Order created, not yet scheduled
  | 'Scheduled' // Onfleet task created and assigned to team
  | 'Dispatched' // Driver assigned and en route
  | 'In Transit' // Driver picked up items and heading to delivery
  | 'Delivered' // Successfully delivered
  | 'Failed' // Delivery failed
  | 'Cancelled' // Order cancelled
  | 'Returned'; // Items returned to warehouse

export type PayoutStatus =
  | 'pending' // Awaiting payout calculation
  | 'calculated' // Payout amount calculated
  | 'processing' // Stripe transfer initiated
  | 'completed' // Payout successful
  | 'failed' // Payout failed
  | 'cancelled'; // Payout cancelled

export interface DeliveryPreference {
  timeSlot: 'morning' | 'afternoon' | 'evening';
  specialInstructions?: string;
  contactPreference: 'call' | 'text' | 'email';
}

// ===== REPORTING & ANALYTICS TYPES =====

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  scheduledOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalDriverPayouts: number;
  averageOrderValue: number;
  averageDeliveryTime: number; // in minutes
}

export interface DispatchSummary {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  routesCreated: number;
  driversAssigned: number;
  estimatedDeliveryTime: number; // total minutes
  capacityUtilization: number; // percentage
  orders: Array<{
    id: number;
    customerName: string;
    address: string;
    capacity: OrderCapacity;
    timeWindow: DeliveryTimeWindow;
    status: OrderStatus;
  }>;
}

// ===== ERROR HANDLING TYPES =====

export interface OrderProcessingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface OrderValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  warnings: string[];
  errors: string[];
}

// ===== TRACKING & MONITORING TYPES =====

export interface OrderTracking {
  orderId: number;
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  driverInfo?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  trackingUrl?: string;
  deliveryProgress: {
    orderReceived: Date;
    scheduled?: Date;
    dispatched?: Date;
    inTransit?: Date;
    delivered?: Date;
  };
  timeline: Array<{
    timestamp: Date;
    event: string;
    description: string;
  }>;
}

// ===== BULK OPERATIONS TYPES =====

export interface BulkOrderOperation {
  operation: 'dispatch' | 'cancel' | 'reschedule';
  orderIds: number[];
  parameters?: {
    newDeliveryDate?: Date;
    reason?: string;
  };
}

export interface BulkOrderResult {
  successful: number[];
  failed: Array<{
    orderId: number;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ===== ENHANCED TYPES FOR API RESPONSES =====

export interface PackingSupplyOrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  deliveryDate: Date;
  trackingUrl?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  driver?: {
    name: string;
    phone: string;
    estimatedArrival?: Date;
  };
}

export interface PackingSupplyRouteResponse {
  routeId: string;
  driverId: number;
  orders: PackingSupplyOrderResponse[];
  metrics: RouteMetrics;
  estimatedDuration: number; // minutes
  status: 'planned' | 'active' | 'completed';
}

// ===== TYPE GUARDS =====

export function isValidOrderStatus(status: string): status is OrderStatus {
  const validStatuses: OrderStatus[] = [
    'Pending',
    'Scheduled',
    'Dispatched',
    'In Transit',
    'Delivered',
    'Failed',
    'Cancelled',
    'Returned',
  ];
  return validStatuses.includes(status as OrderStatus);
}

export function isValidPayoutStatus(status: string): status is PayoutStatus {
  const validStatuses: PayoutStatus[] = [
    'pending',
    'calculated',
    'processing',
    'completed',
    'failed',
    'cancelled',
  ];
  return validStatuses.includes(status as PayoutStatus);
}

export function isDeliveryTimeSlot(
  slot: string
): slot is 'morning' | 'afternoon' | 'evening' {
  return ['morning', 'afternoon', 'evening'].includes(slot);
}
