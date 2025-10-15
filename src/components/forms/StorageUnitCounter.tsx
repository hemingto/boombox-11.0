/**
 * @fileoverview Storage unit counter component for selecting number of storage units needed
 * @source boombox-10.0/src/app/components/reusablecomponents/storageunitcounter.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Interactive counter for selecting 1-4 storage units
 * - Real-time availability checking via API
 * - Visual feedback for low availability (warning/error states)
 * - Accessibility-compliant with ARIA labels and keyboard navigation
 * - Responsive design with focus states and hover effects
 * 
 * API ROUTES UPDATED:
 * - Old: /api/storage-units/available-count → New: /api/orders/storage-units/available-count
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom colors with design system tokens (bg-surface-tertiary, text-text-primary, etc.)
 * - Applied semantic color usage for status indicators (status-error, status-warning)
 * - Used predefined utility classes (.input-field, .badge-error, .badge-warning)
 * - Consistent hover/focus states using design system colors
 * 
 * @refactor Extracted API calls to custom hook, applied design system colors, enhanced accessibility
 */

import { useState, useEffect, useRef } from 'react';
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import { StorageUnitIcon } from "../icons/StorageUnitIcon";
import { useStorageUnitAvailability } from '@/hooks/useStorageUnitAvailability';
import { useClickOutside } from '@/hooks/useClickOutside';

interface StorageUnitCounterProps {
  /** Callback fired when counter value changes */
  onCountChange: (count: number, text: string) => void;
  /** Initial counter value */
  initialCount: number;
  /** Optional CSS class name */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Storage unit counter component with availability checking
 * 
 * Features:
 * - Interactive increment/decrement buttons
 * - Real-time availability display
 * - Accessibility support with ARIA labels
 * - Focus management and keyboard navigation
 * - Visual status indicators for low availability
 * 
 * @example
 * ```tsx
 * <StorageUnitCounter
 *   initialCount={1}
 *   onCountChange={(count, text) => {
 *     setFormData({ ...formData, storageUnits: count, storageDescription: text });
 *   }}
 * />
 * ```
 */
export default function StorageUnitCounter({ 
  onCountChange, 
  initialCount, 
  className = '',
  disabled = false 
}: StorageUnitCounterProps) {
  // Component constraints
  const COMPONENT_MIN = 1;
  const COMPONENT_MAX = 4;

  // State management
  const [counter, setCounter] = useState(initialCount);
  const [isFocused, setIsFocused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hook for availability checking
  const { 
    availableUnits, 
    isLoading, 
    error: availabilityError 
  } = useStorageUnitAvailability();

  // Focus handlers
  const handleFocus = () => {
    if (!disabled) {
      setIsFocused(true);
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Initialize counter based on availability
  useEffect(() => {
    if (availableUnits !== null && !isInitialized) {
      let countToSet = initialCount;
      const systemAwareMax = Math.min(COMPONENT_MAX, availableUnits);
      
      if (availableUnits === 0) {
        countToSet = COMPONENT_MIN;
      } else {
        countToSet = Math.min(initialCount, systemAwareMax);
        countToSet = Math.max(countToSet, COMPONENT_MIN);
      }
      setCounter(countToSet);
      setIsInitialized(true);
    }
  }, [initialCount, availableUnits, isInitialized]);

  // Adjust counter when availability changes
  useEffect(() => {
    if (isInitialized && availableUnits !== null) {
      const systemAwareMax = Math.min(COMPONENT_MAX, availableUnits);
      let newCounter = counter;

      if (availableUnits === 0) {
        newCounter = COMPONENT_MIN;
      } else if (counter > systemAwareMax) {
        newCounter = systemAwareMax;
      }
      newCounter = Math.max(COMPONENT_MIN, newCounter);

      if (newCounter !== counter) {
        setCounter(newCounter);
      }
    }
  }, [availableUnits, counter, isInitialized]);

  // Notify parent of changes
  useEffect(() => {
    if (isInitialized) {
      onCountChange(counter, getStorageUnitText(counter));
    }
  }, [counter, onCountChange, isInitialized]);

  // Calculate button states
  const currentEffectiveMax = availableUnits === null ? COMPONENT_MAX : Math.min(COMPONENT_MAX, availableUnits);
  const canDecrement = !disabled && counter > COMPONENT_MIN;
  const canIncrement = !disabled && (availableUnits === null ? counter < COMPONENT_MAX : (counter < currentEffectiveMax && availableUnits > 0));

  // Counter actions
  const incrementCounter = () => {
    if (canIncrement) {
      const newCount = Math.min(counter + 1, currentEffectiveMax);
      setCounter(newCount);
      handleFocus();
    }
  };

  const decrementCounter = () => {
    if (canDecrement) {
      const newCount = Math.max(counter - 1, COMPONENT_MIN);
      setCounter(newCount);
      handleFocus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowUp':
      case '+':
        event.preventDefault();
        incrementCounter();
        break;
      case 'ArrowDown':
      case '-':
        event.preventDefault();
        decrementCounter();
        break;
      case 'Home':
        event.preventDefault();
        setCounter(COMPONENT_MIN);
        handleFocus();
        break;
      case 'End':
        event.preventDefault();
        setCounter(currentEffectiveMax);
        handleFocus();
        break;
    }
  };

  // Click outside handler
  useClickOutside(containerRef, handleBlur);

  /**
   * Get descriptive text for storage unit count
   */
  const getStorageUnitText = (count: number): string => {
    switch (count) {
      case 1:
        return 'studio apartment';
      case 2:
        return '1 bedroom apt';
      case 3:
        return '2 bedroom apt';
      case 4:
      case 5: // Case 5 was in original, implies max can be > 4 from text perspective
        return 'full house';
      default:
        return 'studio apartment'; // Default for counter=0 or other values
    }
  };

  /**
   * Get availability badge styling based on count
   */
  const getAvailabilityBadgeClasses = (count: number): string => {
    if (count === 0) {
      return 'badge-error';
    } else if (count < 3) {
      return 'badge-error';
    } else if (count < 10) {
      return 'badge-warning';
    }
    return 'badge-info';
  };

  /**
   * Get container styling based on state
   */
  const getContainerClasses = (): string => {
    const baseClasses = 'flex gap-4 w-full p-4 bg-surface-tertiary border-2 border-border rounded-md items-center max-w-lg transition-all duration-200';
    const focusClasses = isFocused ? 'bg-surface-primary ring-2 ring-border-focus' : '';
    const disabledClasses = (disabled || availableUnits === 0) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer';
    
    return `${baseClasses} ${focusClasses} ${disabledClasses} ${className}`.trim();
  };

  /**
   * Get button styling based on state
   */
  const getButtonClasses = (canPerformAction: boolean): string => {
    const baseClasses = 'w-6 h-6 transition-colors duration-200';
    const enabledClasses = canPerformAction && !disabled && availableUnits !== 0 
      ? 'text-text-primary hover:text-primary cursor-pointer' 
      : 'text-text-secondary cursor-not-allowed';
    
    return `${baseClasses} ${enabledClasses}`;
  };

  return (
    <div className={className}>
      {/* Header with availability indicator */}
      <div className="flex items-center justify-between mt-4 mb-4">
        <label 
          htmlFor="storage-unit-counter"
          className="mr-2 text-text-primary font-medium"
        >
          How many storage units do you need?
        </label>
        
        {/* Availability badge */}
        {availableUnits !== null && availableUnits < 10 && (
          <span 
            className={`px-3 py-2 text-xs rounded-full text-nowrap ${getAvailabilityBadgeClasses(availableUnits)}`}
            role="status"
            aria-live="polite"
          >
            {availableUnits === 0 
              ? 'No units available' 
              : `${availableUnits} unit${availableUnits !== 1 ? 's' : ''} left`
            }
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <span className="px-3 py-2 text-xs text-text-secondary">
            Checking availability...
          </span>
        )}

        {/* Error indicator */}
        {availabilityError && (
          <span 
            className="px-3 py-2 text-xs text-status-error"
            role="alert"
          >
            Unable to check availability
          </span>
        )}
      </div>

      {/* Counter container */}
      <div 
        ref={containerRef}
        id="storage-unit-counter"
        className={getContainerClasses()}
        tabIndex={disabled ? -1 : 0}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        role="spinbutton"
        aria-label="Number of storage units"
        aria-valuenow={counter}
        aria-valuemin={COMPONENT_MIN}
        aria-valuemax={currentEffectiveMax}
        aria-describedby="storage-unit-description availability-status"
        aria-disabled={disabled || availableUnits === 0}
      >
        {/* Storage unit icon */}
        <StorageUnitIcon 
          className="w-12 h-12 text-text-primary flex-shrink-0" 
          aria-hidden="true"
        />
        
        {/* Unit description */}
        <div className="flex-col min-w-0 flex-1">
          <h3 
            className="text-sm font-medium text-text-primary"
            id="storage-unit-description"
          >
            Boombox Storage Unit{counter > 1 ? 's' : ''}
          </h3>
          <p className="text-xs text-text-secondary">
            {getStorageUnitText(counter)}
          </p>
        </div>
        
        {/* Counter controls */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {/* Decrement button */}
          <button 
            onClick={decrementCounter} 
            aria-label={`Decrease to ${counter - 1} storage unit${counter - 1 !== 1 ? 's' : ''}`}
            disabled={!canDecrement || availableUnits === 0}
            className="p-1 rounded-full hover:bg-surface-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus transition-colors duration-200"
            tabIndex={disabled ? -1 : 0}
          >
            <MinusCircleIcon className={getButtonClasses(canDecrement)} />
          </button>
          
          {/* Counter display */}
          <span 
            className="text-xl font-semibold text-text-primary min-w-[2rem] text-center"
            aria-hidden="true"
          >
            {counter}
          </span>
          
          {/* Increment button */}
          <button 
            onClick={incrementCounter} 
            aria-label={`Increase to ${counter + 1} storage unit${counter + 1 !== 1 ? 's' : ''}`}
            disabled={!canIncrement || availableUnits === 0}
            className="p-1 rounded-full hover:bg-surface-disabled focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus transition-colors duration-200"
            tabIndex={disabled ? -1 : 0}
          >
            <PlusCircleIcon className={getButtonClasses(canIncrement)} />
          </button>
        </div>
      </div>

      {/* Screen reader status */}
      <div 
        id="availability-status" 
        className="sr-only" 
        aria-live="polite"
      >
        {availableUnits !== null && (
          availableUnits === 0 
            ? 'No storage units are currently available'
            : `${availableUnits} storage units available`
        )}
      </div>
    </div>
  );
}
