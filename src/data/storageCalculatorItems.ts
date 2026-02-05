/**
 * @fileoverview Storage calculator item definitions
 * Contains all storable items with dimensions, categories, and icon mappings
 */

export type ItemCategory = 'bedroom' | 'living-room' | 'kitchen' | 'boxes';

export interface StorageItem {
  id: string;
  name: string;
  dimensions: {
    length: number; // inches
    width: number; // inches
    height: number; // inches
  };
  category: ItemCategory;
  iconPath: string;
}

export interface CustomItem extends Omit<StorageItem, 'category' | 'iconPath'> {
  isCustom: true;
}

/**
 * Boombox interior dimensions in inches
 * From ContainerInfoSection.tsx
 */
export const BOOMBOX_DIMENSIONS = {
  length: 95, // 7ft. 11 in.
  width: 56, // 4ft. 8 in.
  height: 83.5, // 6ft. 11.5 in.
} as const;

/**
 * Boombox interior volume in cubic inches
 */
export const BOOMBOX_VOLUME =
  BOOMBOX_DIMENSIONS.length *
  BOOMBOX_DIMENSIONS.width *
  BOOMBOX_DIMENSIONS.height; // ~444,310 cubic inches

/**
 * Packing efficiency factor (accounts for irregular shapes, stacking, etc.)
 */
export const PACKING_EFFICIENCY = 0.7;

/**
 * Maximum number of units per order
 */
export const MAX_UNITS_PER_ORDER = 4;

/**
 * Category filter options
 */
export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All items' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'boxes', label: 'Boxes' },
] as const;

/**
 * Storage items data mapped from CSV with icon paths
 */
export const STORAGE_ITEMS: StorageItem[] = [
  // Bedroom items
  {
    id: 'single-mattress',
    name: 'Single Mattress',
    dimensions: { length: 70, width: 36, height: 14 },
    category: 'bedroom',
    iconPath: '/boombox-icons/single-mattress.png',
  },
  {
    id: 'queen-king-mattress',
    name: 'Queen/King Mattress',
    dimensions: { length: 80, width: 62, height: 14 },
    category: 'bedroom',
    iconPath: '/boombox-icons/queen-mattress.png',
  },
  {
    id: 'box-spring',
    name: 'Box Spring',
    dimensions: { length: 82, width: 67, height: 13 },
    category: 'bedroom',
    iconPath: '/boombox-icons/box-spring.png',
  },
  {
    id: 'bed-frame',
    name: 'Bed Frame',
    dimensions: { length: 81, width: 67, height: 5 },
    category: 'bedroom',
    iconPath: '/boombox-icons/bedframe.png',
  },
  {
    id: 'bedside-table',
    name: 'Bedside Table',
    dimensions: { length: 18, width: 18, height: 20 },
    category: 'bedroom',
    iconPath: '/boombox-icons/bedside-table.png',
  },
  {
    id: 'dresser',
    name: 'Dresser',
    dimensions: { length: 47, width: 18, height: 36 },
    category: 'bedroom',
    iconPath: '/boombox-icons/dresser.png',
  },

  // Living Room items
  {
    id: 'desk',
    name: 'Desk',
    dimensions: { length: 49, width: 25, height: 31 },
    category: 'living-room',
    iconPath: '/boombox-icons/desk.png',
  },
  {
    id: 'small-dining-table',
    name: 'Small Dining Table',
    dimensions: { length: 24, width: 17, height: 30 },
    category: 'living-room',
    iconPath: '/boombox-icons/small-dining-table.png',
  },
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    dimensions: { length: 39, width: 25, height: 16 },
    category: 'living-room',
    iconPath: '/boombox-icons/coffee-table.png',
  },
  {
    id: 'dining-table-4-6',
    name: 'Dining Table (4-6)',
    dimensions: { length: 67, width: 35, height: 30 },
    category: 'living-room',
    iconPath: '/boombox-icons/dining-table.png',
  },
  {
    id: 'dining-table-8-plus',
    name: 'Dining Table (8+)',
    dimensions: { length: 88, width: 40, height: 30 },
    category: 'living-room',
    iconPath: '/boombox-icons/large-dining-table.png',
  },
  {
    id: 'chair',
    name: 'Chair',
    dimensions: { length: 16, width: 21, height: 43 },
    category: 'living-room',
    iconPath: '/boombox-icons/dining-chair.png',
  },
  {
    id: 'armchair',
    name: 'Armchair',
    dimensions: { length: 32, width: 29, height: 31 },
    category: 'living-room',
    iconPath: '/boombox-icons/armchair.png',
  },
  {
    id: 'sofa-chair',
    name: 'Sofa Chair',
    dimensions: { length: 36, width: 32, height: 35 },
    category: 'living-room',
    iconPath: '/boombox-icons/sofa-chair.png',
  },
  {
    id: '2-seat-sofa',
    name: '2-Seat Sofa',
    dimensions: { length: 57, width: 33, height: 33 },
    category: 'living-room',
    iconPath: '/boombox-icons/two-seater-sofa.png',
  },
  {
    id: '3-seat-sofa',
    name: '3-Seat Sofa',
    dimensions: { length: 83, width: 32, height: 32 },
    category: 'living-room',
    iconPath: '/boombox-icons/three-seater-sofa.png',
  },
  {
    id: 'tv',
    name: 'TV',
    dimensions: { length: 35, width: 5, height: 28 },
    category: 'living-room',
    iconPath: '/boombox-icons/tv.png',
  },
  {
    id: 'tv-stand',
    name: 'TV Stand',
    dimensions: { length: 59, width: 20, height: 19 },
    category: 'living-room',
    iconPath: '/boombox-icons/media-console.png',
  },
  {
    id: 'buffet',
    name: 'Buffet',
    dimensions: { length: 49, width: 18, height: 34 },
    category: 'living-room',
    iconPath: '/boombox-icons/buffet.png',
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    dimensions: { length: 27, width: 18, height: 49 },
    category: 'living-room',
    iconPath: '/boombox-icons/bookshelf.png',
  },
  {
    id: 'rug',
    name: 'Rug',
    dimensions: { length: 9, width: 9, height: 35 },
    category: 'living-room',
    iconPath: '/boombox-icons/rug.png',
  },
  {
    id: 'painting',
    name: 'Painting',
    dimensions: { length: 38, width: 4, height: 40 },
    category: 'living-room',
    iconPath: '/boombox-icons/painting.png',
  },
  {
    id: 'stool',
    name: 'Stool',
    dimensions: { length: 11, width: 11, height: 31 },
    category: 'living-room',
    iconPath: '/boombox-icons/stool.png',
  },

  // Kitchen items
  {
    id: 'mini-fridge',
    name: 'Mini Fridge',
    dimensions: { length: 20, width: 19, height: 33 },
    category: 'kitchen',
    iconPath: '/boombox-icons/mini-fridge.png',
  },
  {
    id: 'microwave',
    name: 'Microwave',
    dimensions: { length: 20, width: 15, height: 12 },
    category: 'kitchen',
    iconPath: '/boombox-icons/microwave.png',
  },

  // Boxes
  {
    id: 'small-box',
    name: 'Small Box',
    dimensions: { length: 16, width: 10, height: 12 },
    category: 'boxes',
    iconPath: '/boombox-icons/small-box.png',
  },
  {
    id: 'medium-box',
    name: 'Medium Box',
    dimensions: { length: 20, width: 16, height: 15 },
    category: 'boxes',
    iconPath: '/boombox-icons/medium-box.png',
  },
  {
    id: 'large-box',
    name: 'Large Box',
    dimensions: { length: 26, width: 16, height: 15 },
    category: 'boxes',
    iconPath: '/boombox-icons/large-box.png',
  },
  {
    id: 'toolbox',
    name: 'Toolbox',
    dimensions: { length: 39, width: 22, height: 35 },
    category: 'boxes',
    iconPath: '/boombox-icons/toolbox.png',
  },
  {
    id: 'plastic-bin',
    name: 'Plastic Bin',
    dimensions: { length: 31, width: 21, height: 15 },
    category: 'boxes',
    iconPath: '/boombox-icons/plastic-bin.png',
  },
  {
    id: 'clear-plastic-bin',
    name: 'Clear Plastic Bin',
    dimensions: { length: 27, width: 17, height: 14 },
    category: 'boxes',
    iconPath: '/boombox-icons/clear-plastic-bin.png',
  },
  {
    id: 'wardrobe-box',
    name: 'Wardrobe Box',
    dimensions: { length: 25, width: 24, height: 36 },
    category: 'boxes',
    iconPath: '/boombox-icons/wardrobe-box.png',
  },
];

/**
 * Get items filtered by category
 */
export function getItemsByCategory(category: string): StorageItem[] {
  if (category === 'all') {
    return STORAGE_ITEMS;
  }
  return STORAGE_ITEMS.filter(item => item.category === category);
}

/**
 * Calculate volume of an item in cubic inches
 */
export function calculateItemVolume(dimensions: {
  length: number;
  width: number;
  height: number;
}): number {
  return dimensions.length * dimensions.width * dimensions.height;
}

/**
 * Calculate number of Boomboxes needed for a given total volume
 */
export function calculateUnitsNeeded(totalVolume: number): number {
  const effectiveVolume = BOOMBOX_VOLUME * PACKING_EFFICIENCY;
  return Math.ceil(totalVolume / effectiveVolume);
}
