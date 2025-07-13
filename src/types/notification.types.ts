/**
 * @fileoverview Notification domain types
 * @source boombox-11.0/prisma/schema.prisma (Notification model)
 * @refactor Notification system types
 */

// Placeholder for notification types - to be implemented in future phases
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
}

export type NotificationStatus = 'unread' | 'read' | 'archived';
