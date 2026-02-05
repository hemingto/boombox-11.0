/**
 * @fileoverview Storage calculator widget
 * Main interactive component for calculating storage needs
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useStorageCalculator } from '@/hooks/useStorageCalculator';
import { Button } from '@/components/ui/primitives/Button';
import { Modal } from '@/components/ui/primitives/Modal';
import {
  RulerIcon,
  StorageUnitIcon,
  OpenStorageUnitIcon,
} from '@/components/icons';
import { CalculatorHeader } from './CalculatorHeader';
import { ItemList } from './ItemList';
import { CustomItemModal } from './CustomItemModal';
import { CalculatorResults } from './CalculatorResults';
import { MaxUnitsExceeded } from './MaxUnitsExceeded';
import { cn } from '@/lib/utils';

/** Spinner component for loading state */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Modal content component displaying interior and exterior dimensions
 */
function DimensionModalContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-text-primary">
        Exact Dimensions
      </h2>
      <p className="text-text-primary mb-6">
        All measurements are as accurate as possible, but should be viewed as
        close approximations. If you are unsure if one of your items will fit
        please reach out at our Help Center
      </p>

      <div className="flex flex-col sm:flex-row gap-8 mt-10">
        {/* Interior Dimensions */}
        <div className="flex-1 border-r border-border pr-6">
          <OpenStorageUnitIcon
            className="w-28 h-24 mb-4 mx-auto"
            aria-hidden="true"
          />
          <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
            Interior Dimensions
          </h3>
          <ul className="text-sm space-y-2 text-text-primary" role="list">
            <li>
              <span className="font-semibold text-text-primary">Length:</span>{' '}
              95 ins. or 7ft. 11 in. (241cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Width:</span> 56
              ins. or 4ft. 8 in. (142cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Height:</span>{' '}
              83.5 ins. or 6ft. 11.5 in. (212cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Diagonal:</span>{' '}
              110 ins. or 9ft. 2 in. (280cm)
            </li>
          </ul>
        </div>

        {/* Exterior Dimensions */}
        <div className="flex-1 pl-6">
          <StorageUnitIcon
            className="w-24 h-24 mb-4 mx-auto"
            aria-hidden="true"
          />
          <h3 className="mb-4 text-lg font-semibold text-center text-text-primary">
            Exterior Dimensions
          </h3>
          <ul className="text-sm space-y-2 text-text-primary" role="list">
            <li>
              <span className="font-semibold text-text-primary">Length:</span>{' '}
              96 ins. or 8ft. (244cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Width:</span> 60
              ins. or 5ft. (152cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Height:</span>{' '}
              83.5 ins. or 6ft. 11.5 in. (212cm)
            </li>
            <li>
              <span className="font-semibold text-text-primary">Diagonal:</span>{' '}
              90 ins. or 7ft. 6 in. (228cm)
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          variant="primary"
          onClick={onClose}
          aria-label="Close dimensions modal"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

interface StorageCalculatorWidgetProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Interactive storage calculator widget
 * Allows users to select items and calculate required Boombox units
 */
export function StorageCalculatorWidget({
  className,
}: StorageCalculatorWidgetProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isDimensionsModalOpen, setIsDimensionsModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    selectedItems,
    customItems,
    currentView,
    categoryFilter,
    viewMode,
    displayItems,
    calculationResult,
    totalSelectedCount,
    incrementItem,
    decrementItem,
    addCustomItem,
    removeCustomItem,
    setCategoryFilter,
    setViewMode,
    calculate,
    reset,
    editSelection,
  } = useStorageCalculator();

  const handleAddCustomItem = (item: {
    name: string;
    dimensions: { length: number; width: number; height: number };
  }) => {
    addCustomItem(item);
  };

  // Handle calculate with transition effect
  const handleCalculate = useCallback(() => {
    setIsCalculating(true);
    // Wait 1.5s then perform calculation
    setTimeout(() => {
      calculate();
      setIsCalculating(false);
    }, 1500);
  }, [calculate]);

  // Show packed image only when viewing results (transition happens after calculation completes)
  const showPackedImage = currentView === 'results';

  return (
    <div className={cn('md:flex', className)}>
      {/* Left side: Calculator card */}
      <div className="place-content-center basis-1/2 mb-10 md:mb-0 md:pl-0">
        <div className="max-w-lg mx-auto">
          <div className="bg-surface-primary rounded-md shadow-custom-shadow p-6 h-[480px] flex flex-col">
            {currentView === 'selection' ? (
              // Selection view
              <>
                <CalculatorHeader
                  totalItemCount={totalSelectedCount}
                  totalVolume={calculationResult.totalVolume}
                  categoryFilter={categoryFilter}
                  viewMode={viewMode}
                  onCategoryChange={setCategoryFilter}
                  onViewModeChange={setViewMode}
                />

                {/* Scrollable item list - flex-1 to fill available space */}
                <div className="flex-1 overflow-y-auto mt-2 -mx-2 px-2 border-border border-b border-t">
                  <ItemList
                    items={displayItems}
                    selectedItems={selectedItems}
                    customItems={customItems}
                    showCustomEntry={viewMode === 'all'}
                    onIncrement={incrementItem}
                    onDecrement={decrementItem}
                    onAddCustom={() => setIsCustomModalOpen(true)}
                    onRemoveCustom={removeCustomItem}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-4 pt-4 flex-shrink-0">
                  <Button
                    variant="secondary"
                    onClick={reset}
                    disabled={totalSelectedCount === 0 || isCalculating}
                    className="w-1/3"
                  >
                    Reset List
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCalculate}
                    disabled={totalSelectedCount === 0 || isCalculating}
                    className="w-2/3"
                  >
                    {isCalculating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Spinner className="w-4 h-4" />
                        Calculating...
                      </span>
                    ) : (
                      'Calculate'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              // Results view - flex-1 to fill available space
              <>
                {calculationResult.exceedsMaxUnits ? (
                  <MaxUnitsExceeded
                    unitsNeeded={calculationResult.unitsNeeded}
                    onEdit={editSelection}
                    className="flex-1"
                  />
                ) : (
                  <CalculatorResults
                    unitsNeeded={calculationResult.unitsNeeded}
                    totalVolume={calculationResult.totalVolume}
                    onEdit={editSelection}
                    className="flex-1"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Boombox container image with scale + fade transition */}
      <div className="relative flex place-content-center basis-1/2">
        <div className="relative w-full max-w-xl aspect-square">
          {/* Open Boombox image */}
          <Image
            src="/boombox-icons/open-boombox.png"
            alt="Open Boombox storage container"
            fill
            className={cn(
              'object-contain transition-all duration-500 ease-in-out',
              showPackedImage ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            )}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Packed Boombox image */}
          <Image
            src="/boombox-icons/packed-boombox.png"
            alt="Packed Boombox storage container"
            fill
            className={cn(
              'object-contain transition-all duration-500 ease-in-out',
              showPackedImage ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            )}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Exact Dimensions button - absolutely positioned */}
        <button
          onClick={() => setIsDimensionsModalOpen(true)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer text-primary hover:text-primary-hover"
          aria-label="View exact dimensions"
        >
          <RulerIcon className="w-6 mr-2" aria-hidden="true" />
          <span className="font-semibold underline">Exact Dimensions</span>
        </button>
      </div>

      {/* Custom item modal */}
      <CustomItemModal
        open={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAdd={handleAddCustomItem}
      />

      {/* Dimensions Modal */}
      <Modal
        open={isDimensionsModalOpen}
        onClose={() => setIsDimensionsModalOpen(false)}
        size="lg"
        closeOnOverlayClick
      >
        <DimensionModalContent
          onClose={() => setIsDimensionsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default StorageCalculatorWidget;
