/**
 * @fileoverview Household inventory items for storage calculator
 * Contains categorized items with dimensions in inches for 3D visualization
 *
 * DIMENSION NOTES:
 * - All dimensions are in inches (width x depth x height)
 * - Large flat items (beds, sofas) are assumed to be stored vertically
 *   to maximize the 83.5" interior height of the Boombox container
 * - Container interior: 95" L x 56" W x 83.5" H (~257 cubic feet)
 */

import type { LucideIcon } from 'lucide-react';
import {
  Bed,
  Sofa,
  Tv,
  Lamp,
  Armchair,
  Monitor,
  BookOpen,
  Package,
  Box,
  Archive,
  Bike,
  Dumbbell,
  Baby,
  Refrigerator,
  CookingPot,
  UtensilsCrossed,
  Shirt,
  TreeDeciduous,
  Guitar,
  Gamepad2,
} from 'lucide-react';

// ==================== TYPES ====================

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  /** Width in inches */
  width: number;
  /** Depth in inches */
  depth: number;
  /** Height in inches */
  height: number;
  /** Icon component from Lucide */
  icon: LucideIcon;
  /** Display color for 3D visualization */
  color: string;
}

export type InventoryCategory =
  | 'bedroom'
  | 'living-room'
  | 'kitchen'
  | 'office'
  | 'boxes'
  | 'outdoor'
  | 'misc';

export interface CategoryInfo {
  id: InventoryCategory;
  name: string;
  icon: LucideIcon;
}

// ==================== CATEGORIES ====================

export const CATEGORIES: CategoryInfo[] = [
  { id: 'bedroom', name: 'Bedroom', icon: Bed },
  { id: 'living-room', name: 'Living Room', icon: Sofa },
  { id: 'kitchen', name: 'Kitchen', icon: Refrigerator },
  { id: 'office', name: 'Office', icon: Monitor },
  { id: 'boxes', name: 'Boxes', icon: Package },
  { id: 'outdoor', name: 'Outdoor', icon: Bike },
  { id: 'misc', name: 'Miscellaneous', icon: Box },
];

// ==================== INVENTORY ITEMS ====================

export const INVENTORY_ITEMS: InventoryItem[] = [
  // ========== BEDROOM ==========
  {
    id: 'king-bed',
    name: 'King Bed Frame',
    category: 'bedroom',
    // Stored on side: 76" wide becomes height, 80" long fits in 95" container
    width: 80,
    depth: 10,
    height: 76,
    icon: Bed,
    color: '#8B5CF6', // Purple
  },
  {
    id: 'queen-bed',
    name: 'Queen Bed Frame',
    category: 'bedroom',
    width: 80,
    depth: 10,
    height: 60,
    icon: Bed,
    color: '#A78BFA',
  },
  {
    id: 'king-mattress',
    name: 'King Mattress',
    category: 'bedroom',
    // Stored standing up: 76" wide, 80" long, ~12" thick
    width: 80,
    depth: 12,
    height: 76,
    icon: Bed,
    color: '#7C3AED',
  },
  {
    id: 'queen-mattress',
    name: 'Queen Mattress',
    category: 'bedroom',
    width: 80,
    depth: 12,
    height: 60,
    icon: Bed,
    color: '#8B5CF6',
  },
  {
    id: 'dresser',
    name: 'Dresser (6 Drawer)',
    category: 'bedroom',
    width: 60,
    depth: 18,
    height: 32,
    icon: Box,
    color: '#D97706',
  },
  {
    id: 'nightstand',
    name: 'Nightstand',
    category: 'bedroom',
    width: 24,
    depth: 18,
    height: 26,
    icon: Lamp,
    color: '#F59E0B',
  },
  {
    id: 'wardrobe',
    name: 'Wardrobe',
    category: 'bedroom',
    width: 40,
    depth: 24,
    height: 72,
    icon: Shirt,
    color: '#92400E',
  },

  // ========== LIVING ROOM ==========
  {
    id: 'sofa-3-seat',
    name: '3-Seat Sofa',
    category: 'living-room',
    // Stored on end to maximize height usage
    width: 85,
    depth: 36,
    height: 35,
    icon: Sofa,
    color: '#0EA5E9', // Blue
  },
  {
    id: 'sofa-2-seat',
    name: 'Loveseat (2-Seat)',
    category: 'living-room',
    width: 60,
    depth: 36,
    height: 35,
    icon: Sofa,
    color: '#38BDF8',
  },
  {
    id: 'armchair',
    name: 'Armchair',
    category: 'living-room',
    width: 36,
    depth: 34,
    height: 36,
    icon: Armchair,
    color: '#0284C7',
  },
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    category: 'living-room',
    width: 48,
    depth: 24,
    height: 18,
    icon: Box,
    color: '#D97706',
  },
  {
    id: 'tv-55',
    name: '55" TV (boxed)',
    category: 'living-room',
    width: 50,
    depth: 6,
    height: 32,
    icon: Tv,
    color: '#1F2937',
  },
  {
    id: 'tv-65',
    name: '65" TV (boxed)',
    category: 'living-room',
    width: 58,
    depth: 6,
    height: 36,
    icon: Tv,
    color: '#111827',
  },
  {
    id: 'entertainment-center',
    name: 'Entertainment Center',
    category: 'living-room',
    width: 60,
    depth: 20,
    height: 24,
    icon: Tv,
    color: '#78350F',
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf (5 Shelf)',
    category: 'living-room',
    width: 36,
    depth: 12,
    height: 72,
    icon: BookOpen,
    color: '#B45309',
  },
  {
    id: 'floor-lamp',
    name: 'Floor Lamp',
    category: 'living-room',
    width: 18,
    depth: 18,
    height: 65,
    icon: Lamp,
    color: '#FCD34D',
  },

  // ========== KITCHEN ==========
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: 'kitchen',
    width: 36,
    depth: 32,
    height: 70,
    icon: Refrigerator,
    color: '#9CA3AF',
  },
  {
    id: 'dining-table-6',
    name: 'Dining Table (6 Seat)',
    category: 'kitchen',
    // Table top stored on side
    width: 72,
    depth: 6,
    height: 42,
    icon: UtensilsCrossed,
    color: '#78350F',
  },
  {
    id: 'dining-table-4',
    name: 'Dining Table (4 Seat)',
    category: 'kitchen',
    width: 48,
    depth: 6,
    height: 36,
    icon: UtensilsCrossed,
    color: '#92400E',
  },
  {
    id: 'dining-chair',
    name: 'Dining Chair',
    category: 'kitchen',
    width: 20,
    depth: 20,
    height: 38,
    icon: Armchair,
    color: '#B45309',
  },
  {
    id: 'bar-stool',
    name: 'Bar Stool',
    category: 'kitchen',
    width: 16,
    depth: 16,
    height: 30,
    icon: Armchair,
    color: '#D97706',
  },
  {
    id: 'microwave',
    name: 'Microwave',
    category: 'kitchen',
    width: 24,
    depth: 18,
    height: 14,
    icon: CookingPot,
    color: '#4B5563',
  },

  // ========== OFFICE ==========
  {
    id: 'office-desk',
    name: 'Office Desk',
    category: 'office',
    width: 60,
    depth: 30,
    height: 30,
    icon: Monitor,
    color: '#374151',
  },
  {
    id: 'office-chair',
    name: 'Office Chair',
    category: 'office',
    width: 26,
    depth: 26,
    height: 42,
    icon: Armchair,
    color: '#1F2937',
  },
  {
    id: 'filing-cabinet',
    name: 'Filing Cabinet (2 Drawer)',
    category: 'office',
    width: 15,
    depth: 22,
    height: 28,
    icon: Archive,
    color: '#6B7280',
  },
  {
    id: 'computer-monitor',
    name: 'Computer Monitor (boxed)',
    category: 'office',
    width: 26,
    depth: 8,
    height: 18,
    icon: Monitor,
    color: '#111827',
  },

  // ========== BOXES ==========
  {
    id: 'box-small',
    name: 'Small Box',
    category: 'boxes',
    width: 16,
    depth: 12,
    height: 12,
    icon: Package,
    color: '#D4A574',
  },
  {
    id: 'box-medium',
    name: 'Medium Box',
    category: 'boxes',
    width: 18,
    depth: 18,
    height: 16,
    icon: Package,
    color: '#C4956A',
  },
  {
    id: 'box-large',
    name: 'Large Box',
    category: 'boxes',
    width: 24,
    depth: 18,
    height: 18,
    icon: Box,
    color: '#B4855A',
  },
  {
    id: 'box-wardrobe',
    name: 'Wardrobe Box',
    category: 'boxes',
    width: 24,
    depth: 21,
    height: 46,
    icon: Shirt,
    color: '#A4754A',
  },
  {
    id: 'box-dish-pack',
    name: 'Dish Pack Box',
    category: 'boxes',
    width: 18,
    depth: 18,
    height: 28,
    icon: CookingPot,
    color: '#94653A',
  },

  // ========== OUTDOOR ==========
  {
    id: 'bicycle',
    name: 'Bicycle',
    category: 'outdoor',
    width: 68,
    depth: 24,
    height: 42,
    icon: Bike,
    color: '#DC2626',
  },
  {
    id: 'lawn-mower',
    name: 'Lawn Mower (push)',
    category: 'outdoor',
    width: 24,
    depth: 56,
    height: 42,
    icon: TreeDeciduous,
    color: '#16A34A',
  },
  {
    id: 'patio-chair',
    name: 'Patio Chair',
    category: 'outdoor',
    width: 26,
    depth: 28,
    height: 36,
    icon: Armchair,
    color: '#15803D',
  },
  {
    id: 'grill',
    name: 'BBQ Grill',
    category: 'outdoor',
    width: 52,
    depth: 24,
    height: 44,
    icon: CookingPot,
    color: '#1F2937',
  },

  // ========== MISCELLANEOUS ==========
  {
    id: 'exercise-bike',
    name: 'Exercise Bike',
    category: 'misc',
    width: 40,
    depth: 20,
    height: 50,
    icon: Bike,
    color: '#7C3AED',
  },
  {
    id: 'weight-bench',
    name: 'Weight Bench',
    category: 'misc',
    width: 50,
    depth: 28,
    height: 48,
    icon: Dumbbell,
    color: '#4B5563',
  },
  {
    id: 'treadmill',
    name: 'Treadmill (folded)',
    category: 'misc',
    width: 36,
    depth: 28,
    height: 60,
    icon: Dumbbell,
    color: '#374151',
  },
  {
    id: 'crib',
    name: 'Crib (disassembled)',
    category: 'misc',
    width: 52,
    depth: 8,
    height: 36,
    icon: Baby,
    color: '#F9A8D4',
  },
  {
    id: 'stroller',
    name: 'Stroller (folded)',
    category: 'misc',
    width: 24,
    depth: 20,
    height: 40,
    icon: Baby,
    color: '#EC4899',
  },
  {
    id: 'guitar-case',
    name: 'Guitar (in case)',
    category: 'misc',
    width: 44,
    depth: 6,
    height: 18,
    icon: Guitar,
    color: '#92400E',
  },
  {
    id: 'gaming-console',
    name: 'Gaming Console (boxed)',
    category: 'misc',
    width: 16,
    depth: 12,
    height: 8,
    icon: Gamepad2,
    color: '#1F2937',
  },
  {
    id: 'suitcase-large',
    name: 'Large Suitcase',
    category: 'misc',
    width: 30,
    depth: 12,
    height: 20,
    icon: Package,
    color: '#1E40AF',
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get items filtered by category
 */
export function getItemsByCategory(
  category: InventoryCategory
): InventoryItem[] {
  return INVENTORY_ITEMS.filter(item => item.category === category);
}

/**
 * Get item by ID
 */
export function getItemById(id: string): InventoryItem | undefined {
  return INVENTORY_ITEMS.find(item => item.id === id);
}

/**
 * Calculate cubic feet for an item
 * Converts from cubic inches to cubic feet (divide by 1728)
 */
export function calculateCubicFeet(item: InventoryItem): number {
  return (item.width * item.depth * item.height) / 1728;
}
