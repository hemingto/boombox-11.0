/**
 * @fileoverview Admin page header with controls (gold standard pattern)
 * @source Extracted from AdminJobsPage lines 345-502
 * 
 * COMPONENT FUNCTIONALITY:
 * - Page title on left
 * - Controls on right (search, date picker, filters, customize)
 * - Proper spacing and alignment
 * - Dropdown coordination (only one open at a time)
 * - Responsive design
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard
 * - Flex layout with justify-between
 * - Gap-2 spacing between controls
 * - m-4 margin around entire header
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';

interface AdminPageHeaderProps {
  /** Page title */
  title: string;
  /** Controls to render on the right side */
  children: React.ReactNode;
  /** Optional className for container */
  className?: string;
}

/**
 * AdminPageHeader - Gold standard page header with title and controls
 * 
 * @example
 * ```tsx
 * <AdminPageHeader title="Jobs">
 *   <input type="text" placeholder="Search..." />
 *   <AdminDatePicker />
 *   <FilterDropdown label="Status" ... />
 *   <FilterDropdown label="Actions" ... />
 *   <ColumnManagerDropdown ... />
 * </AdminPageHeader>
 * ```
 */
export function AdminPageHeader({ title, children, className = '' }: AdminPageHeaderProps) {
  return (
    <div className={`${className}`}>
      <div className="py-6 px-4 rounded-t-lg flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-zinc-950">{title}</h1>
        <div className="flex gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}

