/**
 * @fileoverview Gold standard admin table component with skeleton loading
 * @source Extracted from AdminJobsPage lines 504-666
 * 
 * COMPONENT FUNCTIONALITY:
 * - Skeleton loading state (NOT spinner)
 * - Empty state with icon
 * - Error state with retry
 * - Sortable column headers with chevron indicators
 * - Responsive overflow handling
 * - Row render prop for flexibility
 * - Slate table header styling
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard patterns
 * - Skeleton loading provides better UX than spinners
 * - Sortable headers inline with column configuration
 * - Row styling controlled by parent (getRowColor pattern)
 * 
 * KEY DIFFERENCES FROM OLD AdminDataTable:
 * - Skeleton loading instead of spinner
 * - Sortable headers more integrated
 * - Cleaner slate-100 header background
 * - Better empty/error states
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminErrorState } from './AdminErrorState';

interface Column<TColumnId extends string = string> {
  id: TColumnId;
  label: string;
  visible: boolean;
  sortable?: boolean;
}

interface SortConfig<TColumnId extends string = string> {
  column: TColumnId | null;
  direction: 'asc' | 'desc';
}

interface AdminTableProps<TData = any, TColumnId extends string = string> {
  /** Array of column definitions */
  columns: Column<TColumnId>[];
  /** Array of data items to display */
  data: TData[];
  /** Current sort configuration */
  sortConfig: SortConfig<TColumnId>;
  /** Callback when column header is clicked for sorting */
  onSort?: (columnId: TColumnId) => void;
  /** Render function for each table row */
  renderRow: (item: TData, index: number) => React.ReactNode;
  /** Loading state (shows skeleton) */
  loading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Optional retry callback for errors */
  onRetry?: () => void;
  /** Optional className for table wrapper */
  className?: string;
  /** Number of skeleton rows to show during loading (default: 5) */
  skeletonRows?: number;
  /** Optional label for the action column header */
  actionColumnLabel?: string;
}

/**
 * AdminTable - Gold standard table component for admin management pages
 * 
 * @example
 * ```tsx
 * <AdminTable
 *   columns={columns}
 *   data={filteredAndSortedJobs}
 *   sortConfig={sortConfig}
 *   onSort={handleSort}
 *   loading={loading}
 *   error={error}
 *   emptyMessage="No jobs booked for today"
 *   renderRow={(job) => (
 *     <tr key={job.id} className={getRowColor(job.status)}>
 *       <td>{job.jobCode}</td>
 *       <td>{job.user.firstName}</td>
 *     </tr>
 *   )}
 * />
 * ```
 */
export function AdminTable<TData = any, TColumnId extends string = string>({
  columns,
  data,
  sortConfig,
  onSort,
  renderRow,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  onRetry,
  className = '',
  skeletonRows = 5,
  actionColumnLabel,
}: AdminTableProps<TData, TColumnId>) {
  // Loading state - show skeleton
  if (loading) {
    return <AdminTableSkeleton columns={columns} rowCount={skeletonRows} actionColumnLabel={actionColumnLabel} />;
  }

  // Error state
  if (error) {
    return <AdminErrorState error={error} onRetry={onRetry} />;
  }

  // Empty state
  if (data.length === 0) {
    return <AdminEmptyState message={emptyMessage} />;
  }

  // Data table
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((column) => (
              column.visible && (
                <th
                  key={column.id}
                  scope="col"
                  className="whitespace-nowrap py-1.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                >
                  {column.sortable !== false && onSort ? (
                    <button
                      onClick={() => onSort(column.id)}
                      className="flex items-center gap-1 hover:bg-slate-200 py-2 px-4 rounded-full"
                    >
                      {column.label}
                      {sortConfig.column === column.id ? (
                        sortConfig.direction === 'desc' ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            ))}
            {actionColumnLabel && (
              <th
                scope="col"
                className="whitespace-nowrap py-1.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                {actionColumnLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  );
}

