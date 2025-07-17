/**
 * @fileoverview Status badge colors and status management utilities
 * @source boombox-10.0/src/app/admin/delivery-routes/page.tsx (getStatusColor, getPayoutStatusColor)
 * @refactor Consolidated all status color logic and added status management utilities
 */

/**
 * Status color mapping for consistent badge styling across the app
 */
export const StatusColors = {
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
 * Get Tailwind CSS classes for status badge based on status string
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status
    .toLowerCase()
    .replace(/\s+/g, '_') as keyof typeof StatusColors;
  return StatusColors[normalizedStatus] || StatusColors.unknown;
}

/**
 * Get specific payout status colors (enhanced from delivery routes)
 */
export function getPayoutStatusColor(status: string): string {
  const payoutStatusMap: Record<string, string> = {
    pending: StatusColors.pending,
    processing: StatusColors.processing,
    completed: StatusColors.completed,
    failed: StatusColors.failed,
    cancelled: StatusColors.cancelled,
  };

  const normalizedStatus = status.toLowerCase();
  return payoutStatusMap[normalizedStatus] || StatusColors.unknown;
}

/**
 * Get appointment status colors
 */
export function getAppointmentStatusColor(status: string): string {
  const appointmentStatusMap: Record<string, string> = {
    scheduled: StatusColors.scheduled,
    confirmed: StatusColors.confirmed,
    in_progress: StatusColors.in_progress,
    completed: StatusColors.completed,
    cancelled: StatusColors.cancelled,
  };

  const normalizedStatus = status.toLowerCase();
  return appointmentStatusMap[normalizedStatus] || StatusColors.unknown;
}

/**
 * Get driver status colors
 */
export function getDriverStatusColor(status: string): string {
  const driverStatusMap: Record<string, string> = {
    available: StatusColors.available,
    busy: StatusColors.busy,
    offline: StatusColors.offline,
    active: StatusColors.active,
    inactive: StatusColors.inactive,
  };

  const normalizedStatus = status.toLowerCase();
  return driverStatusMap[normalizedStatus] || StatusColors.unknown;
}

/**
 * Get payment status colors
 */
export function getPaymentStatusColor(status: string): string {
  const paymentStatusMap: Record<string, string> = {
    paid: StatusColors.paid,
    unpaid: StatusColors.unpaid,
    pending: StatusColors.pending,
    failed: StatusColors.failed,
    refunded: StatusColors.refunded,
    processing: StatusColors.processing,
  };

  const normalizedStatus = status.toLowerCase();
  return paymentStatusMap[normalizedStatus] || StatusColors.unknown;
}

/**
 * Status priority for sorting (higher number = higher priority)
 */
export const StatusPriority: Record<string, number> = {
  failed: 10,
  cancelled: 9,
  pending: 8,
  in_progress: 7,
  processing: 6,
  assigned: 5,
  scheduled: 4,
  confirmed: 3,
  started: 2,
  completed: 1,
  delivered: 1,
  paid: 1,
  active: 3,
  available: 3,
  busy: 5,
  offline: 8,
  inactive: 9,
};

/**
 * Sort items by status priority
 */
export function sortByStatusPriority<T extends { status: string }>(
  items: T[]
): T[] {
  return items.sort((a, b) => {
    const priorityA = StatusPriority[a.status.toLowerCase()] || 0;
    const priorityB = StatusPriority[b.status.toLowerCase()] || 0;
    return priorityB - priorityA; // Higher priority first
  });
}

/**
 * Check if status indicates an active/in-progress state
 */
export function isActiveStatus(status: string): boolean {
  const activeStatuses = [
    'in_progress',
    'processing',
    'assigned',
    'started',
    'active',
    'busy',
  ];
  return activeStatuses.includes(status.toLowerCase().replace(/\s+/g, '_'));
}

/**
 * Check if status indicates a completed state
 */
export function isCompletedStatus(status: string): boolean {
  const completedStatuses = ['completed', 'delivered', 'paid'];
  return completedStatuses.includes(status.toLowerCase());
}

/**
 * Check if status indicates a failed/error state
 */
export function isErrorStatus(status: string): boolean {
  const errorStatuses = ['failed', 'cancelled', 'unpaid'];
  return errorStatuses.includes(status.toLowerCase());
}

/**
 * Check if status indicates a pending state
 */
export function isPendingStatus(status: string): boolean {
  const pendingStatuses = ['pending', 'scheduled', 'confirmed'];
  return pendingStatuses.includes(status.toLowerCase());
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
