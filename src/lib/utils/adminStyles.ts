/**
 * @fileoverview Shared styling utilities for admin pages
 * 
 * FUNCTIONALITY:
 * - Centralized color mappings for status badges
 * - Row background colors based on status
 * - Consistent badge and button styling across admin portal
 * 
 * DESIGN:
 * - Uses boombox-10.0 color patterns (indigo, cyan, amber, purple, emerald, red)
 * - Direct Tailwind classes (no design system tokens)
 * - Status-based visual feedback
 */

/**
 * Job/Appointment Status Badge Colors
 * Used for appointment status badges
 */
export const getStatusBadgeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-cyan-200 text-cyan-700';
    case 'in transit':
      return 'bg-amber-200 text-amber-700';
    case 'awaiting admin check in':
      return 'bg-purple-200 text-purple-700';
    case 'complete':
      return 'bg-emerald-200 text-emerald-700';
    case 'canceled':
    case 'cancelled':
      return 'bg-red-200 text-red-700';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

/**
 * Job/Appointment Row Background Colors
 * Used for table row backgrounds based on appointment status
 */
export const getRowColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-cyan-50';
    case 'in transit':
      return 'bg-amber-50';
    case 'awaiting admin check in':
      return 'bg-purple-50';
    case 'complete':
      return 'bg-emerald-50';
    case 'canceled':
    case 'cancelled':
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

/**
 * Route Status Badge Colors
 * Used for delivery route status badges
 */
export const getRouteStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'in_progress':
      return 'bg-cyan-200 text-cyan-700';
    case 'completed':
      return 'bg-emerald-200 text-emerald-700';
    case 'failed':
      return 'bg-red-200 text-red-700';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

/**
 * Payout Status Badge Colors
 * Used for payout status badges
 */
export const getPayoutStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-amber-200 text-amber-700';
    case 'processing':
      return 'bg-cyan-200 text-cyan-700';
    case 'completed':
      return 'bg-emerald-200 text-emerald-700';
    case 'failed':
      return 'bg-red-200 text-red-700';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

/**
 * Storage Unit Status Badge Colors
 * Used for storage unit status badges
 */
export const getStorageUnitStatusColor = (status: string): string => {
  switch (status) {
    case 'Empty':
      return 'bg-emerald-200 text-emerald-700';
    case 'Occupied':
      return 'bg-cyan-200 text-cyan-700';
    case 'Pending Cleaning':
      return 'bg-red-200 text-red-700';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

/**
 * Boolean Status Display (Yes/No badges)
 * Used for approval status, verification flags, etc.
 */
export const getBooleanBadgeColor = (value: boolean): string => {
  return value 
    ? 'bg-emerald-200 text-emerald-700' 
    : 'bg-red-200 text-red-700';
};

/**
 * Stock Status Badge Colors
 * Used for inventory stock status
 */
export const getStockStatusColor = (isOutOfStock: boolean): string => {
  return isOutOfStock
    ? 'bg-red-200 text-red-700'
    : 'bg-emerald-200 text-emerald-700';
};

/**
 * Admin Button Classes
 * Reusable button styling for admin actions
 */
export const adminButtonClasses = {
  // Primary action button (indigo)
  primary: 'inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto',
  
  // Secondary action button (white with border)
  secondary: 'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto',
  
  // View/Info button (indigo background)
  viewRecord: 'inline-flex items-center bg-indigo-50 px-2.5 py-1 text-sm font-inter rounded-md font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 hover:bg-indigo-100',
  
  // Unassigned/Error state button (red)
  unassigned: 'inline-flex items-center bg-red-50 px-2.5 py-1 text-sm rounded-md font-medium font-inter text-red-700 ring-1 ring-inset ring-red-700/10 hover:bg-red-100',
  
  // Warning state button (amber)
  warning: 'inline-flex items-center bg-amber-50 px-2.5 py-1 text-sm rounded-md font-medium font-inter text-amber-700 ring-1 ring-inset ring-amber-700/10 hover:bg-amber-100',
  
  // Success/Complete state button (green)
  success: 'inline-flex items-center bg-green-50 px-2.5 py-1 text-sm rounded-md font-medium font-inter text-green-700 ring-1 ring-inset ring-green-700/10 hover:bg-green-100',
};

/**
 * Admin Filter Dropdown Classes
 * Consistent styling for filter dropdowns
 */
export const adminFilterClasses = {
  button: 'inline-flex items-center text-sm gap-x-1.5 rounded-md bg-white px-3 py-2.5 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
  dropdown: 'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
  checkbox: 'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600',
};

