/**
 * @fileoverview Driver assignment confirmation modal for admin tasks
 * @source boombox-10.0/src/app/components/admin/driver-assignment-modal.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Modal for confirming moving partner contact:
 * - Displays moving partner contact information
 * - Shows warning to call moving partner
 * - Requires checkbox confirmation before proceeding
 * - Validates confirmation before allowing completion
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal component from design system
 * - Replaced hardcoded colors with semantic tokens
 * - Used status-bg-error for warning banner
 * - Replaced indigo-600 with primary color
 * - Consistent button styling with btn-primary
 * - Used surface and text tokens throughout
 * 
 * @refactor Migrated from boombox-10.0, updated with design system Modal and colors
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

interface MovingPartner {
  name: string;
  email: string;
  phoneNumber: string;
}

interface DriverAssignmentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Moving partner to contact */
  movingPartner: MovingPartner | null;
  /** Job code to reference */
  jobCode?: string;
  /** Appointment ID */
  appointmentId?: number;
  /** Callback when completed */
  onComplete?: (appointmentId: number, calledMovingPartner: boolean) => Promise<void>;
}

/**
 * DriverAssignmentModal - Modal for confirming moving partner has been contacted
 * 
 * @example
 * ```tsx
 * <DriverAssignmentModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   movingPartner={movingPartner}
 *   jobCode="BXP-12345"
 *   appointmentId={123}
 *   onComplete={handleComplete}
 * />
 * ```
 */
export function DriverAssignmentModal({
  isOpen,
  onClose,
  movingPartner,
  jobCode,
  appointmentId,
  onComplete,
}: DriverAssignmentModalProps) {
  const [calledMovingPartner, setCalledMovingPartner] = useState(false);
  const [showError, setShowError] = useState(false);

  if (!movingPartner) return null;

  const handleComplete = async () => {
    if (!calledMovingPartner) {
      setShowError(true);
      return;
    }

    if (appointmentId && onComplete) {
      await onComplete(appointmentId, calledMovingPartner);
      onClose();
    }
  };

  const handleClose = () => {
    setCalledMovingPartner(false);
    setShowError(false);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Moving Partner Details"
      size="md"
    >
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-status-bg-error border border-border-error p-4 rounded-md">
          <p className="text-sm text-status-error">
            Call the moving partner to make sure they assign a driver to this job in Onfleet
          </p>
        </div>

        {/* Moving Partner Information */}
        <div className="space-y-4 bg-surface-tertiary p-4 rounded-md">
          {jobCode && (
            <div>
              <h4 className="text-sm font-medium text-text-secondary">Job Code</h4>
              <p className="mt-1 text-sm text-text-primary">{jobCode}</p>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-text-secondary">Name</h4>
            <p className="mt-1 text-sm text-text-primary">{movingPartner.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary">Email</h4>
            <p className="mt-1 text-sm text-text-primary">{movingPartner.email}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-text-secondary">Phone Number</h4>
            <p className="mt-1 text-sm text-text-primary">{movingPartner.phoneNumber}</p>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div>
          <div className="flex items-center">
            <input
              id="called-moving-partner"
              name="called-moving-partner"
              type="checkbox"
              checked={calledMovingPartner}
              onChange={(e) => {
                setCalledMovingPartner(e.target.checked);
                setShowError(false);
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              aria-describedby={showError ? 'checkbox-error' : undefined}
            />
            <label htmlFor="called-moving-partner" className="ml-2 block text-sm text-text-primary">
              Called Moving Partner
            </label>
          </div>
          {showError && (
            <p id="checkbox-error" className="form-error">
              Please confirm you have called the moving partner before proceeding.
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5 sm:mt-6">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleComplete}
            aria-label="Mark task as complete"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

