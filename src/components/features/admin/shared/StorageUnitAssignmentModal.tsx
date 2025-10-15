/**
 * @fileoverview Storage unit assignment modal for admin tasks
 * @source boombox-10.0/src/app/components/admin/storage-unit-assignment-modal.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Modal for assigning multiple storage units to appointments:
 * - Displays selector for each required unit
 * - Validates all units are selected
 * - Prevents duplicate unit selections
 * - Shows loading state during assignment
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal component from design system
 * - Replaced hardcoded colors with semantic tokens
 * - Uses btn-primary and btn-secondary for actions
 * - Consistent button styling and states
 * - Updated StorageUnitSelector import
 * 
 * @refactor Migrated from boombox-10.0, updated with design system Modal and colors
 */

'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { StorageUnitSelector } from './StorageUnitSelector';

interface StorageUnitAssignmentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Appointment ID for the assignment */
  appointmentId: number;
  /** Number of units to assign */
  numberOfUnits: number;
  /** Currently assigned unit numbers */
  currentAssignments?: string[];
  /** Callback when units are assigned */
  onAssign: (unitNumbers: string[]) => Promise<void>;
}

/**
 * StorageUnitAssignmentModal - Modal for assigning storage units to appointments
 * 
 * @example
 * ```tsx
 * <StorageUnitAssignmentModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   appointmentId={123}
 *   numberOfUnits={2}
 *   currentAssignments={['BX-001', 'BX-002']}
 *   onAssign={handleAssignUnits}
 * />
 * ```
 */
export function StorageUnitAssignmentModal({ 
  isOpen, 
  onClose, 
  appointmentId, 
  numberOfUnits,
  currentAssignments = [],
  onAssign 
}: StorageUnitAssignmentModalProps) {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(currentAssignments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnitSelect = (index: number, value: string) => {
    const newSelectedUnits = [...selectedUnits];
    newSelectedUnits[index] = value;
    setSelectedUnits(newSelectedUnits);
    setError(null);
  };

  const validateSelection = (): boolean => {
    if (selectedUnits.length !== numberOfUnits) {
      setError('Please select all required units');
      return false;
    }

    const uniqueUnits = new Set(selectedUnits.filter(u => u));
    if (uniqueUnits.size !== selectedUnits.length) {
      setError('Please select unique units (no duplicates)');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateSelection()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onAssign(selectedUnits);
      onClose();
    } catch (error) {
      console.error('Error assigning storage units:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign units');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUnits(currentAssignments);
    setError(null);
    onClose();
  };

  const isSubmitDisabled = 
    loading || 
    selectedUnits.length !== numberOfUnits || 
    new Set(selectedUnits.filter(u => u)).size !== numberOfUnits;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Assign Storage Units"
      size="md"
    >
      <div className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-status-bg-error p-4">
            <p className="text-sm text-status-error">{error}</p>
          </div>
        )}

        {/* Unit Selectors */}
        <div className="space-y-3">
          {Array.from({ length: numberOfUnits }).map((_, index) => (
            <StorageUnitSelector
              key={index}
              label={`Unit ${index + 1}`}
              value={selectedUnits[index] || ''}
              onChange={(value) => handleUnitSelect(index, value)}
              disabled={loading}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary w-full sm:w-auto"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="btn-primary w-full sm:w-auto"
            aria-label="Assign storage units"
          >
            {loading ? 'Assigning...' : 'Assign Units'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

