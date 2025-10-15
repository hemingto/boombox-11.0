/**
 * @fileoverview Location selector dropdown component for driver onboarding
 * @source boombox-10.0/src/app/components/driver-signup/whereareyoulocatedinput.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Custom dropdown component that allows drivers to select their service area during signup.
 * Supports two main regions: San Francisco Bay Area (with 8 sub-regions) and Central Valley
 * (with 3 cities). Includes error state handling, click-outside detection, and controlled
 * component pattern for form integration.
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens:
 *   - text-red-500 → text-status-error
 *   - bg-red-100 → bg-status-bg-error
 *   - ring-red-500 → border-border-error
 *   - text-zinc-950 → text-text-primary
 *   - text-zinc-400 → text-text-secondary
 *   - bg-slate-100 → bg-surface-tertiary
 *   - bg-white → bg-surface-primary
 * - Updated focus states to use design system border-focus
 * - Applied consistent hover states with surface-hover
 * 
 * ACCESSIBILITY IMPROVEMENTS:
 * - Added ARIA labels and roles (combobox, listbox, option)
 * - Implemented keyboard navigation (Enter, Escape, Arrow keys)
 * - Added aria-expanded, aria-haspopup, aria-invalid attributes
 * - Included focus management and visual focus indicators
 * - Added aria-live region for error announcements
 * 
 * @refactor
 * - Renamed from whereareyoulocatedinput.tsx to LocationSelect.tsx (PascalCase)
 * - Enhanced TypeScript interfaces with proper documentation
 * - Improved accessibility with full keyboard navigation
 * - Applied centralized design system colors and tokens
 * - Added keyboard event handling for better UX
 * 
 * @design-system
 * Uses semantic colors: text-status-error, bg-surface-tertiary, border-border-error,
 * text-text-primary, text-text-secondary, bg-surface-primary, bg-surface-hover
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';

/**
 * Location group interface for organizing service areas by region
 */
interface LocationGroup {
  label: string;
  locations: string[];
}

/**
 * Props interface for LocationSelect component
 */
interface LocationSelectProps {
  /** Currently selected location value */
  value?: string | null;
  /** Callback fired when location selection changes */
  onLocationChange: (location: string | null) => void;
  /** Whether the component is in an error state */
  hasError?: boolean;
  /** Callback to clear error state (typically fired on interaction) */
  onClearError?: () => void;
}

/**
 * Available service area location groups
 * Organized by major region with specific sub-regions
 */
const locationGroups: LocationGroup[] = [
  {
    label: 'San Francisco Bay Area',
    locations: [
      'San Francisco',
      'South Bay (Mountain View to Santa Clara)',
      'Northern Peninsula (Millbrae to San Carlos)',
      'East Bay',
      'San Leandro to Fremont',
      'Southern Peninsula (Redwood City to Palo Alto)',
      'San Jose',
      'North Bay',
    ],
  },
  {
    label: 'Central Valley',
    locations: ['Stockton', 'Manteca', 'Lodi'],
  },
];

/**
 * LocationSelect component for driver service area selection
 * 
 * A fully accessible, keyboard-navigable dropdown component that allows
 * drivers to select their primary service area during signup. Supports
 * error states, controlled component pattern, and follows WCAG 2.1 AA
 * accessibility standards.
 * 
 * @example
 * ```tsx
 * <LocationSelect
 *   value={selectedLocation}
 *   onLocationChange={(location) => setSelectedLocation(location)}
 *   hasError={!!errors.location}
 *   onClearError={() => clearError('location')}
 * />
 * ```
 */
export function LocationSelect({
  value = null,
  onLocationChange,
  hasError = false,
  onClearError,
}: LocationSelectProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(value);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setSelectedLocation(value);
  }, [value]);

  /**
   * Handles location selection from dropdown
   */
  const handleLocationClick = (location: string) => {
    setSelectedLocation(location);
    setIsOpen(false);
    setFocusedIndex(-1);
    onLocationChange(location);
  };

  /**
   * Toggles dropdown open state and clears errors
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onClearError) {
      onClearError();
    }
  };

  /**
   * Closes dropdown when clicking outside component
   */
  useClickOutside(ref, () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  });

  /**
   * Flattens location groups into single array for keyboard navigation
   */
  const flatLocations = locationGroups.flatMap((group) => group.locations);

  /**
   * Handles keyboard navigation within dropdown
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      // Open dropdown on Enter or Space
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => 
          prev < flatLocations.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatLocations.length) {
          handleLocationClick(flatLocations[focusedIndex]);
        }
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setFocusedIndex(flatLocations.length - 1);
        break;
    }
  };

  return (
    <div className="w-full relative mb-2 sm:mb-4" ref={ref}>
      <div
        className={`relative rounded-md py-2.5 px-3 cursor-pointer transition-colors ${
          hasError
            ? 'text-status-error bg-status-bg-error ring-2 ring-border-error'
            : isOpen
            ? 'ring-2 ring-border-focus bg-surface-primary'
            : 'bg-surface-tertiary hover:bg-surface-hover'
        }`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={hasError}
        aria-label="Select your service area location"
        tabIndex={0}
      >
        <div className="flex justify-between items-center">
          <span
            className={`${
              hasError
                ? 'text-status-error'
                : selectedLocation
                ? 'text-base text-text-primary'
                : 'text-sm leading-6 text-text-secondary'
            }`}
          >
            {selectedLocation ? selectedLocation : 'Where are you located?'}
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${
              hasError ? 'text-status-error' : 'text-text-secondary'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-2 rounded-md bg-surface-primary shadow-lg border border-border max-h-80 overflow-auto"
          role="listbox"
          aria-label="Location options"
        >
          {locationGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className="px-4 py-4 text-text-primary font-medium underline underline-offset-2">
                {group.label}
              </div>
              {group.locations.map((location, locIdx) => {
                const flatIndex = flatLocations.indexOf(location);
                const isFocused = flatIndex === focusedIndex;
                const isSelected = selectedLocation === location;

                return (
                  <div
                    key={locIdx}
                    className={`px-6 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-surface-disabled font-medium'
                        : isFocused
                        ? 'bg-surface-hover'
                        : 'bg-surface-primary hover:bg-surface-hover'
                    }`}
                    onClick={() => handleLocationClick(location)}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setFocusedIndex(flatIndex)}
                  >
                    {location}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Screen reader announcement for error state */}
      {hasError && (
        <div role="alert" aria-live="polite" className="sr-only">
          Location selection is required
        </div>
      )}
    </div>
  );
}

export default LocationSelect;
