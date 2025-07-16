/**
 * @fileoverview Status utilities for consistent badge styling
 * @source boombox-10.0 status color functions
 * @refactor Consolidated status management
 */

export const StatusColors = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  unknown: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Get status color classes
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/\s+/g, '_') as keyof typeof StatusColors;
  return StatusColors[normalizedStatus] || StatusColors.unknown;
}
