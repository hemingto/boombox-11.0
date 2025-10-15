/**
 * @fileoverview Custom hook for managing checklist state and interactions
 * @source boombox-10.0/src/app/components/checklist/checklistsection.tsx (state management logic)
 * 
 * HOOK FUNCTIONALITY:
 * Manages checklist items state, toggle functionality, and keyboard interactions.
 * Provides reusable checklist logic that can be used across different components.
 * 
 * @refactor Extracted state management and business logic from ChecklistSection component
 */

import { useState, useCallback } from 'react';

export interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  isChecked: boolean;
}

export interface UseChecklistOptions {
  initialItems?: ChecklistItem[];
  onItemToggle?: (item: ChecklistItem) => void;
  onAllCompleted?: () => void;
}

export interface UseChecklistReturn {
  items: ChecklistItem[];
  toggleItem: (id: number) => void;
  handleKeyDown: (event: React.KeyboardEvent, id: number) => void;
  completedCount: number;
  totalCount: number;
  isAllCompleted: boolean;
  resetChecklist: () => void;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 1,
    title: 'Pack your items in proper packing materials',
    description: 'Make sure your items are packed in proper packing supplies. This will ensure your items are stored safely and securely. If you need packing supplies check out our packing supplies store. We can deliver your packing supplies right to your door before your pickup appointment.',
    isChecked: false,
  },
  {
    id: 2,
    title: 'Disassemble all larger furniture items such as bed frames and dining tables',
    description: 'We recommend you disassemble large furniture items to maximize your storage space as well as minimize the possibility of your items being damaged in transit.',
    isChecked: false,
  },
  {
    id: 3,
    title: 'Measure all larger items to make sure they will fit into your Boombox',
    description: 'Unsure if your larger items will fit? Check out our storage calculator to find out exactly what items will fit and the exact dimensions of your Boombox container.',
    isChecked: false,
  },
  {
    id: 4,
    title: 'Take photos of the items you plan on storing',
    description: 'To ensure you remember whats in your Boombox, we recommend taking photos of the items you plan on storing. You can upload photos on your account page once your pickup is complete.',
    isChecked: false,
  },
  {
    id: 5,
    title: 'Provide us with additional information about your move',
    description: 'To make sure your move goes smoothly make sure you provide additional information about your move. You can do so on the form we send over text or on your account page.',
    isChecked: false,
  },
  {
    id: 6,
    title: 'Make sure you have read our terms of service and reviewed our storage guidelines',
    description: 'You can find our storage guidelines here and you can find our terms page here.',
    isChecked: false,
  },
];

/**
 * Custom hook for managing checklist state and interactions
 * 
 * @param options - Configuration options for the checklist
 * @returns Checklist state and interaction handlers
 * 
 * @example
 * ```tsx
 * const {
 *   items,
 *   toggleItem,
 *   handleKeyDown,
 *   completedCount,
 *   isAllCompleted
 * } = useChecklist({
 *   onItemToggle: (item) => console.log('Item toggled:', item),
 *   onAllCompleted: () => console.log('All items completed!')
 * });
 * ```
 */
export function useChecklist(options: UseChecklistOptions = {}): UseChecklistReturn {
  const {
    initialItems = DEFAULT_CHECKLIST_ITEMS,
    onItemToggle,
    onAllCompleted
  } = options;

  const [items, setItems] = useState<ChecklistItem[]>(initialItems);

  const toggleItem = useCallback((id: number) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      );

      // Find the toggled item for callback
      const toggledItem = updatedItems.find(item => item.id === id);
      if (toggledItem && onItemToggle) {
        onItemToggle(toggledItem);
      }

      // Check if all items are completed
      const allCompleted = updatedItems.every(item => item.isChecked);
      if (allCompleted && onAllCompleted) {
        onAllCompleted();
      }

      return updatedItems;
    });
  }, [onItemToggle, onAllCompleted]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, id: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleItem(id);
    }
  }, [toggleItem]);

  const resetChecklist = useCallback(() => {
    setItems(initialItems.map(item => ({ ...item, isChecked: false })));
  }, [initialItems]);

  // Computed values
  const completedCount = items.filter(item => item.isChecked).length;
  const totalCount = items.length;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  return {
    items,
    toggleItem,
    handleKeyDown,
    completedCount,
    totalCount,
    isAllCompleted,
    resetChecklist,
  };
}
