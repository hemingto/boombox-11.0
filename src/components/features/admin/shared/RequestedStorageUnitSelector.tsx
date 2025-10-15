/**
 * @fileoverview Requested storage unit selector for admin task forms
 * @source boombox-10.0/src/app/components/admin/requested-storage-unit-selector.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Dropdown selector for customer-requested storage units:
 * - Fetches requested units for specific appointment
 * - Filters out already-assigned units
 * - Displays loading and error states
 * - Supports disabled state
 * - Uses Headless UI Listbox for accessibility
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens
 * - Used text-text-primary instead of text-gray-900
 * - Used form-label utility class
 * - Replaced indigo-600 with primary color
 * - Used status-error color for error messages
 * - Consistent focus and hover states
 * 
 * API ROUTES:
 * - GET /api/admin/appointments/[id]/requested-storage-units - Fetches requested units
 * 
 * @refactor Migrated from boombox-10.0, updated with design system colors
 */

'use client';

import { useState, useEffect } from 'react';
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import { CheckIcon } from '@heroicons/react/20/solid';

interface StorageUnit {
  id: number;
  storageUnit: {
    id: number;
    storageUnitNumber: string;
    status: string;
  };
}

interface RequestedStorageUnitSelectorProps {
  /** Label displayed above the selector */
  label: string;
  /** Currently selected storage unit ID */
  value: number;
  /** Callback when selection changes */
  onChange: (value: number) => void;
  /** Appointment ID to fetch requested units for */
  appointmentId: number;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * RequestedStorageUnitSelector - Dropdown for selecting customer-requested storage units
 * 
 * @example
 * ```tsx
 * <RequestedStorageUnitSelector
 *   label="Select Requested Unit"
 *   value={selectedUnitId}
 *   onChange={setSelectedUnitId}
 *   appointmentId={appointmentId}
 *   disabled={false}
 * />
 * ```
 */
export function RequestedStorageUnitSelector({ 
  label, 
  value, 
  onChange, 
  appointmentId,
  disabled = false 
}: RequestedStorageUnitSelectorProps) {
  const [requestedUnits, setRequestedUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestedUnits = async () => {
      if (!appointmentId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/appointments/${appointmentId}/requested-storage-units`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch requested storage units');
        }
        
        const data = await response.json();
        setRequestedUnits(data);
        
        // If the selected value is not in the filtered list, clear the selection
        if (value && data.length > 0 && !data.some((unit: StorageUnit) => unit.storageUnit.id === value)) {
          onChange(0);
        }
      } catch (error) {
        console.error('Error fetching requested storage units:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch requested storage units');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedUnits();
  }, [appointmentId, value, onChange]);

  const selectedUnit = requestedUnits.find(unit => unit.storageUnit.id === value);

  return (
    <Listbox 
      value={value} 
      onChange={onChange} 
      disabled={disabled || loading || requestedUnits.length === 0}
    >
      <Label className="form-label">{label}</Label>
      <div className="relative">
        <ListboxButton 
          className="grid w-full cursor-default grid-cols-1 rounded-md bg-surface-primary py-1.5 pl-3 pr-2 text-left text-text-primary outline outline-1 -outline-offset-1 outline-border focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={label}
        >
          <span className="col-start-1 row-start-1 truncate pr-6">
            {loading 
              ? 'Loading...' 
              : (selectedUnit?.storageUnit.storageUnitNumber || 
                 (requestedUnits.length === 0 
                  ? 'No units available' 
                  : 'Select a unit'))}
          </span>
          <ChevronUpDownIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 size-5 self-center justify-self-end text-text-secondary sm:size-4"
          />
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface-primary py-1 text-base shadow-lg ring-1 ring-border focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
        >
          {error && (
            <div className="py-2 px-4 text-status-error">{error}</div>
          )}
          
          {requestedUnits.length === 0 && !loading && !error && (
            <div className="py-2 px-4 text-text-secondary italic">
              All requested units have already been assigned
            </div>
          )}
          
          {requestedUnits.map((unit) => (
            <ListboxOption
              key={unit.id}
              value={unit.storageUnit.id}
              className="group relative cursor-default select-none py-2 pl-8 pr-4 text-text-primary data-[focus]:bg-primary data-[focus]:text-text-inverse data-[focus]:outline-none"
            >
              <span className="block truncate font-normal group-data-[selected]:font-semibold">
                {unit.storageUnit.storageUnitNumber}
              </span>

              <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-primary group-[&:not([data-selected])]:hidden group-data-[focus]:text-text-inverse">
                <CheckIcon aria-hidden="true" className="size-5" />
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

