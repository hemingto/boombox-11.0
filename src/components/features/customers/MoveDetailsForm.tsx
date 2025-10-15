/**
 * @fileoverview Form for collecting additional move details from customers including heavy items, storage duration, and access frequency.
 * @source boombox-10.0/src/app/components/user-page/movedetailspopupform.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * - Collects move details through a multi-field form with validation.
 * - Asks if customer is moving items over 100lbs (yes/no).
 * - Captures storage term duration (dropdown selection).
 * - Captures storage access frequency (dropdown selection).
 * - Collects descriptions of items and moving conditions (text areas).
 * - Validates all required fields before submission.
 * - Displays success message after successful submission.
 * - Supports click-outside-to-close behavior.
 *
 * API ROUTES UPDATED:
 * - Old: /api/appointments/${appointmentId}/addDetails → New: /api/orders/appointments/${appointmentId}/add-details
 *
 * DESIGN SYSTEM UPDATES:
 * - Uses Modal primitive for consistent modal behavior.
 * - Uses YesOrNoRadio from forms components.
 * - Uses Select primitive for dropdown selections.
 * - Uses semantic colors (e.g., bg-surface-primary, text-text-primary, border-border).
 * - Uses design system form styling and button classes.
 *
 * @refactor Migrated to boombox-11.0 customer features, integrated design system primitives, and updated API routes.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import { Select } from '@/components/ui/primitives/Select';

export interface MoveDetailsFormProps {
  appointmentId: number;
  onClose: () => void;
  onUpdateAppointment: (appointmentId: number) => void;
  isOpen: boolean;
}

export function MoveDetailsForm({
  appointmentId,
  onClose,
  onUpdateAppointment,
  isOpen,
}: MoveDetailsFormProps) {
  const [movingHeavyItems, setMovingHeavyItems] = useState<string | null>(null);
  const [itemDescription, setItemDescription] = useState<string>('');
  const [movingConditions, setMovingConditions] = useState<string>('');
  const [selectedAccessFrequency, setSelectedAccessFrequency] = useState<string>('');
  const [accessFrequencyError, setAccessFrequencyError] = useState<string | null>(null);
  const [yesOrNoError, setYesOrNoError] = useState<string | null>(null);
  const [selectedStorageTerm, setSelectedStorageTerm] = useState<string>('');
  const [storageTermError, setStorageTermError] = useState<string | null>(null);
  const [successMessageVisible, setSuccessMessageVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMovingHeavyItems(null);
      setItemDescription('');
      setMovingConditions('');
      setSelectedAccessFrequency('');
      setSelectedStorageTerm('');
      setYesOrNoError(null);
      setAccessFrequencyError(null);
      setStorageTermError(null);
      setSuccessMessageVisible(false);
    }
  }, [isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;

    if (!movingHeavyItems) {
      setYesOrNoError('Please select yes or no');
      isValid = false;
    }

    if (!selectedStorageTerm) {
      setStorageTermError('Please add a storage term');
      isValid = false;
    }

    if (!selectedAccessFrequency) {
      setAccessFrequencyError('Please choose storage access needed');
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);

    const formData = {
      itemsOver100lbs: movingHeavyItems === 'Yes',
      storageTerm: selectedStorageTerm,
      storageAccessFrequency: selectedAccessFrequency,
      moveDescription: itemDescription,
      conditionsDescription: movingConditions,
    };

    try {
      const response = await fetch(`/api/orders/appointments/${appointmentId}/add-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccessMessageVisible(true);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (successMessageVisible) {
      onUpdateAppointment(appointmentId);
    }
    onClose();
  };

  const storageTermOptions = [
    'Less than 1 month',
    '1-3 months',
    '3-6 months',
    '6-12 months',
    'More than 12 months',
    'Not sure, but more than 3 months',
  ];

  const accessOptions = [
    'Rarely (couple times a year)',
    'Occasionally (every few months)',
    'Frequently (every few weeks)',
  ];

  return (
    <Modal open={isOpen} onClose={handleClose} title="Tell us more about your move" size="md">
      <div className="p-6">
        {!successMessageVisible ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Yes/No Radio Buttons */}
            <div>
              <p className="font-medium mb-2">Are you moving any items over 100lbs?</p>
              <YesOrNoRadio
                value={movingHeavyItems}
                onChange={(value) => {
                  setMovingHeavyItems(value);
                  setYesOrNoError(null);
                }}
                hasError={!!yesOrNoError}
                errorMessage={yesOrNoError || ''}
                yesLabel="Yes"
                noLabel="No"
              />
            </div>

            {/* Storage Term */}
            <div>
              <label htmlFor="storage-term" className="block font-medium mb-2">
                How long do you plan on storing your items?
              </label>
              <Select
                id="storage-term"
                value={selectedStorageTerm}
                onChange={(value) => {
                  setSelectedStorageTerm(value);
                  setStorageTermError(null);
                }}
                error={storageTermError || undefined}
              >
                <option value="">Choose most likely storage term</option>
                {storageTermOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            {/* Access Frequency */}
            <div>
              <label htmlFor="access-frequency" className="block font-medium mb-2">
                How often will you need access to your storage unit?
              </label>
              <Select
                id="access-frequency"
                value={selectedAccessFrequency}
                onChange={(value) => {
                  setSelectedAccessFrequency(value);
                  setAccessFrequencyError(null);
                }}
                error={accessFrequencyError || undefined}
              >
                <option value="">Choose storage access needed</option>
                {accessOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            {/* Item Description */}
            <div>
              <label htmlFor="item-description" className="block font-medium mb-2">
                Provide a description of what you are moving?
              </label>
              <textarea
                id="item-description"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="List any larger items and provide a rough inventory..."
                className="w-full h-24 p-3 bg-surface-tertiary rounded-md text-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:bg-surface-primary focus:placeholder:text-text-primary focus:ring-2 focus:ring-primary border border-border"
              />
            </div>

            {/* Moving Conditions */}
            <div>
              <label htmlFor="moving-conditions" className="block font-medium mb-2">
                Provide a description of your moving conditions?
              </label>
              <textarea
                id="moving-conditions"
                value={movingConditions}
                onChange={(e) => setMovingConditions(e.target.value)}
                placeholder="Let us know if there are stairs, narrow hallways, or tough parking conditions..."
                className="w-full h-24 p-3 bg-surface-tertiary rounded-md text-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:bg-surface-primary focus:placeholder:text-text-primary focus:ring-2 focus:ring-primary border border-border"
              />
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-text-primary underline underline-offset-2 hover:text-text-secondary transition-colors"
                disabled={isSubmitting}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-text-inverse border-t-transparent mr-2"></div>
                    Submitting Details
                  </span>
                ) : (
                  'Add Details'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-10">
            <CheckCircleIcon className="text-status-success w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl text-text-primary font-bold mb-4">Thanks!</h3>
            <p className="text-text-secondary mb-10">
              We appreciate you sharing more information to make your move go as smoothly as
              possible.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

