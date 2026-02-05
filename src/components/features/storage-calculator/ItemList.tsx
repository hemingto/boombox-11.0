/**
 * @fileoverview Item list component for storage calculator
 * Displays a scrollable list of items with the custom item entry at top
 */

'use client';

import { StorageItem, CustomItem } from '@/data/storageCalculatorItems';
import { ItemRow, formatDimensions } from './ItemRow';

interface ItemListProps {
  /** List of storage items to display */
  items: StorageItem[];
  /** Map of item ID to quantity */
  selectedItems: Record<string, number>;
  /** List of custom items */
  customItems: CustomItem[];
  /** Whether to show the custom item entry row */
  showCustomEntry?: boolean;
  /** Callback when item quantity is incremented */
  onIncrement: (itemId: string) => void;
  /** Callback when item quantity is decremented */
  onDecrement: (itemId: string) => void;
  /** Callback when custom item add button is clicked */
  onAddCustom: () => void;
  /** Callback when custom item is removed */
  onRemoveCustom: (itemId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Scrollable list of items with quantity controls
 */
export function ItemList({
  items,
  selectedItems,
  customItems,
  showCustomEntry = true,
  onIncrement,
  onDecrement,
  onAddCustom,
  onRemoveCustom,
  className,
}: ItemListProps) {
  return (
    <div className={className}>
      {/* Custom item entry row - always at top when visible */}
      {showCustomEntry && (
        <ItemRow
          name="Custom Item"
          dimensionsText="add custom dimensions"
          iconPath="/boombox-icons/custom-item.png"
          quantity={0}
          onIncrement={() => {}}
          onDecrement={() => {}}
          isCustomEntry
          onAddCustom={onAddCustom}
        />
      )}

      {/* Custom items that have been added */}
      {customItems.map(item => (
        <ItemRow
          key={item.id}
          name={item.name}
          dimensionsText={formatDimensions(item.dimensions)}
          iconPath="/boombox-icons/custom-item.png"
          quantity={1}
          onIncrement={() => {}}
          onDecrement={() => onRemoveCustom(item.id)}
        />
      ))}

      {/* Standard items */}
      {items.map(item => (
        <ItemRow
          key={item.id}
          name={item.name}
          dimensionsText={formatDimensions(item.dimensions)}
          iconPath={item.iconPath}
          quantity={selectedItems[item.id] || 0}
          onIncrement={() => onIncrement(item.id)}
          onDecrement={() => onDecrement(item.id)}
        />
      ))}

      {/* Empty state when no items to display */}
      {items.length === 0 && customItems.length === 0 && !showCustomEntry && (
        <div className="py-8 text-center text-text-tertiary">
          No items selected yet. Add items to calculate your storage needs.
        </div>
      )}
    </div>
  );
}

export default ItemList;
