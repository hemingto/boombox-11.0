/**
 * @fileoverview Storage unit selection component with checkbox list interface
 * @source boombox-10.0/src/app/components/access-storage/storageunitcheckboxlist.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * A specialized form component for selecting multiple storage units with visual cards,
 * "Select All" functionality, image handling, and comprehensive error states. Displays
 * storage unit information including images, titles, descriptions, and last access dates.
 * Supports disabled states for specific scenarios like "End storage term" selection.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/storageUnitsByUser → New: /api/customers/storage-units-by-customer
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with design system tokens (primary, surface, status, text, border)
 * - Used semantic color system for error states, selection states, and hover effects
 * - Applied design system spacing, border radius, and shadow utilities
 * - Integrated proper focus management and accessibility patterns
 * - Used OptimizedImage component for better performance and SEO
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, keyboard navigation support,
 * role attributes, and semantic HTML structure. Extracted business logic into custom hooks,
 * improved error handling, and integrated with design system primitives. Replaced img tags
 * with OptimizedImage component for better performance.
 */

import React, { useEffect, useState } from 'react';
import { LockOpenIcon } from '@heroicons/react/24/outline';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage';
import { cn } from '@/lib/utils/cn';
import { FormattedStorageUnit } from '@/types/storage.types';

export interface StorageUnitCheckboxListProps {
  /**
   * Array of storage units to display
   */
  storageUnits: FormattedStorageUnit[];
  
  /**
   * Callback when selection changes
   */
  onSelectionChange: (selectedIds: string[]) => void;
  
  /**
   * Currently selected storage unit IDs
   */
  selectedIds: string[];
  
  /**
   * Whether the component is in an error state
   */
  hasError?: boolean;
  
  /**
   * Custom error message to display
   */
  errorMessage?: string;
  
  /**
   * Whether the selection is disabled (e.g., for "End storage term")
   */
  disabled?: boolean;
  
  /**
   * Callback to clear error state
   */
  onClearError?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Test ID for testing purposes
   */
  testId?: string;
  
  /**
   * ARIA label for the entire component
   */
  ariaLabel?: string;
}

/**
 * Custom hook for managing storage unit selection state
 */
const useStorageUnitSelection = (
  storageUnits: FormattedStorageUnit[],
  selectedIds: string[],
  onSelectionChange: (selectedIds: string[]) => void,
  onClearError?: () => void,
  disabled = false
) => {
  const [selectAll, setSelectAll] = useState(false);

  // Update "Select All" state when selection changes
  useEffect(() => {
    const allSelected = storageUnits.length > 0 && selectedIds.length === storageUnits.length;
    setSelectAll(allSelected);
  }, [selectedIds, storageUnits]);

  const handleSelectAll = () => {
    if (disabled) return;

    const allIds = selectAll ? [] : storageUnits.map(unit => unit.id);
    onSelectionChange(allIds);
    
    if (onClearError && allIds.length > 0) {
      onClearError();
    }
  };

  const handleUnitSelection = (unitId: string) => {
    if (disabled) return;

    const updatedSelectedIds = selectedIds.includes(unitId)
      ? selectedIds.filter(id => id !== unitId)
      : [...selectedIds, unitId];
      
    onSelectionChange(updatedSelectedIds);

    if (onClearError && updatedSelectedIds.length > 0) {
      onClearError();
    }
  };

  return {
    selectAll,
    handleSelectAll,
    handleUnitSelection,
  };
};

/**
 * Custom hook for managing image error states
 */
const useImageErrorHandling = () => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleImageError = (unitId: string) => {
    setBrokenImages(prev => ({ ...prev, [unitId]: true }));
  };

  const isImageBroken = (unitId: string) => brokenImages[unitId] || false;

  return {
    handleImageError,
    isImageBroken,
  };
};

export const StorageUnitCheckboxList: React.FC<StorageUnitCheckboxListProps> = ({
  storageUnits,
  onSelectionChange,
  selectedIds,
  hasError = false,
  errorMessage = "Please select at least one storage unit",
  disabled = false,
  onClearError,
  className,
  testId,
  ariaLabel = "Storage unit selection",
}) => {
  const { selectAll, handleSelectAll, handleUnitSelection } = useStorageUnitSelection(
    storageUnits,
    selectedIds,
    onSelectionChange,
    onClearError,
    disabled
  );

  const { handleImageError, isImageBroken } = useImageErrorHandling();

  // Handle keyboard navigation for select all
  const handleSelectAllKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleSelectAll();
    }
  };

  // Handle keyboard navigation for individual units
  const handleUnitKeyDown = (event: React.KeyboardEvent, unitId: string) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleUnitSelection(unitId);
    }
  };

  if (storageUnits.length === 0) {
    return (
      <div 
        className={cn(
          "border-2 border-surface-tertiary bg-surface-secondary rounded-md p-8",
          "flex flex-col items-center justify-center space-y-4",
          className
        )}
        data-testid={testId}
        role="status"
        aria-label="No storage units available"
      >
        <LockOpenIcon className="w-6 h-6 text-text-tertiary" />
        <p className="text-text-tertiary text-sm text-center">
          You currently have no storage units with us
        </p>
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-3", className)}
      data-testid={testId}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Select All Checkbox */}
      <button
        type="button"
        className={cn(
          "flex items-center mb-4 transition-opacity duration-200 bg-transparent border-none p-0",
          disabled && "opacity-70 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
        onClick={handleSelectAll}
        onKeyDown={handleSelectAllKeyDown}
        role="checkbox"
        aria-checked={selectAll}
        aria-label={`Select all storage units (${storageUnits.length} units)`}
        tabIndex={disabled ? -1 : 0}
        disabled={disabled}
      >
        {/* Custom checkbox indicator */}
        <div
          className={cn(
            "w-4 h-4 mr-2 border rounded-sm flex items-center justify-center transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            {
              "bg-primary border-primary": selectAll,
              "border-border": !selectAll,
            }
          )}
        >
          {selectAll && (
            <svg
              className="w-4 h-4 text-text-inverse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        
        <span 
          className={cn(
            "text-xs text-text-primary transition-colors duration-200",
            {
              "cursor-not-allowed": disabled,
              "cursor-pointer": !disabled,
            }
          )}
        >
          Select All
        </span>
      </button>

      {/* Storage Unit Checkboxes */}
      {storageUnits.map((unit) => {
        const isSelected = selectedIds.includes(unit.id);
        const unitAriaLabel = `${unit.title}: ${unit.description}. Last accessed ${unit.lastAccessedDate}. ${isSelected ? 'Selected' : 'Not selected'}.`;

        return (
          <button
            key={unit.id}
            type="button"
            className={cn(
              "flex items-start rounded-md ring-2 mb-2 p-4 transition-all duration-200 bg-transparent border-none text-left w-full",
              "focus-within:ring-primary focus-within:ring-offset-2",
              // Error state (highest priority)
              hasError && "ring-status-error bg-status-bg-error",
              // Selected state (when no error)
              isSelected && !hasError && "bg-surface-primary ring-primary",
              // Default state
              !isSelected && !hasError && "ring-border bg-surface-tertiary hover:bg-surface-secondary hover:ring-primary",
              // Disabled state
              disabled && "opacity-70 cursor-not-allowed",
              !disabled && "cursor-pointer"
            )}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={unitAriaLabel}
            aria-describedby={`unit-${unit.id}-description`}
            tabIndex={disabled ? -1 : 0}
            onClick={() => handleUnitSelection(unit.id)}
            onKeyDown={(e) => handleUnitKeyDown(e, unit.id)}
            disabled={disabled}
          >
            
            <div className="flex flex-row w-full">
              {/* Image Section */}
              <div className="relative w-28 h-28 bg-surface-secondary flex flex-none justify-center items-center rounded-md mr-3">
                {unit.imageSrc && !isImageBroken(unit.id) ? (
                  <OptimizedImage
                    src={unit.imageSrc}
                    alt={`Storage unit ${unit.title}`}
                    fill
                    className="rounded-md object-cover"
                    onError={() => handleImageError(unit.id)}
                    sizes="(max-width: 768px) 112px, 112px"
                  />
                ) : (
                  <span className="text-sm text-text-tertiary text-center px-2">
                    Image not available
                  </span>
                )}
              </div>
              
              {/* Content Section */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <h3 
                    className={cn(
                      "text-base font-medium",
                      {
                        "text-status-error": hasError,
                        "text-text-primary": !hasError,
                      }
                    )}
                  >
                    {unit.title}
                  </h3>
                  <p 
                    id={`unit-${unit.id}-description`}
                    className={cn(
                      "text-sm mt-1",
                      {
                        "text-status-error": hasError,
                        "text-text-secondary": !hasError,
                      }
                    )}
                  >
                    {unit.description}
                  </p>
                </div>
                
                <div>
                  <p 
                    className={cn(
                      "text-xs",
                      {
                        "text-status-error": hasError,
                        "text-text-tertiary": !hasError,
                      }
                    )}
                  >
                    Last accessed {unit.lastAccessedDate}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* Error Message */}
      {hasError && (
        <div 
          className="text-status-error text-sm mt-2"
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedIds.length} of {storageUnits.length} storage units selected
        {hasError && `. Error: ${errorMessage}`}
        {disabled && ". Selection is disabled"}
      </div>
    </div>
  );
};

export default StorageUnitCheckboxList;
