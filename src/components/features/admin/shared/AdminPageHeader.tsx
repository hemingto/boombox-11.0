/**
 * @fileoverview Reusable admin page header component
 * 
 * COMPONENT FUNCTIONALITY:
 * - Consistent header across all admin pages
 * - Indigo-950 background with white text
 * - Flexible controls section for filters, search, etc.
 * - Rounded top corners
 * 
 * DESIGN:
 * - bg-indigo-950 background
 * - White text for title
 * - Flex layout for controls
 * - Matches boombox-10.0 header patterns
 */

'use client';

import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  /** Page title */
  title: string;
  /** Control elements (search, filters, buttons, etc.) */
  children?: ReactNode;
}

/**
 * AdminPageHeader - Reusable header for admin pages
 * 
 * @example
 * ```tsx
 * <AdminPageHeader title="Today's Jobs">
 *   <SearchInput value={searchQuery} onChange={setSearchQuery} />
 *   <DatePickerFilter value={selectedDate} onChange={handleDateChange} />
 *   <FilterDropdown label="Status" {...statusFilters} />
 * </AdminPageHeader>
 * ```
 */
export function AdminPageHeader({ title, children }: AdminPageHeaderProps) {
  return (
    <div className="py-4 px-4 bg-indigo-950 rounded-t-lg flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

