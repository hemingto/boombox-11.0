/**
 * @fileoverview Search input component for admin pages
 * 
 * COMPONENT FUNCTIONALITY:
 * - Text input for searching/filtering data
 * - Consistent styling across admin portal
 * - White background with indigo focus ring
 * 
 * DESIGN:
 * - Matches boombox-10.0 search input patterns
 * - Rounded borders, shadow ring
 * - Indigo focus state
 */

'use client';

interface SearchInputProps {
  /** Current search query value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchInput - Admin search input with consistent styling
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search job code..."
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
    </div>
  );
}

