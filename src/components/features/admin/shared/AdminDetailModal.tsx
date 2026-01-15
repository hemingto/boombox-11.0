/**
 * @fileoverview Generic modal for viewing nested record details in admin tables
 * @source Extracted pattern from boombox-10.0 admin management pages
 * 
 * COMPONENT FUNCTIONALITY:
 * Reusable modal for displaying nested record details:
 * - Generic content rendering via render prop
 * - Displays title and data
 * - Responsive sizing
 * - Handles empty data states
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal component from design system
 * - Semantic colors for text and backgrounds
 * - Consistent spacing and layout
 * - Proper accessibility with focus management
 * 
 * @refactor Extracted from inline modal implementations across 10+ management pages
 */

'use client';

import React from 'react';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface AdminDetailModalProps<T = any> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Title displayed in modal header */
  title: string;
  /** Data to display in the modal */
  data: T | null;
  /** Render function for modal content */
  renderContent: (data: T) => React.ReactNode;
  /** Optional size override (default: 'md') */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Optional empty state message */
  emptyMessage?: string;
}

/**
 * AdminDetailModal - Generic modal for displaying nested record details
 * 
 * @example
 * ```tsx
 * <AdminDetailModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Driver Appointments"
 *   data={selectedDriver?.appointments}
 *   renderContent={(appointments) => (
 *     <div>
 *       {appointments.map(apt => (
 *         <div key={apt.id}>{apt.jobCode}</div>
 *       ))}
 *     </div>
 *   )}
 * />
 * ```
 */
export function AdminDetailModal<T = any>({
  isOpen,
  onClose,
  title,
  data,
  renderContent,
  size = 'md',
  emptyMessage = 'No data available',
}: AdminDetailModalProps<T>) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={title}
      size={size}
    >
      <div className="py-4">
        {data ? (
          renderContent(data)
        ) : (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

