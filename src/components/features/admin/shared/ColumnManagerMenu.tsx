/**
 * @deprecated Use filters/ColumnManagerDropdown instead
 * 
 * @fileoverview Column visibility toggle menu component for admin tables
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * WHY DEPRECATED:
 * - AdminJobsPage gold standard uses simpler, more consistent pattern
 * - ColumnManagerDropdown follows same checkbox pattern as FilterDropdown
 * - Better visual consistency with other dropdowns
 * 
 * MIGRATION:
 * Replace with: import { ColumnManagerDropdown } from '@/components/features/admin/shared/filters/ColumnManagerDropdown'
 * 
 * COMPONENT FUNCTIONALITY:
 * Dropdown menu for managing table column visibility:
 * - Displays list of all available columns with checkboxes
 * - Allows toggling column visibility on/off
 * - Closes when clicking outside the menu
 * - Keyboard accessible with proper focus management
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors (surface, border, text colors)
 * - Consistent shadow and border radius
 * - Proper hover and focus states
 * - Button uses btn-secondary utility class
 * 
 * @refactor Extracted from inline column management implementations across 8+ management pages
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { ListBulletIcon } from '@heroicons/react/24/solid';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface Column<T = string> {
 id: T;
 label: string;
 visible: boolean;
}

interface ColumnManagerMenuProps<T = string> {
 /** Array of column definitions */
 columns: Column<T>[];
 /** Callback when column visibility is toggled */
 onToggleColumn: (columnId: T) => void;
 /** Whether the menu is currently open */
 showMenu: boolean;
 /** Callback to toggle menu open/close */
 onToggleMenu: () => void;
}

/**
 * ColumnManagerMenu - Dropdown menu for managing table column visibility
 * 
 * @example
 * ```tsx
 * <ColumnManagerMenu
 *  columns={columns}
 *  onToggleColumn={toggleColumn}
 *  showMenu={showColumnMenu}
 *  onToggleMenu={() => setShowColumnMenu(!showColumnMenu)}
 * />
 * ```
 */
export function ColumnManagerMenu<T extends string = string>({
 columns,
 onToggleColumn,
 showMenu,
 onToggleMenu,
}: ColumnManagerMenuProps<T>) {
 const menuRef = useRef<HTMLDivElement>(null);

 // Close menu when clicking outside
 useClickOutside(menuRef, () => {
  if (showMenu) {
   onToggleMenu();
  }
 });

 return (
  <div className="relative" ref={menuRef}>
   <button
    type="button"
    onClick={onToggleMenu}
    className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
    aria-expanded={showMenu}
    aria-haspopup="true"
    aria-label="Manage columns"
   >
    <ListBulletIcon className="h-5 w-5" aria-hidden="true" />
    Columns
   </button>

   {showMenu && (
    <div
     className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
     role="menu"
     aria-orientation="vertical"
     aria-labelledby="column-menu-button"
    >
     <div className="py-1 max-h-96 overflow-y-auto">
      {columns.map((column) => (
       <label
        key={column.id}
        className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer"
       >
        <input
         type="checkbox"
         checked={column.visible}
         onChange={() => onToggleColumn(column.id)}
         className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 mr-3"
         aria-label={`Toggle ${column.label} column`}
        />
        <span>{column.label}</span>
       </label>
      ))}
     </div>
    </div>
   )}
  </div>
 );
}

