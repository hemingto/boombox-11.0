"use client";

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
 * - Uses Next.js Image for better performance and SEO
 * 
 * @refactor Enhanced accessibility with proper ARIA labels, keyboard navigation support,
 * role attributes, and semantic HTML structure. Extracted business logic into custom hooks,
 * improved error handling, and integrated with design system primitives. Uses Next.js Image
 * for better performance.
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { LockOpenIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';
import { FormattedStorageUnit } from '@/types/storage.types';

/**
 * Formats a date string to a friendly format like "Jan 10th" or "Feb 11th"
 */
const formatPendingAppointmentDate = (dateString: string): string => {
 try {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
   return dateString; // Return original if parsing fails
  }
  
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  
  // Add ordinal suffix (st, nd, rd, th)
  const getOrdinalSuffix = (n: number): string => {
   const s = ['th', 'st', 'nd', 'rd'];
   const v = n % 100;
   return s[(v - 20) % 10] || s[v] || s[0];
  };
  
  return `${month} ${day}${getOrdinalSuffix(day)}`;
 } catch {
  return dateString; // Return original on any error
 }
};

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

 // Get IDs of units that can be selected (no pending appointments)
 const selectableUnits = storageUnits.filter(unit => !unit.pendingAppointment);
 const selectableIds = selectableUnits.map(unit => unit.id);

 // Update "Select All" state when selection changes (only consider selectable units)
 useEffect(() => {
  const allSelectableSelected = selectableUnits.length > 0 && 
   selectableIds.every(id => selectedIds.includes(id));
  setSelectAll(allSelectableSelected);
 }, [selectedIds, selectableUnits, selectableIds]);

 const handleSelectAll = () => {
  if (disabled) return;

  // Only select/deselect units without pending appointments
  const allIds = selectAll ? [] : selectableIds;
  onSelectionChange(allIds);
  
  if (onClearError && allIds.length > 0) {
   onClearError();
  }
 };

 const handleUnitSelection = (unitId: string) => {
  if (disabled) return;

  // Check if unit has a pending appointment
  const unit = storageUnits.find(u => u.id === unitId);
  if (unit?.pendingAppointment) return;

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
  selectableUnits,
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
 const { selectAll, handleSelectAll, handleUnitSelection, selectableUnits } = useStorageUnitSelection(
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
     "border-2 border-surface-tertiary bg-surface-tertiary rounded-md p-8",
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
     "flex items-center mb-4 bg-transparent border-none p-0",
     "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded",
     disabled && "opacity-70 cursor-not-allowed",
     !disabled && "cursor-pointer"
    )}
    onClick={handleSelectAll}
    onKeyDown={handleSelectAllKeyDown}
    role="checkbox"
    aria-checked={selectAll}
    aria-label={`Select all available storage units (${selectableUnits.length} of ${storageUnits.length} units)`}
    tabIndex={disabled ? -1 : 0}
    disabled={disabled}
   >
    {/* Custom checkbox indicator */}
    <div
     className={cn(
      "w-4 h-4 mr-2 border-2 rounded-sm flex items-center justify-center",
      {
       "bg-primary border-primary": selectAll,
       "border-border bg-surface-primary": !selectAll,
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
      "text-xs text-text-primary",
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
    const hasPendingAppointment = !!unit.pendingAppointment;
    const isUnitDisabled = disabled || hasPendingAppointment;
    const unitAriaLabel = hasPendingAppointment
     ? `${unit.title}: ${unit.description}. Pending appointment scheduled for ${unit.pendingAppointment?.date ? formatPendingAppointmentDate(unit.pendingAppointment.date) : ''}. Cannot be selected.`
     : `${unit.title}: ${unit.description}. Last accessed ${unit.lastAccessedDate}. ${isSelected ? 'Selected' : 'Not selected'}.`;

    return (
     <button
      key={unit.id}
      type="button"
      className={cn(
       "flex items-start rounded-md border-2 mb-2 p-4 bg-transparent text-left w-full relative",
       "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
       // Error state (highest priority, but not for pending appointment units)
       hasError && !hasPendingAppointment && "border-status-error bg-status-bg-error",
       // Selected state (when no error)
       isSelected && !hasError && !hasPendingAppointment && "bg-surface-primary border-primary shadow-sm",
       // Pending appointment state (special styling - no opacity to keep badge visible)
       hasPendingAppointment && "border-border bg-surface-tertiary",
       // Default state
       !isSelected && !hasError && !isUnitDisabled && "border-border bg-surface-tertiary",
       // Default state when disabled globally
       !isSelected && !hasError && disabled && !hasPendingAppointment && "border-border bg-surface-tertiary",
       // Disabled state
       isUnitDisabled && "cursor-not-allowed",
       !isUnitDisabled && "cursor-pointer"
      )}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={unitAriaLabel}
      aria-describedby={`unit-${unit.id}-description`}
      aria-disabled={isUnitDisabled}
      tabIndex={isUnitDisabled ? -1 : 0}
      onClick={() => handleUnitSelection(unit.id)}
      onKeyDown={(e) => handleUnitKeyDown(e, unit.id)}
      disabled={isUnitDisabled}
     >
      
      <div className="flex flex-row w-full">
       {/* Image Section */}
       <div className={cn(
        "relative w-28 h-28 bg-surface-secondary flex flex-none justify-center items-center rounded-md mr-3 overflow-hidden",
        hasPendingAppointment && "opacity-50"
       )}>
        {unit.imageSrc && !isImageBroken(unit.id) ? (
         <Image
          src={unit.imageSrc}
          alt={`Storage unit ${unit.title}`}
          fill
          className="rounded-md object-cover"
          onError={() => handleImageError(unit.id)}
          sizes="112px"
         />
        ) : (
         <span className="text-sm text-text-secondary text-center px-2">
          Image not available
         </span>
        )}
       </div>
       
       {/* Content Section */}
       <div className="flex flex-col justify-between flex-1">
        <div>
         <div className="flex items-center gap-2 flex-wrap">
          <h3 
           className={cn(
            "text-base font-medium",
            {
             "text-status-error": hasError && !hasPendingAppointment,
             "text-text-secondary": hasPendingAppointment,
             "text-text-primary": !hasError && !hasPendingAppointment,
            }
           )}
          >
           {unit.title}
          </h3>
         
         </div>
         <p 
          id={`unit-${unit.id}-description`}
          className={cn(
           "text-sm mt-1",
           {
            "text-status-error": hasError && !hasPendingAppointment,
            "text-text-secondary": hasPendingAppointment,
            "text-text-tertiary": !hasError && !hasPendingAppointment,
           }
          )}
         >
          {unit.description}
         </p>
        </div>
        
        <div>
         {hasPendingAppointment ? (
          <span 
           className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-status-bg-warning text-amber-500"
           aria-label={`Pending appointment on ${unit.pendingAppointment?.date ? formatPendingAppointmentDate(unit.pendingAppointment.date) : ''}`}
          >
           Pending Appointment {unit.pendingAppointment?.date ? formatPendingAppointmentDate(unit.pendingAppointment.date) : ''}
          </span>
         ) : (
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
         )}
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
