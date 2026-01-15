/**
 * @fileoverview Onfleet tasks viewer modal for admin pages
 * @source boombox-10.0/src/app/components/admin/onfleet-tasks-modal.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Modal for displaying Onfleet tasks associated with appointments:
 * - Shows table of tasks with step number, task ID, and short ID
 * - Read-only view of Onfleet task information
 * - Used in Jobs management page
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal component from design system
 * - Replaced hardcoded colors with semantic tokens
 * - Uses text-text-primary and text-text-secondary
 * - Uses border color tokens for table
 * - Replaced indigo-600 with primary color for button
 * - Consistent table styling
 * 
 * @refactor Migrated from boombox-10.0, updated with design system Modal and colors
 */

'use client';

import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface OnfleetTask {
  taskId: string;
  shortId: string;
  stepNumber: number;
}

interface OnfleetTasksModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Array of Onfleet tasks to display */
  tasks: OnfleetTask[];
}

/**
 * OnfleetTasksModal - Modal for viewing Onfleet tasks
 * 
 * @example
 * ```tsx
 * <OnfleetTasksModal
 *   isOpen={showTasksModal}
 *   onClose={() => setShowTasksModal(false)}
 *   tasks={onfleetTasks}
 * />
 * ```
 */
export function OnfleetTasksModal({ isOpen, onClose, tasks }: OnfleetTasksModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Onfleet Tasks"
      size="lg"
    >
      <div className="mt-4">
        {tasks.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            No Onfleet tasks found for this appointment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border bg-surface-tertiary">
              <thead className="bg-surface-tertiary p-1">
                <tr>
                  <th 
                    scope="col" 
                    className="py-3.5 pr-3 pl-1 text-left text-sm font-semibold text-text-primary"
                  >
                    Step Number
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-left text-sm font-semibold text-text-primary"
                  >
                    Task ID
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-left text-sm font-semibold text-text-primary"
                  >
                    Short ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface-primary">
                {tasks.map((task) => (
                  <tr key={task.taskId}>
                    <td className="whitespace-nowrap pl-1 py-4 pr-3 text-sm text-text-primary">
                      {task.stepNumber}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary font-mono">
                      {task.taskId}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-text-secondary">
                      {task.shortId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5 sm:mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="btn-primary"
          aria-label="Close modal"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

