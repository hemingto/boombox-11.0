/**
 * @fileoverview Reusable data table component for admin management pages
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Generic table component with:
 * - Sortable headers
 * - Column visibility management
 * - Row rendering via render prop
 * - Loading and error states
 * - Empty state handling
 * - Responsive design
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic colors for table styling
 * - Consistent spacing and borders
 * - Spinner component for loading states
 * - Proper focus and hover states
 * 
 * @refactor Extracted from inline table implementations across 8+ management pages
 */

'use client';

import React from 'react';
import { SortableTableHeader, SortConfig } from './SortableTableHeader';
import { Spinner } from '@/components/ui/primitives/Spinner/Spinner';
import type { Column } from './ColumnManagerMenu';

interface AdminDataTableProps<T = any> {
  /** Array of column definitions */
  columns: Column[];
  /** Array of data items to display */
  data: T[];
  /** Current sort configuration */
  sortConfig: SortConfig;
  /** Callback when column is clicked for sorting */
  onSort: (columnId: string) => void;
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
export function AdminDataTable<T = any>({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  className = '',
}: AdminDataTableProps<T>) {
  const visibleColumns = columns.filter(col => col.visible);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-status-bg-error p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-status-error"
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
            <h3 className="text-sm font-medium text-status-error">
              Error loading data
            </h3>
            <div className="mt-2 text-sm text-status-error">
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
          className="mx-auto h-12 w-12 text-text-secondary"
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
        <h3 className="mt-2 text-sm font-medium text-text-primary">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-surface-tertiary">
          <tr>
            {visibleColumns.map((column) => (
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
        <tbody className="divide-y divide-border bg-surface-primary">
          {data.map((item, index) => renderRow(item))}
        </tbody>
      </table>
    </div>
  );
}

