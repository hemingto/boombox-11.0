/**
 * @fileoverview Skeleton loading state for admin tables (gold standard pattern)
 * @source Extracted from AdminJobsPage lines 504-536
 * 
 * COMPONENT FUNCTIONALITY:
 * - Animated pulse skeleton rows
 * - Configurable number of rows
 * - Matches visible columns structure
 * - Clean slate header styling
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard (NOT old AdminDataTable spinner)
 * - Skeleton loading provides better UX than spinners
 * - Shows table structure while loading
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';

interface Column {
  id: string;
  label: string;
  visible: boolean;
}

interface AdminTableSkeletonProps {
  /** Array of columns to display */
  columns: Column[];
  /** Number of skeleton rows to show (default: 5) */
  rowCount?: number;
  /** Optional label for the action column header */
  actionColumnLabel?: string;
}

/**
 * AdminTableSkeleton - Gold standard skeleton loading for admin tables
 * 
 * @example
 * ```tsx
 * {loading ? (
 *   <AdminTableSkeleton columns={columns} rowCount={5} />
 * ) : (
 *   <AdminTable data={jobs} />
 * )}
 * ```
 */
export function AdminTableSkeleton({ columns, rowCount = 5, actionColumnLabel }: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
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
                  {column.label}
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
          {[...Array(rowCount)].map((_, index) => (
            <tr key={index} className="animate-pulse">
              {columns.map((column) => (
                column.visible && (
                  <td key={column.id} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                )
              ))}
              {actionColumnLabel && (
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

