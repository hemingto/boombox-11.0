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
 * STYLING:
 * - Uses Headless UI Dialog component
 * - Indigo-600 primary button colors
 * - Matches boombox-10.0 admin portal styling
 * 
 * @refactor Uses boombox-10.0 modal styling patterns
 */

'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
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

  const handleUnitSelect = (index: number, value: string) => {
    const newSelectedUnits = [...selectedUnits];
    newSelectedUnits[index] = value;
    setSelectedUnits(newSelectedUnits);
  };

  const handleSubmit = async () => {
    if (selectedUnits.length !== numberOfUnits || new Set(selectedUnits).size !== selectedUnits.length) {
      return; // Don't submit if not all units are selected or if there are duplicates
    }

    setLoading(true);
    try {
      await onAssign(selectedUnits);
      onClose();
    } catch (error) {
      console.error('Error assigning storage units:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in w-[95%] max-w-lg sm:my-8 sm:w-full sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <DialogTitle as="h3" className="mt-4 mb-6 text-lg font-semibold leading-6 text-gray-900">
                  Assign Storage Units
                </DialogTitle>
                
                <div className="mt-4 space-y-2">
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
              </div>
            </div>

            <div className="mt-12 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || selectedUnits.length !== numberOfUnits || new Set(selectedUnits).size !== selectedUnits.length}
                className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
              >
                {loading ? 'Assigning...' : 'Assign Units'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

