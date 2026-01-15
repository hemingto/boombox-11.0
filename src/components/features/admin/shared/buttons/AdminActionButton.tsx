/**
 * @fileoverview Action button component with semantic colors (gold standard)
 * @source Extracted from AdminJobsPage lines 593-648
 * 
 * COMPONENT FUNCTIONALITY:
 * - Semantic color variants (red, amber, green, indigo)
 * - Consistent styling with ring borders
 * - Font Inter for button text
 * - Hover states
 * - Optional onClick handler
 * 
 * DESIGN PATTERN:
 * - Uses AdminJobsPage gold standard semantic colors
 * - Red = urgent/unassigned (Driver Unassigned, Assign Unit)
 * - Amber = warning/incomplete (Incomplete assignments)
 * - Green = success/complete (Assigned units display)
 * - Indigo = info/view actions (View Records)
 * 
 * SEMANTIC MEANING:
 * - red-50/red-700: Urgent action needed
 * - amber-50/amber-700: Warning or partial completion
 * - green-50/green-700: Successful/complete state
 * - indigo-50/indigo-700: Informational action
 * 
 * @goldstandard This is the superior pattern from AdminJobsPage
 */

'use client';

import React from 'react';

type ButtonVariant = 'red' | 'amber' | 'green' | 'indigo';

interface AdminActionButtonProps {
  /** Button text/children */
  children: React.ReactNode;
  /** Semantic color variant */
  variant: ButtonVariant;
  /** Click handler */
  onClick?: () => void;
  /** Optional className for additional styling */
  className?: string;
  /** Optional disabled state */
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  red: 'bg-red-50 text-red-700 ring-red-700/10 hover:bg-red-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-700/10 hover:bg-amber-100',
  green: 'bg-green-50 text-green-700 ring-green-700/10 hover:bg-green-100',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10 hover:bg-indigo-100',
};

/**
 * AdminActionButton - Gold standard action button with semantic colors
 * 
 * @example
 * ```tsx
 * // Red - urgent action
 * <AdminActionButton variant="red" onClick={handleAssign}>
 *   Assign Unit
 * </AdminActionButton>
 * 
 * // Amber - warning
 * <AdminActionButton variant="amber" onClick={handleIncomplete}>
 *   Incomplete
 * </AdminActionButton>
 * 
 * // Green - success
 * <AdminActionButton variant="green" onClick={handleView}>
 *   A-101, A-102
 * </AdminActionButton>
 * 
 * // Indigo - info
 * <AdminActionButton variant="indigo" onClick={handleView}>
 *   View Records
 * </AdminActionButton>
 * ```
 */
export function AdminActionButton({
  children,
  variant,
  onClick,
  className = '',
  disabled = false,
}: AdminActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center px-2.5 py-1 text-sm rounded-md font-medium font-inter ring-1 ring-inset ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

