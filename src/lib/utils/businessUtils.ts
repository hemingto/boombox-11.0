/**
 * @fileoverview Business logic utilities
 * @source boombox-10.0 capacity and business functions
 * @refactor Consolidated business logic
 */

export interface OrderItem {
  weight: number;
  quantity: number;
}

/**
 * Calculate total weight of order items
 */
export function calculateOrderWeight(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

/**
 * Check if driver has capacity for new order
 */
export function hasCapacity(
  currentLoad: number,
  newOrderWeight: number,
  capacityLimit: number
): boolean {
  return currentLoad + newOrderWeight <= capacityLimit;
}

/**
 * Parse loading help price from string
 */
export function parseLoadingHelpPrice(price: string): number {
  if (price !== '---') {
    const priceMatch = price.match(/\$(\d+)/);
    if (priceMatch) return parseInt(priceMatch[1], 10);
  }
  return 0;
}
