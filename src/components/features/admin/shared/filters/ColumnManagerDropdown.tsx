/**
 * @fileoverview Column manager dropdown with checkboxes (gold standard pattern)
 * @source Extracted from AdminJobsPage lines 468-500
 * 
 * COMPONENT FUNCTIONALITY:
 * - Customize button with + icon
 * - Column visibility toggles
 * - Scrollable list for many columns
 * - Click-outside-to-close behavior
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Max height with overflow for long lists
 * - Checkbox pattern for column visibility
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Column<TId extends string = string> {
  id: TId;
  label: string;
  visible: boolean;
}

interface ColumnManagerDropdownProps<TId extends string = string> {
  /** Array of columns */
  columns: Column<TId>[];
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Toggle dropdown open/close */
  onToggle: () => void;
  /** Toggle column visibility */
  onToggleColumn: (columnId: TId) => void;
  /** Optional className for button */
  className?: string;
}

/**
 * ColumnManagerDropdown - Gold standard column visibility manager
 * 
 * @example
 * ```tsx
 * <ColumnManagerDropdown
 *   columns={columns}
 *   isOpen={showColumnMenu}
 *   onToggle={() => setShowColumnMenu(!showColumnMenu)}
 *   onToggleColumn={toggleColumn}
 * />
 * ```
 */
export function ColumnManagerDropdown<TId extends string = string>({
  columns,
  isOpen,
  onToggle,
  onToggleColumn,
  className = '',
}: ColumnManagerDropdownProps<TId>) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`inline-flex items-center text-sm gap-x-1.5 rounded-md bg-white px-3 py-2.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${className}`}
      >
        + Customize
        <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 max-h-96 overflow-y-auto">
            {columns.map((column) => (
              <div key={column.id} className="px-4 py-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => onToggleColumn(column.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{column.label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

