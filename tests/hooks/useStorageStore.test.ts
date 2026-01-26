/**
 * @fileoverview Tests for useStorageStore Zustand store
 */

import { act } from '@testing-library/react';
import { useStorageStore, getContainerCapacity } from '@/hooks/useStorageStore';

// Reset store before each test
beforeEach(() => {
  act(() => {
    useStorageStore.getState().clearAll();
  });
});

describe('useStorageStore', () => {
  describe('initial state', () => {
    it('should have empty selected items', () => {
      const state = useStorageStore.getState();
      expect(state.selectedItems.size).toBe(0);
    });

    it('should have zero volume', () => {
      const state = useStorageStore.getState();
      expect(state.totalVolumeCubicFeet).toBe(0);
    });

    it('should have zero units recommended', () => {
      const state = useStorageStore.getState();
      expect(state.unitsRecommended).toBe(0);
    });

    it('should have no packed items', () => {
      const state = useStorageStore.getState();
      expect(state.packedItems).toHaveLength(0);
    });

    it('should have zero container count', () => {
      const state = useStorageStore.getState();
      expect(state.containerCount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add an item with quantity 1', () => {
      act(() => {
        useStorageStore.getState().addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.get('box-small')).toBe(1);
    });

    it('should increment quantity when adding same item', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.addItem('box-small');
        store.addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.get('box-small')).toBe(3);
    });

    it('should update total volume when adding items', () => {
      act(() => {
        useStorageStore.getState().addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.totalVolumeCubicFeet).toBeGreaterThan(0);
    });

    it('should create packed items when adding', () => {
      act(() => {
        useStorageStore.getState().addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.packedItems.length).toBeGreaterThan(0);
    });

    it('should update container count', () => {
      act(() => {
        useStorageStore.getState().addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.containerCount).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should decrement quantity', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.addItem('box-small');
        store.removeItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.get('box-small')).toBe(1);
    });

    it('should remove item completely when quantity reaches 0', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.removeItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.has('box-small')).toBe(false);
    });

    it('should handle removing non-existent item gracefully', () => {
      act(() => {
        useStorageStore.getState().removeItem('non-existent');
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.size).toBe(0);
    });

    it('should update volume when removing items', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.addItem('box-small');
      });

      const volumeAfterAdd = useStorageStore.getState().totalVolumeCubicFeet;

      act(() => {
        useStorageStore.getState().removeItem('box-small');
      });

      const volumeAfterRemove = useStorageStore.getState().totalVolumeCubicFeet;
      expect(volumeAfterRemove).toBeLessThan(volumeAfterAdd);
    });
  });

  describe('setItemQuantity', () => {
    it('should set specific quantity', () => {
      act(() => {
        useStorageStore.getState().setItemQuantity('box-small', 5);
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.get('box-small')).toBe(5);
    });

    it('should remove item when setting quantity to 0', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.setItemQuantity('box-small', 0);
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.has('box-small')).toBe(false);
    });

    it('should remove item when setting negative quantity', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.setItemQuantity('box-small', -1);
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.has('box-small')).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all selected items', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('box-small');
        store.addItem('box-medium');
        store.addItem('king-bed');
        store.clearAll();
      });

      const state = useStorageStore.getState();
      expect(state.selectedItems.size).toBe(0);
    });

    it('should reset all calculated values', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.addItem('king-bed');
        store.clearAll();
      });

      const state = useStorageStore.getState();
      expect(state.totalVolumeCubicFeet).toBe(0);
      expect(state.unitsRecommended).toBe(0);
      expect(state.packedItems).toHaveLength(0);
      expect(state.containerCount).toBe(0);
      expect(state.lastContainerFillPercent).toBe(0);
    });
  });

  describe('getItemQuantity', () => {
    it('should return quantity for existing item', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.setItemQuantity('box-small', 3);
      });

      const quantity = useStorageStore.getState().getItemQuantity('box-small');
      expect(quantity).toBe(3);
    });

    it('should return 0 for non-existent item', () => {
      const quantity = useStorageStore
        .getState()
        .getItemQuantity('non-existent');
      expect(quantity).toBe(0);
    });
  });

  describe('getTotalItemCount', () => {
    it('should return total count of all items', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.setItemQuantity('box-small', 2);
        store.setItemQuantity('box-medium', 3);
        store.setItemQuantity('box-large', 1);
      });

      const total = useStorageStore.getState().getTotalItemCount();
      expect(total).toBe(6);
    });

    it('should return 0 when no items', () => {
      const total = useStorageStore.getState().getTotalItemCount();
      expect(total).toBe(0);
    });
  });

  describe('setActiveCategory', () => {
    it('should set active category', () => {
      act(() => {
        useStorageStore.getState().setActiveCategory('kitchen');
      });

      const state = useStorageStore.getState();
      expect(state.activeCategory).toBe('kitchen');
    });

    it('should allow null category', () => {
      act(() => {
        const store = useStorageStore.getState();
        store.setActiveCategory('kitchen');
        store.setActiveCategory(null);
      });

      const state = useStorageStore.getState();
      expect(state.activeCategory).toBeNull();
    });
  });

  describe('units recommendation', () => {
    it('should recommend 1 unit for small items', () => {
      act(() => {
        useStorageStore.getState().addItem('box-small');
      });

      const state = useStorageStore.getState();
      expect(state.unitsRecommended).toBe(1);
    });

    it('should recommend multiple units for large volume', () => {
      act(() => {
        const store = useStorageStore.getState();
        // Add many large items to exceed container capacity
        for (let i = 0; i < 10; i++) {
          store.addItem('king-bed');
        }
      });

      const state = useStorageStore.getState();
      expect(state.unitsRecommended).toBeGreaterThan(1);
    });
  });

  describe('getContainerCapacity', () => {
    it('should return correct capacity', () => {
      expect(getContainerCapacity()).toBe(257);
    });
  });
});
