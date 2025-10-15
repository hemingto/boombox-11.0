/**
 * @fileoverview Tests for useChecklist hook
 * Following boombox-11.0 testing standards
 */
import { renderHook, act } from '@testing-library/react';
import { useChecklist, type ChecklistItem } from '@/hooks/useChecklist';

describe('useChecklist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default items when no options provided', () => {
      const { result } = renderHook(() => useChecklist());
      
      expect(result.current.items).toHaveLength(6);
      expect(result.current.totalCount).toBe(6);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.isAllCompleted).toBe(false);
      
      // Check that all items are unchecked initially
      result.current.items.forEach(item => {
        expect(item.isChecked).toBe(false);
      });
    });

    it('initializes with custom items when provided', () => {
      const customItems: ChecklistItem[] = [
        { id: 1, title: 'Custom Item 1', description: 'Description 1', isChecked: false },
        { id: 2, title: 'Custom Item 2', description: 'Description 2', isChecked: true },
      ];

      const { result } = renderHook(() => useChecklist({ initialItems: customItems }));
      
      expect(result.current.items).toHaveLength(2);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.completedCount).toBe(1);
      expect(result.current.isAllCompleted).toBe(false);
      expect(result.current.items[0].title).toBe('Custom Item 1');
      expect(result.current.items[1].isChecked).toBe(true);
    });

    it('calculates completion status correctly', () => {
      const allCheckedItems: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: true },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: true },
      ];

      const { result } = renderHook(() => useChecklist({ initialItems: allCheckedItems }));
      
      expect(result.current.completedCount).toBe(2);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.isAllCompleted).toBe(true);
    });
  });

  describe('Item Toggling', () => {
    it('toggles item state correctly', () => {
      const { result } = renderHook(() => useChecklist());
      
      const initialItem = result.current.items[0];
      expect(initialItem.isChecked).toBe(false);
      
      act(() => {
        result.current.toggleItem(1);
      });
      
      const updatedItem = result.current.items[0];
      expect(updatedItem.isChecked).toBe(true);
      expect(result.current.completedCount).toBe(1);
    });

    it('toggles item back to unchecked', () => {
      const { result } = renderHook(() => useChecklist());
      
      // Check item
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(result.current.items[0].isChecked).toBe(true);
      
      // Uncheck item
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(result.current.items[0].isChecked).toBe(false);
      expect(result.current.completedCount).toBe(0);
    });

    it('only toggles the specified item', () => {
      const { result } = renderHook(() => useChecklist());
      
      act(() => {
        result.current.toggleItem(2);
      });
      
      expect(result.current.items[0].isChecked).toBe(false); // Item 1
      expect(result.current.items[1].isChecked).toBe(true);  // Item 2
      expect(result.current.items[2].isChecked).toBe(false); // Item 3
    });

    it('handles invalid item IDs gracefully', () => {
      const { result } = renderHook(() => useChecklist());
      
      const initialState = result.current.items.map(item => ({ ...item }));
      
      act(() => {
        result.current.toggleItem(999); // Non-existent ID
      });
      
      // State should remain unchanged
      expect(result.current.items).toEqual(initialState);
    });
  });

  describe('Callback Functions', () => {
    it('calls onItemToggle callback when item is toggled', () => {
      const mockOnItemToggle = jest.fn();
      const { result } = renderHook(() => useChecklist({ onItemToggle: mockOnItemToggle }));
      
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(mockOnItemToggle).toHaveBeenCalledTimes(1);
      expect(mockOnItemToggle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          isChecked: true,
          title: expect.any(String),
          description: expect.any(String)
        })
      );
    });

    it('calls onAllCompleted callback when all items are checked', () => {
      const mockOnAllCompleted = jest.fn();
      const customItems: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: true },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: false },
      ];

      const { result } = renderHook(() => 
        useChecklist({ 
          initialItems: customItems, 
          onAllCompleted: mockOnAllCompleted 
        })
      );
      
      expect(mockOnAllCompleted).not.toHaveBeenCalled();
      
      // Check the last unchecked item
      act(() => {
        result.current.toggleItem(2);
      });
      
      expect(mockOnAllCompleted).toHaveBeenCalledTimes(1);
    });

    it('does not call onAllCompleted when unchecking items', () => {
      const mockOnAllCompleted = jest.fn();
      const allCheckedItems: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: true },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: true },
      ];

      const { result } = renderHook(() => 
        useChecklist({ 
          initialItems: allCheckedItems, 
          onAllCompleted: mockOnAllCompleted 
        })
      );
      
      // Uncheck an item
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(mockOnAllCompleted).not.toHaveBeenCalled();
    });

    it('handles missing callbacks gracefully', () => {
      const { result } = renderHook(() => useChecklist());
      
      expect(() => {
        act(() => {
          result.current.toggleItem(1);
        });
      }).not.toThrow();
    });
  });

  describe('Keyboard Handling', () => {
    it('handles Enter key correctly', () => {
      const { result } = renderHook(() => useChecklist());
      
      const mockEvent = {
        key: 'Enter',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      
      act(() => {
        result.current.handleKeyDown(mockEvent, 1);
      });
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.items[0].isChecked).toBe(true);
    });

    it('handles Space key correctly', () => {
      const { result } = renderHook(() => useChecklist());
      
      const mockEvent = {
        key: ' ',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      
      act(() => {
        result.current.handleKeyDown(mockEvent, 1);
      });
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.current.items[0].isChecked).toBe(true);
    });

    it('ignores other keys', () => {
      const { result } = renderHook(() => useChecklist());
      
      const mockEvent = {
        key: 'Tab',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;
      
      act(() => {
        result.current.handleKeyDown(mockEvent, 1);
      });
      
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(result.current.items[0].isChecked).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('resets all items to unchecked state', () => {
      const { result } = renderHook(() => useChecklist());
      
      // Check some items
      act(() => {
        result.current.toggleItem(1);
        result.current.toggleItem(2);
        result.current.toggleItem(3);
      });
      
      expect(result.current.completedCount).toBe(3);
      
      // Reset checklist
      act(() => {
        result.current.resetChecklist();
      });
      
      expect(result.current.completedCount).toBe(0);
      expect(result.current.isAllCompleted).toBe(false);
      result.current.items.forEach(item => {
        expect(item.isChecked).toBe(false);
      });
    });

    it('resets to initial state for custom items', () => {
      const customItems: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: true },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: false },
      ];

      const { result } = renderHook(() => useChecklist({ initialItems: customItems }));
      
      // Modify state
      act(() => {
        result.current.toggleItem(1); // Should uncheck item 1
        result.current.toggleItem(2); // Should check item 2
      });
      
      expect(result.current.items[0].isChecked).toBe(false);
      expect(result.current.items[1].isChecked).toBe(true);
      
      // Reset
      act(() => {
        result.current.resetChecklist();
      });
      
      // Should return to initial state (all unchecked due to reset logic)
      expect(result.current.items[0].isChecked).toBe(false);
      expect(result.current.items[1].isChecked).toBe(false);
    });
  });

  describe('Computed Values', () => {
    it('calculates completedCount correctly', () => {
      const { result } = renderHook(() => useChecklist());
      
      expect(result.current.completedCount).toBe(0);
      
      act(() => {
        result.current.toggleItem(1);
        result.current.toggleItem(3);
      });
      
      expect(result.current.completedCount).toBe(2);
    });

    it('calculates totalCount correctly', () => {
      const customItems: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: false },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: false },
        { id: 3, title: 'Item 3', description: 'Desc 3', isChecked: false },
      ];

      const { result } = renderHook(() => useChecklist({ initialItems: customItems }));
      
      expect(result.current.totalCount).toBe(3);
    });

    it('calculates isAllCompleted correctly', () => {
      const twoItemList: ChecklistItem[] = [
        { id: 1, title: 'Item 1', description: 'Desc 1', isChecked: false },
        { id: 2, title: 'Item 2', description: 'Desc 2', isChecked: false },
      ];

      const { result } = renderHook(() => useChecklist({ initialItems: twoItemList }));
      
      expect(result.current.isAllCompleted).toBe(false);
      
      // Check first item
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(result.current.isAllCompleted).toBe(false);
      
      // Check second item
      act(() => {
        result.current.toggleItem(2);
      });
      
      expect(result.current.isAllCompleted).toBe(true);
    });

    it('handles empty list correctly', () => {
      const { result } = renderHook(() => useChecklist({ initialItems: [] }));
      
      expect(result.current.totalCount).toBe(0);
      expect(result.current.completedCount).toBe(0);
      expect(result.current.isAllCompleted).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('maintains function reference stability', () => {
      const { result, rerender } = renderHook(() => useChecklist());
      
      const initialToggleItem = result.current.toggleItem;
      const initialHandleKeyDown = result.current.handleKeyDown;
      const initialResetChecklist = result.current.resetChecklist;
      
      // Trigger a re-render by toggling an item
      act(() => {
        result.current.toggleItem(1);
      });
      
      rerender();
      
      // Functions should maintain reference equality
      expect(result.current.toggleItem).toBe(initialToggleItem);
      expect(result.current.handleKeyDown).toBe(initialHandleKeyDown);
      expect(result.current.resetChecklist).toBe(initialResetChecklist);
    });

    it('updates callbacks when options change', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      const { result, rerender } = renderHook(
        ({ onItemToggle }) => useChecklist({ onItemToggle }),
        { initialProps: { onItemToggle: mockCallback1 } }
      );
      
      act(() => {
        result.current.toggleItem(1);
      });
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).not.toHaveBeenCalled();
      
      // Change callback
      rerender({ onItemToggle: mockCallback2 });
      
      act(() => {
        result.current.toggleItem(2);
      });
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
  });
});
