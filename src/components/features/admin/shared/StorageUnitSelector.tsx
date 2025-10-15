/**
 * @fileoverview Storage unit selector dropdown for admin task forms
 * @source boombox-10.0/src/app/components/admin/storage-unit-selector.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Dropdown selector for available storage units:
 * - Fetches available storage units from API
 * - Displays loading state while fetching
 * - Supports disabled state
 * - Uses Headless UI Listbox for accessibility
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens
 * - Used text-text-primary instead of text-gray-900
 * - Used border colors from design system
 * - Replaced indigo-600 with primary color
 * - Consistent focus and hover states
 * 
 * API ROUTES:
 * - GET /api/admin/storage-units/available - Fetches available units
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
  storageUnitNumber: string;
}

interface StorageUnitSelectorProps {
  /** Label displayed above the selector */
  label: string;
  /** Currently selected storage unit number */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * StorageUnitSelector - Dropdown for selecting available storage units
 * 
 * @example
 * ```tsx
 * <StorageUnitSelector
 *   label="Select Storage Unit"
 *   value={selectedUnit}
 *   onChange={setSelectedUnit}
 *   disabled={false}
 * />
 * ```
 */
export function StorageUnitSelector({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}: StorageUnitSelectorProps) {
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageUnits = async () => {
      try {
        const response = await fetch('/api/admin/storage-units/available');
        if (!response.ok) throw new Error('Failed to fetch storage units');
        const data = await response.json();
        setStorageUnits(data);
      } catch (error) {
        console.error('Error fetching storage units:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageUnits();
  }, []);

  const selectedUnit = storageUnits.find(unit => unit.storageUnitNumber === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled || loading}>
      <Label className="form-label">{label}</Label>
      <div className="relative">
        <ListboxButton 
          className="grid w-full cursor-default grid-cols-1 rounded-md bg-surface-primary py-1.5 pl-3 pr-2 text-left text-text-primary outline outline-1 -outline-offset-1 outline-border focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={label}
        >
          <span className="col-start-1 row-start-1 truncate pr-6">
            {loading ? 'Loading...' : selectedUnit?.storageUnitNumber || 'Select a unit'}
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
          {storageUnits.map((unit) => (
            <ListboxOption
              key={unit.id}
              value={unit.storageUnitNumber}
              className="group relative cursor-default select-none py-2 pl-8 pr-4 text-text-primary data-[focus]:bg-primary data-[focus]:text-text-inverse data-[focus]:outline-none"
            >
              <span className="block truncate font-normal group-data-[selected]:font-semibold">
                {unit.storageUnitNumber}
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

