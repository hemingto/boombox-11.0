/**
 * @fileoverview Storage calculator state management hook
 * Manages item selection, quantities, custom items, and calculation logic
 */

import { useState, useCallback, useMemo } from 'react';
import {
  StorageItem,
  CustomItem,
  STORAGE_ITEMS,
  getItemsByCategory,
  calculateItemVolume,
  calculateUnitsNeeded,
  MAX_UNITS_PER_ORDER,
} from '@/data/storageCalculatorItems';

export type ViewMode = 'all' | 'selected';
export type CalculatorView = 'selection' | 'results';

export interface CalculatorState {
  /** Map of item ID to quantity */
  selectedItems: Record<string, number>;
  /** Array of custom items added by user */
  customItems: CustomItem[];
  /** Current view: selection or results */
  currentView: CalculatorView;
  /** Category filter value */
  categoryFilter: string;
  /** View mode: all items or selected items only */
  viewMode: ViewMode;
}

export interface CalculationResult {
  totalVolume: number;
  unitsNeeded: number;
  exceedsMaxUnits: boolean;
  totalItemCount: number;
}

export interface UseStorageCalculatorReturn {
  // State
  selectedItems: Record<string, number>;
  customItems: CustomItem[];
  currentView: CalculatorView;
  categoryFilter: string;
  viewMode: ViewMode;

  // Computed values
  filteredItems: StorageItem[];
  displayItems: StorageItem[];
  calculationResult: CalculationResult;
  totalSelectedCount: number;

  // Actions
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  addCustomItem: (item: Omit<CustomItem, 'id' | 'isCustom'>) => void;
  removeCustomItem: (itemId: string) => void;
  incrementCustomItem: (itemId: string) => void;
  decrementCustomItem: (itemId: string) => void;
  setCategoryFilter: (category: string) => void;
  setViewMode: (mode: ViewMode) => void;
  calculate: () => void;
  reset: () => void;
  editSelection: () => void;
}

const initialState: CalculatorState = {
  selectedItems: {},
  customItems: [],
  currentView: 'selection',
  categoryFilter: 'all',
  viewMode: 'all',
};

/**
 * Custom hook for storage calculator state management
 */
export function useStorageCalculator(): UseStorageCalculatorReturn {
  const [state, setState] = useState<CalculatorState>(initialState);

  // Get items filtered by category
  const filteredItems = useMemo(() => {
    return getItemsByCategory(state.categoryFilter);
  }, [state.categoryFilter]);

  // Get items to display based on view mode
  const displayItems = useMemo(() => {
    if (state.viewMode === 'selected') {
      return filteredItems.filter(
        item => (state.selectedItems[item.id] || 0) > 0
      );
    }
    return filteredItems;
  }, [filteredItems, state.viewMode, state.selectedItems]);

  // Calculate total selected item count
  const totalSelectedCount = useMemo(() => {
    const standardItemsCount = Object.values(state.selectedItems).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const customItemsCount = state.customItems.length;
    return standardItemsCount + customItemsCount;
  }, [state.selectedItems, state.customItems]);

  // Calculate results
  const calculationResult = useMemo((): CalculationResult => {
    // Calculate volume from standard items
    let totalVolume = 0;
    let totalItemCount = 0;

    for (const [itemId, quantity] of Object.entries(state.selectedItems)) {
      if (quantity > 0) {
        const item = STORAGE_ITEMS.find(i => i.id === itemId);
        if (item) {
          totalVolume += calculateItemVolume(item.dimensions) * quantity;
          totalItemCount += quantity;
        }
      }
    }

    // Add volume from custom items
    for (const customItem of state.customItems) {
      totalVolume += calculateItemVolume(customItem.dimensions);
      totalItemCount += 1;
    }

    const unitsNeeded = totalVolume > 0 ? calculateUnitsNeeded(totalVolume) : 0;
    const exceedsMaxUnits = unitsNeeded > MAX_UNITS_PER_ORDER;

    return {
      totalVolume,
      unitsNeeded,
      exceedsMaxUnits,
      totalItemCount,
    };
  }, [state.selectedItems, state.customItems]);

  // Actions
  const incrementItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: {
        ...prev.selectedItems,
        [itemId]: (prev.selectedItems[itemId] || 0) + 1,
      },
    }));
  }, []);

  const decrementItem = useCallback((itemId: string) => {
    setState(prev => {
      const currentQty = prev.selectedItems[itemId] || 0;
      if (currentQty <= 0) return prev;

      const newQty = currentQty - 1;
      const newSelectedItems = { ...prev.selectedItems };

      if (newQty === 0) {
        delete newSelectedItems[itemId];
      } else {
        newSelectedItems[itemId] = newQty;
      }

      return {
        ...prev,
        selectedItems: newSelectedItems,
      };
    });
  }, []);

  const setItemQuantity = useCallback((itemId: string, quantity: number) => {
    setState(prev => {
      const newSelectedItems = { ...prev.selectedItems };

      if (quantity <= 0) {
        delete newSelectedItems[itemId];
      } else {
        newSelectedItems[itemId] = quantity;
      }

      return {
        ...prev,
        selectedItems: newSelectedItems,
      };
    });
  }, []);

  const addCustomItem = useCallback(
    (item: Omit<CustomItem, 'id' | 'isCustom'>) => {
      const newCustomItem: CustomItem = {
        ...item,
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isCustom: true,
      };

      setState(prev => ({
        ...prev,
        customItems: [...prev.customItems, newCustomItem],
      }));
    },
    []
  );

  const removeCustomItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      customItems: prev.customItems.filter(item => item.id !== itemId),
    }));
  }, []);

  const incrementCustomItem = useCallback((_itemId: string) => {
    // Custom items don't have quantities - they're individual entries
    // This is a no-op but kept for API consistency
  }, []);

  const decrementCustomItem = useCallback(
    (itemId: string) => {
      // For custom items, decrement means remove
      removeCustomItem(itemId);
    },
    [removeCustomItem]
  );

  const setCategoryFilter = useCallback((category: string) => {
    setState(prev => ({
      ...prev,
      categoryFilter: category,
    }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  const calculate = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'results',
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const editSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'selection',
    }));
  }, []);

  return {
    // State
    selectedItems: state.selectedItems,
    customItems: state.customItems,
    currentView: state.currentView,
    categoryFilter: state.categoryFilter,
    viewMode: state.viewMode,

    // Computed values
    filteredItems,
    displayItems,
    calculationResult,
    totalSelectedCount,

    // Actions
    incrementItem,
    decrementItem,
    setItemQuantity,
    addCustomItem,
    removeCustomItem,
    incrementCustomItem,
    decrementCustomItem,
    setCategoryFilter,
    setViewMode,
    calculate,
    reset,
    editSelection,
  };
}
