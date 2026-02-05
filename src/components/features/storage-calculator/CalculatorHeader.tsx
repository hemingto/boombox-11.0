/**
 * @fileoverview Calculator header component with filter and view toggle
 * Shows item count, category filter dropdown, and view mode toggle
 */

'use client';

import { Button } from '@/components/ui/primitives/Button';
import { FilterDropdown } from '@/components/ui/primitives/FilterDropdown';
import { CATEGORY_OPTIONS } from '@/data/storageCalculatorItems';
import { ViewMode } from '@/hooks/useStorageCalculator';
import { cn } from '@/lib/utils';

interface CalculatorHeaderProps {
  /** Total number of items selected */
  totalItemCount: number;
  /** Total volume of selected items in cubic inches */
  totalVolume: number;
  /** Current category filter value */
  categoryFilter: string;
  /** Current view mode */
  viewMode: ViewMode;
  /** Callback when category filter changes */
  onCategoryChange: (category: string) => void;
  /** Callback when view mode changes */
  onViewModeChange: (mode: ViewMode) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format volume in cubic inches to cubic feet
 */
function formatVolume(cubicInches: number): string {
  const cubicFeet = cubicInches / 1728; // 12^3 = 1728 cubic inches per cubic foot
  return cubicFeet.toFixed(1);
}

/**
 * Header component for storage calculator with filter and view controls
 */
export function CalculatorHeader({
  totalItemCount,
  totalVolume,
  categoryFilter,
  viewMode,
  onCategoryChange,
  onViewModeChange,
  className,
}: CalculatorHeaderProps) {
  // Convert CATEGORY_OPTIONS to FilterDropdown format
  const filterOptions = CATEGORY_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  return (
    <div className={cn('flex items-center justify-between pb-3', className)}>
      {/* Left side: Item count or filter dropdown based on view mode */}
      <div className="flex items-center gap-3">
        {viewMode === 'selected' ? (
          // Show item count and volume when viewing selected items
          <>
            <span className="text-sm font-medium text-text-primary">
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
            </span>

            <div className="flex rounded-full px-3 py-2 bg-cyan-100 w-fit">
              <span className="text-sm font-medium text-cyan-500">
                {formatVolume(totalVolume)} cubic feet
              </span>
            </div>
          </>
        ) : (
          // Show category filter when viewing all items
          <FilterDropdown
            options={filterOptions}
            value={categoryFilter}
            onChange={onCategoryChange}
            placeholder="All items"
            size="md"
            ariaLabel="Filter items by category"
            className="font-medium text-sm"
          />
        )}
      </div>

      {/* Right side: View mode toggle */}
      <div className="flex items-center">
        {viewMode === 'selected' ? (
          // Show "Add more items" button when viewing selected items
          <Button
            variant="secondary"
            size="sm"
            borderRadius="full"
            onClick={e => {
              (e.currentTarget as HTMLButtonElement).blur();
              onViewModeChange('all');
            }}
          >
            Add more items
          </Button>
        ) : (
          // Show "Your Items" button when viewing all items
          <Button
            variant="secondary"
            size="sm"
            borderRadius="full"
            onClick={e => {
              (e.currentTarget as HTMLButtonElement).blur();
              onViewModeChange('selected');
            }}
            disabled={totalItemCount === 0}
          >
            Your items
          </Button>
        )}
      </div>
    </div>
  );
}

export default CalculatorHeader;
