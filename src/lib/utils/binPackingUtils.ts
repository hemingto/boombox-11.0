/**
 * @fileoverview Next-Fit Decreasing (NFD) bin-packing algorithm for storage calculator
 * Places items in 3D space within Boombox containers using shelf-based approach
 *
 * ALGORITHM OVERVIEW:
 * 1. Sort items by height (descending) for optimal vertical stacking
 * 2. Use "shelf" concept - horizontal layers within each container
 * 3. Place items left-to-right on current shelf
 * 4. When item doesn't fit horizontally, start new shelf above
 * 5. When item doesn't fit vertically, move to next container
 *
 * CONTAINER DIMENSIONS (in inches):
 * - Length (X): 95"
 * - Width (Z): 56"
 * - Height (Y): 83.5"
 * - Total capacity: ~257 cubic feet
 */

// ==================== CONSTANTS ====================

/** Container interior dimensions in inches */
export const CONTAINER = {
  LENGTH: 95, // X-axis
  WIDTH: 56, // Z-axis
  HEIGHT: 83.5, // Y-axis
  CUBIC_FEET: 257,
} as const;

/** Spacing between items in inches */
const ITEM_GAP = 1;

/** Spacing between containers for visualization */
export const CONTAINER_GAP = 20;

// ==================== TYPES ====================

export interface PackedItem {
  /** Original item ID */
  itemId: string;
  /** Instance index (for multiple of same item) */
  instanceIndex: number;
  /** Container index (0-based) */
  containerIndex: number;
  /** Position in inches relative to container origin */
  position: {
    x: number;
    y: number;
    z: number;
  };
  /** Item dimensions in inches */
  dimensions: {
    width: number;
    depth: number;
    height: number;
  };
  /** Display color */
  color: string;
}

export interface SelectedItem {
  itemId: string;
  quantity: number;
  width: number;
  depth: number;
  height: number;
  color: string;
}

export interface PackingResult {
  /** All packed items with positions */
  packedItems: PackedItem[];
  /** Number of containers needed */
  containerCount: number;
  /** Total volume used in cubic feet */
  totalVolumeCubicFeet: number;
  /** Fill percentage of last container */
  lastContainerFillPercent: number;
}

interface Shelf {
  /** Y position of shelf floor */
  y: number;
  /** Height of tallest item on shelf */
  height: number;
  /** Current X position for next item */
  currentX: number;
  /** Current Z position for next row */
  currentZ: number;
  /** Max Z used in current row */
  rowMaxZ: number;
}

// ==================== PACKING ALGORITHM ====================

/**
 * Pack items into containers using Next-Fit Decreasing algorithm
 *
 * @param selectedItems - Array of items with quantities to pack
 * @returns Packing result with positions and container count
 */
export function packItems(selectedItems: SelectedItem[]): PackingResult {
  if (selectedItems.length === 0) {
    return {
      packedItems: [],
      containerCount: 0,
      totalVolumeCubicFeet: 0,
      lastContainerFillPercent: 0,
    };
  }

  // Expand items by quantity and sort by height (descending)
  const expandedItems = expandAndSortItems(selectedItems);

  const packedItems: PackedItem[] = [];
  let containerIndex = 0;
  let shelf = createNewShelf();
  let totalVolumeInches = 0;

  for (const item of expandedItems) {
    const placed = tryPlaceItem(item, shelf, containerIndex, packedItems);

    if (placed) {
      totalVolumeInches += item.width * item.depth * item.height;
      continue;
    }

    // Try starting a new shelf in current container
    const newShelfY = shelf.y + shelf.height + ITEM_GAP;
    if (newShelfY + item.height <= CONTAINER.HEIGHT) {
      shelf = createNewShelf(newShelfY);
      const placedOnNewShelf = tryPlaceItem(
        item,
        shelf,
        containerIndex,
        packedItems
      );
      if (placedOnNewShelf) {
        totalVolumeInches += item.width * item.depth * item.height;
        continue;
      }
    }

    // Need a new container
    containerIndex++;
    shelf = createNewShelf();
    const placedInNewContainer = tryPlaceItem(
      item,
      shelf,
      containerIndex,
      packedItems
    );
    if (placedInNewContainer) {
      totalVolumeInches += item.width * item.depth * item.height;
    }
    // Note: In rare cases of oversized items, they may not fit at all
    // For now, we assume all items in inventory fit in a single container
  }

  const totalVolumeCubicFeet = totalVolumeInches / 1728;
  const containerCount = containerIndex + 1;

  // Calculate fill percentage of last container
  const volumePerContainer = CONTAINER.CUBIC_FEET;
  const fullContainerVolume = (containerCount - 1) * volumePerContainer;
  const lastContainerVolume = totalVolumeCubicFeet - fullContainerVolume;
  const lastContainerFillPercent = Math.min(
    (lastContainerVolume / volumePerContainer) * 100,
    100
  );

  return {
    packedItems,
    containerCount,
    totalVolumeCubicFeet,
    lastContainerFillPercent,
  };
}

/**
 * Expand selected items by quantity and sort by height descending
 */
function expandAndSortItems(
  selectedItems: SelectedItem[]
): Array<SelectedItem & { instanceIndex: number }> {
  const expanded: Array<SelectedItem & { instanceIndex: number }> = [];

  for (const item of selectedItems) {
    for (let i = 0; i < item.quantity; i++) {
      expanded.push({ ...item, instanceIndex: i });
    }
  }

  // Sort by height descending (NFD - Next Fit Decreasing)
  return expanded.sort((a, b) => b.height - a.height);
}

/**
 * Create a new shelf at the given Y position
 */
function createNewShelf(y: number = 0): Shelf {
  return {
    y,
    height: 0,
    currentX: 0,
    currentZ: 0,
    rowMaxZ: 0,
  };
}

/**
 * Try to place an item on the current shelf
 * Returns true if successful, false if item doesn't fit
 */
function tryPlaceItem(
  item: SelectedItem & { instanceIndex: number },
  shelf: Shelf,
  containerIndex: number,
  packedItems: PackedItem[]
): boolean {
  // Check if item fits in remaining X space on current row
  if (shelf.currentX + item.width <= CONTAINER.LENGTH) {
    // Check if item fits in remaining Z space on current row
    if (shelf.currentZ + item.depth <= CONTAINER.WIDTH) {
      // Place item
      packedItems.push({
        itemId: item.itemId,
        instanceIndex: item.instanceIndex,
        containerIndex,
        position: {
          x: shelf.currentX,
          y: shelf.y,
          z: shelf.currentZ,
        },
        dimensions: {
          width: item.width,
          depth: item.depth,
          height: item.height,
        },
        color: item.color,
      });

      // Update shelf state
      shelf.currentX += item.width + ITEM_GAP;
      shelf.height = Math.max(shelf.height, item.height);
      shelf.rowMaxZ = Math.max(shelf.rowMaxZ, item.depth);

      return true;
    }
  }

  // Try starting a new row on the same shelf
  const newRowZ = shelf.currentZ + shelf.rowMaxZ + ITEM_GAP;
  if (newRowZ + item.depth <= CONTAINER.WIDTH) {
    // Check if item fits in X
    if (item.width <= CONTAINER.LENGTH) {
      // Start new row
      shelf.currentX = 0;
      shelf.currentZ = newRowZ;
      shelf.rowMaxZ = 0;

      // Place item
      packedItems.push({
        itemId: item.itemId,
        instanceIndex: item.instanceIndex,
        containerIndex,
        position: {
          x: shelf.currentX,
          y: shelf.y,
          z: shelf.currentZ,
        },
        dimensions: {
          width: item.width,
          depth: item.depth,
          height: item.height,
        },
        color: item.color,
      });

      // Update shelf state
      shelf.currentX = item.width + ITEM_GAP;
      shelf.height = Math.max(shelf.height, item.height);
      shelf.rowMaxZ = item.depth;

      return true;
    }
  }

  return false;
}

/**
 * Calculate recommended number of containers based on total volume
 * Uses simple volume calculation, not bin-packing
 */
export function calculateRecommendedUnits(totalCubicFeet: number): number {
  if (totalCubicFeet === 0) return 0;
  return Math.ceil(totalCubicFeet / CONTAINER.CUBIC_FEET);
}

/**
 * Convert container position from inches to Three.js units
 * Three.js uses a different coordinate system, so we scale and offset
 *
 * @param position - Position in inches
 * @param dimensions - Item dimensions in inches
 * @param containerIndex - Which container (for X offset)
 * @param scale - Scale factor (default 0.01 for reasonable 3D scene size)
 */
export function toThreeJSPosition(
  position: { x: number; y: number; z: number },
  dimensions: { width: number; depth: number; height: number },
  containerIndex: number,
  scale: number = 0.01
): { x: number; y: number; z: number } {
  // Container offset in X direction
  const containerOffset = containerIndex * (CONTAINER.LENGTH + CONTAINER_GAP);

  // Center items within container and offset to container center
  return {
    x:
      (position.x +
        dimensions.width / 2 -
        CONTAINER.LENGTH / 2 +
        containerOffset) *
      scale,
    y: (position.y + dimensions.height / 2) * scale,
    z: (position.z + dimensions.depth / 2 - CONTAINER.WIDTH / 2) * scale,
  };
}

/**
 * Convert dimensions from inches to Three.js scale
 */
export function toThreeJSDimensions(
  dimensions: { width: number; depth: number; height: number },
  scale: number = 0.01
): { width: number; height: number; depth: number } {
  return {
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    depth: dimensions.depth * scale,
  };
}

/**
 * Get container dimensions in Three.js units
 */
export function getContainerThreeJSDimensions(scale: number = 0.01) {
  return {
    width: CONTAINER.LENGTH * scale,
    height: CONTAINER.HEIGHT * scale,
    depth: CONTAINER.WIDTH * scale,
  };
}

/**
 * Get container center position for a given container index
 */
export function getContainerCenterPosition(
  containerIndex: number,
  scale: number = 0.01
): { x: number; y: number; z: number } {
  const containerOffset = containerIndex * (CONTAINER.LENGTH + CONTAINER_GAP);
  return {
    x: containerOffset * scale,
    y: (CONTAINER.HEIGHT / 2) * scale,
    z: 0,
  };
}
