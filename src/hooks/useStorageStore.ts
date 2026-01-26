/**
 * @fileoverview Zustand store for storage calculator state management
 * Manages selected items, calculates volumes, and tracks 3D packing positions
 *
 * STATE INCLUDES:
 * - Selected items with quantities
 * - Total cubic footage calculation
 * - Number of units recommended
 * - Packed item positions for 3D visualization
 *
 * USAGE:
 * const { selectedItems, addItem, removeItem } = useStorageStore();
 * const totalVolume = useStorageStore(state => state.totalVolumeCubicFeet);
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  INVENTORY_ITEMS,
  calculateCubicFeet,
  type InventoryItem,
} from '@/data/inventoryData';
import {
  packItems,
  calculateRecommendedUnits,
  CONTAINER,
  type PackedItem,
  type SelectedItem,
} from '@/lib/utils';

// ==================== TYPES ====================

export interface StorageStoreState {
  /** Map of item ID to quantity */
  selectedItems: Map<string, number>;

  /** Total volume in cubic feet */
  totalVolumeCubicFeet: number;

  /** Recommended number of Boombox units */
  unitsRecommended: number;

  /** Packed items with 3D positions */
  packedItems: PackedItem[];

  /** Number of containers needed based on packing */
  containerCount: number;

  /** Fill percentage of last container */
  lastContainerFillPercent: number;

  /** Currently active category filter */
  activeCategory: string | null;
}

export interface StorageStoreActions {
  /** Add one item to selection */
  addItem: (itemId: string) => void;

  /** Remove one item from selection */
  removeItem: (itemId: string) => void;

  /** Set specific quantity for an item */
  setItemQuantity: (itemId: string, quantity: number) => void;

  /** Clear all selected items */
  clearAll: () => void;

  /** Set active category filter */
  setActiveCategory: (category: string | null) => void;

  /** Get quantity for a specific item */
  getItemQuantity: (itemId: string) => number;

  /** Get total item count */
  getTotalItemCount: () => number;
}

export type StorageStore = StorageStoreState & StorageStoreActions;

// ==================== HELPER FUNCTIONS ====================

/**
 * Recalculate all derived state (volume, packing, etc.)
 */
function recalculateState(
  selectedItems: Map<string, number>
): Pick<
  StorageStoreState,
  | 'totalVolumeCubicFeet'
  | 'unitsRecommended'
  | 'packedItems'
  | 'containerCount'
  | 'lastContainerFillPercent'
> {
  // Calculate total volume
  let totalVolumeCubicFeet = 0;
  const itemsForPacking: SelectedItem[] = [];

  selectedItems.forEach((quantity, itemId) => {
    const item = INVENTORY_ITEMS.find(i => i.id === itemId);
    if (item && quantity > 0) {
      totalVolumeCubicFeet += calculateCubicFeet(item) * quantity;
      itemsForPacking.push({
        itemId,
        quantity,
        width: item.width,
        depth: item.depth,
        height: item.height,
        color: item.color,
      });
    }
  });

  // Calculate recommended units (simple volume-based)
  const unitsRecommended = calculateRecommendedUnits(totalVolumeCubicFeet);

  // Run bin-packing algorithm for 3D positions
  const packingResult = packItems(itemsForPacking);

  return {
    totalVolumeCubicFeet,
    unitsRecommended,
    packedItems: packingResult.packedItems,
    containerCount: packingResult.containerCount,
    lastContainerFillPercent: packingResult.lastContainerFillPercent,
  };
}

// ==================== STORE ====================

export const useStorageStore = create<StorageStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedItems: new Map<string, number>(),
    totalVolumeCubicFeet: 0,
    unitsRecommended: 0,
    packedItems: [],
    containerCount: 0,
    lastContainerFillPercent: 0,
    activeCategory: null,

    // Actions
    addItem: (itemId: string) => {
      set(state => {
        const newSelectedItems = new Map(state.selectedItems);
        const currentQuantity = newSelectedItems.get(itemId) || 0;
        newSelectedItems.set(itemId, currentQuantity + 1);

        return {
          selectedItems: newSelectedItems,
          ...recalculateState(newSelectedItems),
        };
      });
    },

    removeItem: (itemId: string) => {
      set(state => {
        const newSelectedItems = new Map(state.selectedItems);
        const currentQuantity = newSelectedItems.get(itemId) || 0;

        if (currentQuantity <= 1) {
          newSelectedItems.delete(itemId);
        } else {
          newSelectedItems.set(itemId, currentQuantity - 1);
        }

        return {
          selectedItems: newSelectedItems,
          ...recalculateState(newSelectedItems),
        };
      });
    },

    setItemQuantity: (itemId: string, quantity: number) => {
      set(state => {
        const newSelectedItems = new Map(state.selectedItems);

        if (quantity <= 0) {
          newSelectedItems.delete(itemId);
        } else {
          newSelectedItems.set(itemId, quantity);
        }

        return {
          selectedItems: newSelectedItems,
          ...recalculateState(newSelectedItems),
        };
      });
    },

    clearAll: () => {
      set({
        selectedItems: new Map<string, number>(),
        totalVolumeCubicFeet: 0,
        unitsRecommended: 0,
        packedItems: [],
        containerCount: 0,
        lastContainerFillPercent: 0,
      });
    },

    setActiveCategory: (category: string | null) => {
      set({ activeCategory: category });
    },

    getItemQuantity: (itemId: string) => {
      return get().selectedItems.get(itemId) || 0;
    },

    getTotalItemCount: () => {
      let total = 0;
      get().selectedItems.forEach(quantity => {
        total += quantity;
      });
      return total;
    },
  }))
);

// ==================== SELECTORS ====================

/**
 * Get selected items as an array with full item details
 */
export function useSelectedItemsWithDetails(): Array<{
  item: InventoryItem;
  quantity: number;
}> {
  const selectedItems = useStorageStore(state => state.selectedItems);

  const result: Array<{ item: InventoryItem; quantity: number }> = [];

  selectedItems.forEach((quantity, itemId) => {
    const item = INVENTORY_ITEMS.find(i => i.id === itemId);
    if (item) {
      result.push({ item, quantity });
    }
  });

  return result;
}

/**
 * Get container capacity constant
 */
export function getContainerCapacity(): number {
  return CONTAINER.CUBIC_FEET;
}

// Re-export types for convenience
export type { PackedItem, SelectedItem };
