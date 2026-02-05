/**
 * @fileoverview Item row component for storage calculator
 * Displays a single item with icon, name, dimensions, and quantity controls
 */

'use client';

import Image from 'next/image';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/primitives/Button';
import { cn } from '@/lib/utils';

interface ItemRowProps {
  /** Item name */
  name: string;
  /** Item dimensions string (e.g., "31″ × 29″ × 32″") */
  dimensionsText: string;
  /** Path to item icon */
  iconPath: string;
  /** Current quantity */
  quantity: number;
  /** Callback when increment button is clicked */
  onIncrement: () => void;
  /** Callback when decrement button is clicked */
  onDecrement: () => void;
  /** Whether this is a custom item (shows only + button initially) */
  isCustomEntry?: boolean;
  /** Callback for custom item add button */
  onAddCustom?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats dimensions object to display string
 */
export function formatDimensions(dimensions: {
  length: number;
  width: number;
  height: number;
}): string {
  return `${dimensions.height}″ × ${dimensions.width}″ × ${dimensions.length}″`;
}

/**
 * Item row component displaying an item with quantity controls
 */
export function ItemRow({
  name,
  dimensionsText,
  iconPath,
  quantity,
  onIncrement,
  onDecrement,
  isCustomEntry = false,
  onAddCustom,
  className,
}: ItemRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 border-b border-border last:border-b-0',
        className
      )}
    >
      {/* Left side: Icon and info */}
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={iconPath}
            alt={name}
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-text-primary text-sm">
            {name}
          </span>
          <span className="text-text-tertiary text-xs">{dimensionsText}</span>
        </div>
      </div>

      {/* Right side: Quantity controls */}
      <div
        className="flex items-center space-x-1"
        role="group"
        aria-label={`Quantity controls for ${name}`}
      >
        {isCustomEntry ? (
          // Custom item entry - just show + button
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddCustom}
            aria-label={`Add ${name}`}
            className="p-1 rounded-full hover:bg-transparent active:bg-transparent text-text-primary"
          >
            <PlusCircleIcon className="w-6 h-6" />
          </Button>
        ) : (
          // Regular item - show -/count/+ controls
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecrement}
              disabled={quantity === 0}
              aria-label={`Decrease ${name} quantity`}
              className={cn(
                'p-1 rounded-full hover:bg-transparent active:bg-transparent',
                quantity === 0
                  ? 'text-text-secondary cursor-not-allowed'
                  : 'text-text-primary'
              )}
            >
              <MinusCircleIcon className="w-6 h-6" />
            </Button>

            <span
              className="font-semibold text-md min-w-[2rem] text-center"
              aria-label={`Current quantity: ${quantity}`}
              role="status"
            >
              {quantity}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={onIncrement}
              aria-label={`Increase ${name} quantity`}
              className="p-1 rounded-full hover:bg-transparent active:bg-transparent text-text-primary"
            >
              <PlusCircleIcon className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default ItemRow;
