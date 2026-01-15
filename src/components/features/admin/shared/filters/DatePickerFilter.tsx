/**
 * @fileoverview Date picker filter wrapper for admin pages
 * 
 * COMPONENT FUNCTIONALITY:
 * - Wraps CustomDatePicker with consistent admin styling
 * - Standard sizing and margins for admin header
 * - Allows past dates by default
 * - Small text variant for compact display
 * 
 * DESIGN:
 * - Width: 48 (w-48)
 * - Negative margins for header alignment
 * - Matches boombox-10.0 date picker patterns
 */

'use client';

import CustomDatePicker from '@/components/forms/CustomDatePicker';

interface DatePickerFilterProps {
  /** Current selected date */
  value: Date | null;
  /** Callback when date changes */
  onChange: (formattedDate: string, dateObject: Date | null) => void;
  /** Whether to allow past dates (default: true) */
  allowPastDates?: boolean;
}

/**
 * DatePickerFilter - Admin date picker with consistent styling
 * 
 * @example
 * ```tsx
 * <DatePickerFilter
 *   value={selectedDate}
 *   onChange={handleDateChange}
 * />
 * ```
 */
export function DatePickerFilter({
  value,
  onChange,
  allowPastDates = true,
}: DatePickerFilterProps) {
  return (
    <div className="w-48 sm:-mb-4 -mb-2">
      <CustomDatePicker
        onDateChange={onChange}
        value={value}
        allowPastDates={allowPastDates}
        smallText={true}
      />
    </div>
  );
}

