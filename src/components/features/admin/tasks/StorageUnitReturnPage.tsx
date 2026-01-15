/**
 * @fileoverview Admin task page for processing storage unit returns
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/storage-unit-return/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays storage unit and appointment information
 * - Handles different appointment types with conditional questions
 * - Records damage reports with photos and descriptions
 * - Tracks unit status based on appointment type
 * 
 * API ROUTES USED:
 * - GET /api/admin/tasks/[taskId] - Fetch task data
 * - POST /api/upload/damage-photos - Upload damage photos
 * - PATCH /api/admin/tasks/storage-unit-return/[appointmentId] - Update appointment
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-pending)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded purple colors with status-pending variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, PhotoIcon, CalendarDaysIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useTask } from '@/hooks';
import { Button } from '@/components/ui/primitives/Button';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import PhotoUploads from '@/components/forms/PhotoUploads';

interface StorageUnitReturnPageProps {
 taskId: string;
}

// Custom labels for Initial Pickup / Additional Storage question
const UNIT_OCCUPIED_LABEL = "Yes, it's occupied";
const UNIT_EMPTY_LABEL = "No, it's empty";

export function StorageUnitReturnPage({ taskId }: StorageUnitReturnPageProps) {
 const router = useRouter();
 const { task, isLoading } = useTask(taskId);
 const [hasDamage, setHasDamage] = useState<string | null>(null);
 const [damageDescription, setDamageDescription] = useState('');
 const [files, setFiles] = useState<Record<string, File>>({});
 const [showError, setShowError] = useState(false);
 const [showPhotoError, setShowPhotoError] = useState(false);
 const [showDescriptionError, setShowDescriptionError] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitError, setSubmitError] = useState<string | null>(null);
 const [isStillStoringItems, setIsStillStoringItems] = useState<string | null>(null);
 const [isAllItemsRemoved, setIsAllItemsRemoved] = useState<string | null>(null);
 const [unitStorageStatus, setUnitStorageStatus] = useState<string | null>(null);
 const [showStoringItemsError, setShowStoringItemsError] = useState(false);
 const [showAllItemsRemovedError, setShowAllItemsRemovedError] = useState(false);
 const [showUnitStorageError, setShowUnitStorageError] = useState(false);

 const handleFileCapture = (fieldName: string, file: File) => {
  setFiles((prev) => ({
   ...prev,
   [fieldName]: file,
  }));
 };

 const handleFrontPhotosSelected = (files: File[]) => {
  if (files.length > 0) {
   handleFileCapture('damagePhoto1', files[0]);
  }
 };

 const handleBackPhotosSelected = (files: File[]) => {
  if (files.length > 0) {
   handleFileCapture('damagePhoto2', files[0]);
  }
 };

 const handleUpdate = async () => {
  setSubmitError(null);

  if (!hasDamage) {
   setShowError(true);
   return;
  }

  const appointmentType = task?.appointment?.appointmentType;

  // Validate fields based on appointment type
  if (appointmentType === 'Storage Unit Access' && isStillStoringItems === null) {
   setShowStoringItemsError(true);
   return;
  }

  if (appointmentType === 'End Storage Term' && isAllItemsRemoved === null) {
   setShowAllItemsRemovedError(true);
   return;
  }

  if (
   (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') &&
   unitStorageStatus === null
  ) {
   setShowUnitStorageError(true);
   return;
  }

  // Only validate photos and description if damage is reported
  if (hasDamage === 'Yes') {
   const hasPhotos = Object.keys(files).length > 0;
   const hasDescription = damageDescription.trim().length > 0;

   if (!hasPhotos) {
    setShowPhotoError(true);
   }
   if (!hasDescription) {
    setShowDescriptionError(true);
   }

   if (!hasPhotos || !hasDescription) {
    return;
   }
  }

  if (task?.appointmentId) {
   setIsSubmitting(true);
   try {
    // First upload all photos to Cloudinary
    const photoUrls: Record<string, string> = {};

    // Only upload photos if damage is reported
    if (hasDamage === 'Yes' && Object.keys(files).length > 0) {
     // Upload files sequentially
     for (const [fieldName, file] of Object.entries(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('photoDescription', fieldName === 'damagePhoto1' ? 'damage1' : 'damage2');

      const uploadResponse = await fetch('/api/upload/damage-photos', {
       method: 'POST',
       body: formData,
      });

      if (!uploadResponse.ok) {
       const errorData = await uploadResponse.json();
       throw new Error(`Failed to upload ${fieldName}: ${errorData.error || 'Unknown error'}`);
      }

      const uploadData = await uploadResponse.json();
      photoUrls[fieldName] = uploadData.urls[0]; // Get the first URL from the array
     }
    }

    // Prepare request body based on appointment type
    const requestBody: any = {
     hasDamage: hasDamage === 'Yes',
     damageDescription: hasDamage === 'Yes' ? damageDescription : null,
     frontPhotos: hasDamage === 'Yes' ? [photoUrls['damagePhoto1']] : [],
     backPhotos: hasDamage === 'Yes' ? [photoUrls['damagePhoto2']] : [],
    };

    // Add type-specific fields
    if (appointmentType === 'Storage Unit Access') {
     requestBody.isStillStoringItems = isStillStoringItems === 'Yes';
    }

    if (appointmentType === 'End Storage Term') {
     requestBody.isAllItemsRemoved = isAllItemsRemoved === 'Yes';
    }

    if (appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') {
     // "No, it's empty" means isUnitEmpty = true (unit wasn't used, needs cleaning)
     // "Yes, it's occupied" means isUnitEmpty = false (unit has customer items)
     requestBody.isUnitEmpty = unitStorageStatus === UNIT_EMPTY_LABEL;
    }

    // Update appointment and create damage report if needed
    const response = await fetch(
     `/api/admin/tasks/storage-unit-return/${task.appointmentId}`,
     {
      method: 'PATCH',
      headers: {
       'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
     }
    );

    if (!response.ok) {
     const errorData = await response.json().catch(() => null);
     throw new Error(errorData?.message || 'Failed to update appointment');
    }

    router.push('/admin/tasks');
   } catch (error) {
    console.error('Error updating appointment:', error);
    setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
   } finally {
    setIsSubmitting(false);
   }
  }
 };

 if (isLoading) {
  return (
   <div className="min-h-screen p-4">
    <div className="max-w-4xl mx-auto">
     <div className="animate-pulse">
      <div className="h-8 bg-surface-tertiary rounded w-1/3 mb-4"></div>
      <div className="space-y-4">
       <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
       <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
      </div>
     </div>
    </div>
   </div>
  );
 }

 if (!task) {
  return (
   <div className="min-h-screen p-4">
    <div className="max-w-4xl mx-auto">
     <div className="text-center">
      <h1 className="text-2xl font-semibold text-text-primary">Task not found</h1>
      <p className="mt-2 text-text-secondary">The requested task could not be found.</p>
     </div>
    </div>
   </div>
  );
 }

 const appointmentType = task?.appointment?.appointmentType;

 return (
  <div className="mt-4 mb-20">
   <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header with back button */}
    <div className="flex items-center gap-4 mb-6">
     <button
      onClick={() => router.back()}
      className="flex items-center text-text-primary hover:text-text-secondary"
      aria-label="Go back"
     >
      <ChevronLeftIcon className="h-6 w-6" />
     </button>
     <div>
      <h1 className="text-xl font-semibold text-text-primary">{task.title}</h1>
      <p className="text-text-primary mt-1 text-sm">{task.description}</p>
     </div>
    </div>

    <div className="bg-surface-primary rounded-lg shadow-sm">
     <div className="p-6 space-y-6">
      {/* Storage Unit Info Card */}
      <div className="bg-purple-600 rounded-lg p-6">
       <div className="flex justify-between">
        <div className="flex items-center gap-3">
         <div className="bg-purple-700 rounded-full p-3">
          <CubeIcon className="h-6 w-6 text-white" aria-hidden="true" />
         </div>
         <div>
          <h4 className="text-white text-lg font-semibold">{task.storageUnitNumber}</h4>
          <p className="text-white/90 text-sm">storage unit #</p>
         </div>
        </div>

        <div className="flex items-center gap-3 mr-6">
         <div className="bg-purple-700 rounded-full p-3">
          <CalendarDaysIcon className="h-6 w-6 text-white" />
         </div>
         <div>
          <h4 className="text-white text-lg font-semibold">{task.appointment?.appointmentType}</h4>
          <p className="text-white/90 text-xs">appointment type</p>
         </div>
        </div>
       </div>
      </div>

      {/* Job Details Grid */}
      <div
       className={`grid gap-6 border-b border-border pb-6 ${
        task.movingPartner ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
       }`}
      >
       <div className="border-r border-border pr-4">
        <h3 className="font-medium text-text-primary font-semibold">Job Code</h3>
        <p className="mt-1 text-sm text-text-primary">{task.jobCode}</p>
       </div>
       <div className="sm:border-r border-border pr-4">
        <h3 className="font-medium text-text-primary font-semibold">Customer</h3>
        <p className="mt-1 text-sm text-text-primary">{task.customerName}</p>
       </div>
       {task.movingPartner && (
        <div className="border-r border-border pr-4">
         <h3 className="font-medium text-text-primary font-semibold">Moving Partner</h3>
         <p className="mt-1 text-sm text-text-primary">{task.movingPartner.name}</p>
        </div>
       )}
       <div className="pr-4">
        <h3 className="font-medium text-text-primary font-semibold">Driver</h3>
        <p className="mt-1 text-sm text-text-primary">
         {task.driver
          ? `${task.driver.firstName} ${task.driver.lastName}`
          : 'No driver'}
        </p>
       </div>
      </div>

      <h3 className="font-medium text-text-primary font-semibold mb-6">Check back in storage unit</h3>

      {/* Initial Pickup and Additional Storage - Did customer use the unit question */}
      {(appointmentType === 'Initial Pickup' || appointmentType === 'Additional Storage') && (
       <div>
        <p className="text-text-primary mb-4">Is {task.storageUnitNumber} storing customer items?</p>
        <YesOrNoRadio
         value={unitStorageStatus}
         onChange={(value) => {
          setUnitStorageStatus(value);
          setShowUnitStorageError(false);
         }}
         yesLabel={UNIT_OCCUPIED_LABEL}
         noLabel={UNIT_EMPTY_LABEL}
         hasError={showUnitStorageError}
        />
        {showUnitStorageError && <p className="form-error">Please indicate if the customer used this unit</p>}
       </div>
      )}

      <div>
       <div className="space-y-8">
        {/* Storage Unit Access - Is customer still storing items question */}
        {appointmentType === 'Storage Unit Access' && (
         <div>
          <p className="text-text-primary mb-4">
           Is {task.customerName} still storing items in unit {task.storageUnitNumber}?
          </p>
          <YesOrNoRadio
           value={isStillStoringItems}
           onChange={(value) => {
            setIsStillStoringItems(value);
            setShowStoringItemsError(false);
           }}
           hasError={showStoringItemsError}
          />
          {showStoringItemsError && (
           <p className="form-error">Please indicate if the customer is still storing items</p>
          )}
         </div>
        )}

        {/* End Storage Term - Did customer remove all items question */}
        {appointmentType === 'End Storage Term' && (
         <div>
          <p className="text-text-primary mb-4">
           Did {task.customerName} remove all items from unit {task.storageUnitNumber}?
          </p>
          <YesOrNoRadio
           value={isAllItemsRemoved}
           onChange={(value) => {
            setIsAllItemsRemoved(value);
            setShowAllItemsRemovedError(false);
           }}
           hasError={showAllItemsRemovedError}
          />
          {showAllItemsRemovedError && (
           <p className="form-error">Please indicate if all items were removed</p>
          )}
         </div>
        )}

        <div>
         <p className="text-text-primary mb-4">Any damage to the trailer or storage unit?</p>
         <YesOrNoRadio
          value={hasDamage}
          onChange={(value) => {
           setHasDamage(value);
           setShowError(false);
          }}
          hasError={showError && !hasDamage}
         />
         {showError && !hasDamage && (
          <p className="form-error">Please indicate if there is any damage</p>
         )}
        </div>

        <div
         className={`overflow-hidden transition-all duration-300 ease-in-out ${
          hasDamage === 'Yes' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
         }`}
        >
         <div className="space-y-8">
          <div>
           <p className="text-text-primary mb-4">Add photos of damage</p>
           <div className="grid grid-cols-2 gap-4">
            <div>
             <PhotoUploads
              icon={<PhotoIcon className="text-text-tertiary h-10 w-10" />}
              photoUploadTitle="Damage Photo 1"
              buttonText="Add Photo"
              onPhotosSelected={handleFrontPhotosSelected}
              maxPhotos={1}
              photoDescription="damage1"
             />
            </div>
            <div>
             <PhotoUploads
              icon={<PhotoIcon className="text-text-tertiary h-10 w-10" />}
              photoUploadTitle="Damage Photo 2"
              buttonText="Add Photo"
              onPhotosSelected={handleBackPhotosSelected}
              maxPhotos={1}
              photoDescription="damage2"
             />
            </div>
           </div>
           {showPhotoError && (
            <p className="form-error">Please add at least one photo of the damage</p>
           )}
          </div>

          <div>
           <textarea
            value={damageDescription}
            onChange={(e) => {
             setDamageDescription(e.target.value);
             setShowDescriptionError(false);
            }}
            className={`input-field h-32 ${showDescriptionError ? 'input-field--error' : ''}`}
            placeholder="Describe the damage..."
            aria-invalid={showDescriptionError}
            aria-describedby={showDescriptionError ? 'damage-error' : undefined}
           />
           {showDescriptionError && (
            <p id="damage-error" className="form-error">
             Please provide a description of the damage
            </p>
           )}
          </div>
         </div>
        </div>
       </div>
      </div>

      {/* Update Button */}
      <div className="flex justify-end pt-4">
       <Button
        type="button"
        onClick={handleUpdate}
        loading={isSubmitting}
        variant="primary"
        className="!bg-purple-600 hover:!bg-purple-500 active:!bg-purple-500 disabled:!bg-purple-600"
        aria-label="Submit storage unit return"
       >
        Submit
       </Button>
      </div>

      {submitError && (
       <div className="mt-4 p-4 bg-status-bg-error border border-border-error rounded-md">
        <p className="text-sm text-status-error">{submitError}</p>
       </div>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

