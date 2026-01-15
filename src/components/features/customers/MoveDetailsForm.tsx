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
import { Button } from '@/components/ui/primitives/Button';

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
 const [currentStep, setCurrentStep] = useState<number>(1);
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
   setCurrentStep(1);
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

 const handleNextStep = (e: React.FormEvent) => {
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

  if (isValid) {
   setCurrentStep(2);
  }
 };

 const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

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
  { value: 'Less than 1 month', label: 'Less than 1 month' },
  { value: '1-3 months', label: '1-3 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: 'More than 12 months', label: 'More than 12 months' },
  { value: 'Not sure, but more than 3 months', label: 'Not sure, but more than 3 months' },
 ];

 const accessOptions = [
  { value: 'Rarely (couple times a year)', label: 'Rarely (couple times a year)' },
  { value: 'Occasionally (every few months)', label: 'Occasionally (every few months)' },
  { value: 'Frequently (every few weeks)', label: 'Frequently (every few weeks)' },
 ];

 return (
  <Modal 
   open={isOpen} 
   onClose={handleClose} 
   title={successMessageVisible ? "" : "Tell us more about your move"} 
   size="md"
  >
   {!successMessageVisible ? (
    <>
     {/* Step 1: Basic Information */}
     {currentStep === 1 && (
      <form onSubmit={handleNextStep} className="space-y-6 px-1 pt-2">

       {/* Storage Term */}
       <div>
        <Select
         id="storage-term"
         label="How long do you plan on storing your items?"
         size="sm"
         value={selectedStorageTerm}
         onChange={(value) => {
          setSelectedStorageTerm(value);
          setStorageTermError(null);
         }}
         error={storageTermError || undefined}
         placeholder="Select an option"
         options={storageTermOptions}
         fullWidth
        />
       </div>

       {/* Access Frequency */}
       <div>
        <Select
         id="access-frequency"
         label="How often will you need access to your storage unit?"
         value={selectedAccessFrequency}
         size="sm"
         onChange={(value) => {
          setSelectedAccessFrequency(value);
          setAccessFrequencyError(null);
         }}
         error={accessFrequencyError || undefined}
         placeholder="Select an option"
         options={accessOptions}
         fullWidth
        />
       </div>

        {/* Yes/No Radio Buttons */}
        <div>
        <p className="mb-4">Are you moving any items over 100lbs?</p>
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

       {/* Action Buttons */}
       <div className="flex justify-end gap-4 pt-2 pb-1">
        <Button type="button" onClick={handleClose} variant="ghost" size="sm">
         Close
        </Button>
        <Button type="submit" variant="primary" size="md">
         Next
        </Button>
       </div>
      </form>
     )}

     {/* Step 2: Detailed Descriptions */}
     {currentStep === 2 && (
      <form onSubmit={handleFormSubmit} className="space-y-6 px-1">
       {/* Item Description */}
       <div>
        <label htmlFor="item-description" className="block mb-2">
         Provide a description of what you are moving?
        </label>
        <textarea
         id="item-description"
         value={itemDescription}
         onChange={(e) => setItemDescription(e.target.value)}
         placeholder="List any larger items and provide a rough inventory..."
         className="w-full h-24 p-3 bg-surface-tertiary rounded-md text-sm placeholder:text-text-secondary resize-none focus:outline-none focus:bg-surface-primary focus:placeholder:text-text-primary focus:ring-2 focus:ring-primary border border-border"
        />
       </div>

       {/* Moving Conditions */}
       <div>
        <label htmlFor="moving-conditions" className="block mb-2">
         Provide a description of your moving conditions?
        </label>
        <textarea
         id="moving-conditions"
         value={movingConditions}
         onChange={(e) => setMovingConditions(e.target.value)}
         placeholder="Let us know if there are stairs, narrow hallways, or tough parking conditions..."
         className="w-full h-24 p-3 bg-surface-tertiary rounded-md text-sm placeholder:text-text-secondary resize-none focus:outline-none focus:bg-surface-primary focus:placeholder:text-text-primary focus:ring-2 focus:ring-primary border border-border"
        />
       </div>

       {/* Action Buttons */}
       <div className="flex justify-between gap-4 pt-2 pb-1">
        <Button
         type="button"
         onClick={() => setCurrentStep(1)}
         variant="ghost"
         size="sm"
         disabled={isSubmitting}
        >
         Back
        </Button>
        <div className="flex gap-4">
         <Button
          type="button"
          onClick={handleClose}
          variant="ghost"
          size="sm"
          disabled={isSubmitting}
         >
          Close
         </Button>
         <Button
          type="submit"
          variant="primary"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
         >
          {isSubmitting ? 'Submitting Details' : 'Add Details'}
         </Button>
        </div>
       </div>
      </form>
     )}
    </>
   ) : (
    <div className="text-center py-10">
     <CheckCircleIcon className="text-status-success w-16 h-16 mx-auto mb-4" />
     <h3 className="text-2xl text-text-primary font-bold mb-4">Thanks!</h3>
     <p className="text-text-primary mb-10">
      We appreciate you sharing more information to make your move go as smoothly as
      possible.
     </p>
    </div>
   )}
  </Modal>
 );
}

