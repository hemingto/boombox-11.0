/**
 * @fileoverview Item selector sidebar for storage calculator
 * Allows users to browse categories and add/remove items
 *
 * FEATURES:
 * - Category tabs with icons
 * - Item cards with dimensions and quantity controls
 * - Responsive design for mobile/desktop
 * - Uses Lucide icons for item representation
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CATEGORIES,
  getItemsByCategory,
  calculateCubicFeet,
  type InventoryCategory,
  type InventoryItem,
} from '@/data/inventoryData';
import { useStorageStore } from '@/hooks/useStorageStore';
import { Plus, Minus, X } from 'lucide-react';

// ==================== TYPES ====================

interface ItemSelectorProps {
  className?: string;
}

// ==================== COMPONENT ====================

export function ItemSelector({ className }: ItemSelectorProps) {
  const [activeCategory, setActiveCategory] =
    useState<InventoryCategory>('bedroom');
  const { addItem, removeItem, getItemQuantity, clearAll, getTotalItemCount } =
    useStorageStore();

  const categoryItems = getItemsByCategory(activeCategory);
  const totalItems = getTotalItemCount();

  return (
    <div
      className={cn(
        'flex flex-col bg-surface-primary border border-border rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-tertiary">
        <h3 className="font-semibold text-text-primary">Add Items</h3>
        {totalItems > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-status-error transition-colors"
            aria-label="Clear all items"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
        {CATEGORIES.map(category => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-3 min-w-[80px] transition-colors',
                'hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary',
                isActive
                  ? 'border-b-2 border-primary bg-surface-tertiary text-text-primary'
                  : 'text-text-secondary'
              )}
              aria-selected={isActive}
              role="tab"
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-medium whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item Grid */}
      <div
        className="flex-1 overflow-y-auto p-3 grid gap-2"
        style={{ maxHeight: '400px' }}
        role="tabpanel"
        aria-label={`${activeCategory} items`}
      >
        {categoryItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            quantity={getItemQuantity(item.id)}
            onAdd={() => addItem(item.id)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      {/* Scrollbar hide styles */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

// ==================== ITEM CARD ====================

interface ItemCardProps {
  item: InventoryItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

function ItemCard({ item, quantity, onAdd, onRemove }: ItemCardProps) {
  const Icon = item.icon;
  const cubicFeet = calculateCubicFeet(item).toFixed(1);
  const isSelected = quantity > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        isSelected
          ? 'border-primary bg-zinc-50'
          : 'border-border hover:border-zinc-300 bg-surface-primary'
      )}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: item.color + '20' }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: item.color }}
          aria-hidden="true"
        />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm truncate">
          {item.name}
        </p>
        <p className="text-xs text-text-secondary">
          {item.width}&quot; × {item.depth}&quot; × {item.height}&quot; •{' '}
          {cubicFeet} cu ft
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        {isSelected ? (
          <>
            <button
              onClick={onRemove}
              className="w-8 h-8 rounded-full bg-surface-secondary hover:bg-surface-pressed flex items-center justify-center transition-colors"
              aria-label={`Remove one ${item.name}`}
            >
              <Minus className="w-4 h-4 text-text-primary" />
            </button>
            <span className="w-6 text-center font-semibold text-text-primary">
              {quantity}
            </span>
            <button
              onClick={onAdd}
              className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center transition-colors"
              aria-label={`Add one ${item.name}`}
            >
              <Plus className="w-4 h-4 text-text-inverse" />
            </button>
          </>
        ) : (
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center transition-colors"
            aria-label={`Add ${item.name}`}
          >
            <Plus className="w-4 h-4 text-text-inverse" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ItemSelector;
