/**
 * @fileoverview Status badge colors and status management utilities
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx (getStatusColor, getPayoutStatusColor)
 * @refactor Consolidated all status color logic and added status management utilities
 * Updated to use design token classes for consistency and maintainability
 */

/**
 * Status color mapping for consistent badge styling across the app
 * Now uses design token classes for better maintainability
 */
export const StatusColors = {
  // General status colors - using design token classes
  pending: 'badge-pending',
  in_progress: 'badge-processing',
  completed: 'badge-success',
  failed: 'badge-error',
  cancelled: 'badge-error',
  active: 'badge-success',
  inactive: 'badge-error',
  processing: 'badge-processing',

  // Appointment specific
  scheduled: 'badge-info',
  confirmed: 'badge-success',

  // Payment specific
  paid: 'badge-success',
  unpaid: 'badge-error',
  refunded: 'badge-warning',

  // Driver specific
  available: 'badge-success',
  busy: 'badge-warning',
  offline: 'badge-error',

  // Task specific
  assigned: 'badge-info',
  started: 'badge-processing',
  delivered: 'badge-success',

  // Default
  unknown: 'badge-info',
} as const;

/**
 * Legacy status colors for backward compatibility during migration
 * @deprecated Use StatusColors instead
 */
export const LegacyStatusColors = {
  // General status colors
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',

  // Appointment specific
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',

  // Payment specific
  paid: 'bg-emerald-100 text-emerald-800',
  unpaid: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',

  // Driver specific
  available: 'bg-green-100 text-green-800',
  busy: 'bg-amber-100 text-amber-800',
  offline: 'bg-gray-100 text-gray-800',

  // Task specific
  assigned: 'bg-blue-100 text-blue-800',
  started: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',

  // Default
  unknown: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Status type definitions
 */
export type StatusType = keyof typeof StatusColors;

/**
 * Get badge class for a status using the design token system
 */
export function getStatusBadgeClass(status: string): string {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/\s+/g, '_') as StatusType;
  return StatusColors[normalizedStatus] || StatusColors.unknown;
}

/**
 * Get legacy badge class for backward compatibility
 * @deprecated Use getStatusBadgeClass instead
 */
export function getLegacyStatusBadgeClass(status: string): string {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/\s+/g, '_') as StatusType;
  return LegacyStatusColors[normalizedStatus] || LegacyStatusColors.unknown;
}

/**
 * Status badge component helper
 */
export interface StatusBadgeProps {
  status: string;
  className?: string;
  useLegacy?: boolean;
}

/**
 * Get the appropriate CSS classes for a status badge
 */
export function getStatusClasses({
  status,
  className = '',
  useLegacy = false,
}: StatusBadgeProps): string {
  const badgeClass = useLegacy
    ? getLegacyStatusBadgeClass(status)
    : getStatusBadgeClass(status);
  return `${badgeClass} ${className}`.trim();
}

/**
 * Status priority for sorting (higher number = higher priority)
 */
export const StatusPriority: Record<string, number> = {
  failed: 5,
  error: 5,
  cancelled: 4,
  pending: 3,
  processing: 2,
  in_progress: 2,
  completed: 1,
  delivered: 1,
  success: 1,
  unknown: 0,
} as const;

/**
 * Get status priority for sorting
 */
export function getStatusPriority(status: string): number {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  return StatusPriority[normalizedStatus] || 0;
}

/**
 * Sort statuses by priority (highest priority first)
 */
export function sortByStatusPriority<T extends { status: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => getStatusPriority(b.status) - getStatusPriority(a.status)
  );
}

/**
 * Check if a status indicates completion
 */
export function isCompletedStatus(status: string): boolean {
  const completedStatuses = [
    'completed',
    'delivered',
    'paid',
    'success',
    'confirmed',
  ];
  return completedStatuses.includes(status.toLowerCase());
}

/**
 * Check if a status indicates an error or failure
 */
export function isErrorStatus(status: string): boolean {
  const errorStatuses = ['failed', 'error', 'cancelled', 'unpaid', 'offline'];
  return errorStatuses.includes(status.toLowerCase());
}

/**
 * Check if a status indicates pending or in-progress
 */
export function isPendingStatus(status: string): boolean {
  const pendingStatuses = [
    'pending',
    'processing',
    'in_progress',
    'assigned',
    'started',
    'busy',
  ];
  return pendingStatuses.includes(status.toLowerCase().replace(/\s+/g, '_'));
}

/**
 * Get human-readable status text
 */
export function formatStatusText(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Status transition validation
 */
export const StatusTransitions: Record<string, string[]> = {
  pending: ['in_progress', 'cancelled'],
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'failed', 'cancelled'],
  processing: ['completed', 'failed'],
  assigned: ['started', 'cancelled'],
  started: ['completed', 'failed'],
  completed: [], // Terminal state
  failed: ['pending', 'in_progress'], // Can retry
  cancelled: [], // Terminal state
  delivered: [], // Terminal state
  paid: ['refunded'], // Can be refunded
  unpaid: ['paid', 'cancelled'],
};

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions =
    StatusTransitions[currentStatus.toLowerCase()] || [];
  return allowedTransitions.includes(newStatus.toLowerCase());
}

/**
 * Get next possible statuses for current status
 */
export function getNextPossibleStatuses(currentStatus: string): string[] {
  return StatusTransitions[currentStatus.toLowerCase()] || [];
}
