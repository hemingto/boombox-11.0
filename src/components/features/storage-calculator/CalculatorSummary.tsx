/**
 * @fileoverview Summary panel for storage calculator
 * Displays total volume, fill percentage, and unit recommendations
 *
 * FEATURES:
 * - Total cubic footage display
 * - Visual fill indicator
 * - Units recommended with clear messaging
 * - CTA to get a quote
 */

'use client';

import Link from 'next/link';
import { useStorageStore, getContainerCapacity } from '@/hooks/useStorageStore';
import { Button } from '@/components/ui/primitives';
import { Package, ArrowRight, Trash2 } from 'lucide-react';

// ==================== TYPES ====================

interface CalculatorSummaryProps {
  className?: string;
}

// ==================== COMPONENT ====================

export function CalculatorSummary({ className }: CalculatorSummaryProps) {
  const {
    totalVolumeCubicFeet,
    unitsRecommended,
    containerCount,
    lastContainerFillPercent,
    clearAll,
  } = useStorageStore();

  const totalItems = useStorageStore(state => state.getTotalItemCount());
  const containerCapacity = getContainerCapacity();

  const hasItems = totalItems > 0;

  return (
    <div className={`bg-zinc-900 text-white rounded-lg p-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Your Storage Estimate</h3>
        {hasItems && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
            aria-label="Clear all items"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {hasItems ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Total Volume */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Total Volume</p>
              <p className="text-2xl font-bold">
                {totalVolumeCubicFeet.toFixed(0)}
                <span className="text-sm font-normal text-zinc-400 ml-1">
                  cu ft
                </span>
              </p>
            </div>

            {/* Items Count */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-400 mb-1">Total Items</p>
              <p className="text-2xl font-bold">
                {totalItems}
                <span className="text-sm font-normal text-zinc-400 ml-1">
                  items
                </span>
              </p>
            </div>
          </div>

          {/* Units Recommended */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-100">You&apos;ll need</p>
                <p className="text-3xl font-bold">
                  {unitsRecommended}{' '}
                  <span className="text-lg font-normal">
                    Boombox{unitsRecommended !== 1 ? 'es' : ''}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Fill Indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Container Fill</span>
              <span className="font-medium">
                {containerCount > 1
                  ? `${containerCount} containers`
                  : `${lastContainerFillPercent.toFixed(0)}% full`}
              </span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(lastContainerFillPercent, 100)}%`,
                }}
              />
            </div>
            {containerCount > 1 && (
              <p className="text-xs text-zinc-500 mt-2">
                Last container is {lastContainerFillPercent.toFixed(0)}% full
              </p>
            )}
          </div>

          {/* Capacity Info */}
          <p className="text-sm text-zinc-400 mb-6">
            Each Boombox holds up to{' '}
            <span className="text-white font-medium">
              {containerCapacity} cu ft
            </span>{' '}
            (95&quot; × 56&quot; × 83.5&quot; interior)
          </p>

          {/* CTA Button */}
          <Link href="/get-quote" className="block">
            <Button
              variant="white"
              fullWidth
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
            >
              Get Your Quote
            </Button>
          </Link>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-zinc-600" />
          </div>
          <p className="text-zinc-400 mb-2">No items selected</p>
          <p className="text-sm text-zinc-500">
            Add items from the list to see how many Boomboxes you&apos;ll need
          </p>
        </div>
      )}
    </div>
  );
}

export default CalculatorSummary;
