/**
 * @deprecated Use table/AdminTable instead - AdminJobsPage gold standard with skeleton loading
 * 
 * @fileoverview Reusable data table component for admin management pages
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * WHY DEPRECATED:
 * - Uses spinner loading (inferior UX to skeleton loading)
 * - AdminJobsPage gold standard uses skeleton rows for better perceived performance
 * - New table/AdminTable follows superior patterns from AdminJobsPage
 * 
 * MIGRATION:
 * Replace with: import { AdminTable } from '@/components/features/admin/shared/table/AdminTable'
 * 
 * COMPONENT FUNCTIONALITY:
 * Generic table component with:
 * - Sortable headers
 * - Column visibility management
 * - Row rendering via render prop
 * - Loading and error states (SPINNER - not skeleton)
 * - Empty state handling
 * - Responsive design
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors for table styling
 * - Consistent spacing and borders
 * - Spinner component for loading states (NOT SKELETON - inferior)
 * - Proper focus and hover states
 * 
 * @refactor Extracted from inline table implementations across 8+ management pages
 */

'use client';

import React from 'react';
import { SortableTableHeader, SortConfig } from './SortableTableHeader';
import type { Column } from './ColumnManagerMenu';

interface AdminDataTableProps<T = any, C extends string = string> {
  /** Array of column definitions */
  columns: Column<C>[];
  /** Array of data items to display */
  data: T[];
  /** Current sort configuration */
  sortConfig: SortConfig<C>;
  /** Callback when column is clicked for sorting */
  onSort: (columnId: C) => void;
  /** Render function for each table row */
  renderRow: (item: T) => React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Optional className for table wrapper */
  className?: string;
}

/**
 * AdminDataTable - Reusable table component for admin management pages
 * 
 * @example
 * ```tsx
 * <AdminDataTable
 *   columns={visibleColumns}
 *   data={sortedDrivers}
 *   sortConfig={sortConfig}
 *   onSort={handleSort}
 *   loading={loading}
 *   error={error}
 *   renderRow={(driver) => (
 *     <tr key={driver.id}>
 *       <td>{driver.firstName}</td>
 *       <td>{driver.lastName}</td>
 *     </tr>
 *   )}
 * />
 * ```
 */
export function AdminDataTable<T = any, C extends string = string>({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  className = '',
}: AdminDataTableProps<T, C>) {
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-700">
              Error loading data
            </h3>
            <div className="mt-2 text-sm text-red-600">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-300 bg-slate-100">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((column) => (
              <SortableTableHeader
                key={column.id}
                label={column.label}
                sortKey={column.id}
                currentSort={sortConfig}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, index) => renderRow(item))}
        </tbody>
      </table>
    </div>
  );
}

