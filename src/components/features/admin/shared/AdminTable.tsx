/**
 * @fileoverview Reusable admin table component
 * 
 * COMPONENT FUNCTIONALITY:
 * - Consistent table structure across all admin pages
 * - Sortable column headers with chevron icons
 * - Loading skeleton states
 * - Empty state with icon
 * - Row color support via function prop
 * 
 * DESIGN:
 * - bg-slate-100 header
 * - divide-gray-300 borders
 * - Matches boombox-10.0 table patterns
 */

'use client';

import { ReactNode } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface Column<T = any> {
  /** Column key */
  key: string;
  /** Column header label */
  label: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom render function for cell */
  render?: (row: T) => ReactNode;
  /** Column width class */
  width?: string;
}

interface AdminTableProps<T = any> {
  /** Table columns configuration */
  columns: Column<T>[];
  /** Table data rows */
  data: T[];
  /** Whether data is loading */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Current sort configuration */
  sort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /** Handle column sort */
  onSort?: (key: string) => void;
  /** Function to get row color class */
  getRowColor?: (row: T) => string;
  /** Function to get unique row key */
  getRowKey?: (row: T, index: number) => string | number;
}

/**
 * AdminTable - Reusable table with boombox-10.0 styling
 * 
 * @example
 * ```tsx
 * <AdminTable
 *   columns={columns}
 *   data={filteredJobs}
 *   loading={loading}
 *   emptyMessage="No jobs found"
 *   sort={sortConfig}
 *   onSort={handleSort}
 *   getRowColor={(job) => getRowColor(job.status)}
 * />
 * ```
 */
export function AdminTable<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  sort,
  onSort,
  getRowColor,
  getRowKey = (_, index) => index,
}: AdminTableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {emptyIcon}
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-3.5 text-left text-sm font-semibold text-gray-900 ${
                  column.width || ''
                } ${column.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sort && sort.key === column.key && (
                    <>
                      {sort.direction === 'asc' ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className={getRowColor ? getRowColor(row) : ''}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="whitespace-nowrap px-3 py-4 text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(row)
                    : (row as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

