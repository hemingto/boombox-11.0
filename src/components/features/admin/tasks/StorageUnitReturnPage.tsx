/**
 * @fileoverview Admin task page for processing per-unit storage unit returns
 *
 * COMPONENT FUNCTIONALITY:
 * - Displays storage unit and appointment information for a single unit
 * - Asks three unified questions: storing items, damage, padlock
 * - Shows confirmation modal when marking a unit as empty (affects billing)
 * - Shows billing notice when processing the last unit for an appointment
 *
 * API ROUTES USED:
 * - GET /api/admin/tasks/[taskId] - Fetch task data
 * - POST /api/upload/damage-photos - Upload damage photos
 * - PATCH /api/admin/tasks/storage-unit-return/[appointmentId] - Process per-unit return
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  PhotoIcon,
  CalendarDaysIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useTask } from '@/hooks';
import { Button } from '@/components/ui/primitives/Button';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import PhotoUploads from '@/components/forms/PhotoUploads';

interface StorageUnitReturnPageProps {
  taskId: string;
}

export function StorageUnitReturnPage({ taskId }: StorageUnitReturnPageProps) {
  const router = useRouter();
  const { task, isLoading } = useTask(taskId);

  // Q1: Is unit storing customer items?
  const [isStoringItems, setIsStoringItems] = useState<string | null>(null);
  const [showStoringError, setShowStoringError] = useState(false);
  const [showEmptyConfirmModal, setShowEmptyConfirmModal] = useState(false);
  const [emptyConfirmed, setEmptyConfirmed] = useState(false);

  // Q2: Damage
  const [hasDamage, setHasDamage] = useState<string | null>(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [showDamageError, setShowDamageError] = useState(false);
  const [showPhotoError, setShowPhotoError] = useState(false);
  const [showDescriptionError, setShowDescriptionError] = useState(false);

  // Q3: Padlock
  const [hasPadlock, setHasPadlock] = useState<string | null>(null);
  const [showPadlockError, setShowPadlockError] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileCapture = useCallback((fieldName: string, file: File) => {
    setFiles(prev => ({ ...prev, [fieldName]: file }));
  }, []);

  const handleFrontPhotosSelected = useCallback(
    (photos: File[]) => {
      if (photos.length > 0) handleFileCapture('damagePhoto1', photos[0]);
    },
    [handleFileCapture]
  );

  const handleBackPhotosSelected = useCallback(
    (photos: File[]) => {
      if (photos.length > 0) handleFileCapture('damagePhoto2', photos[0]);
    },
    [handleFileCapture]
  );

  const handleStoringItemsChange = (value: string) => {
    setIsStoringItems(value);
    setShowStoringError(false);

    if (value === 'No' && !emptyConfirmed) {
      setShowEmptyConfirmModal(true);
    }
  };

  const handleConfirmEmpty = () => {
    setEmptyConfirmed(true);
    setShowEmptyConfirmModal(false);
  };

  const handleCancelEmpty = () => {
    setIsStoringItems('Yes');
    setShowEmptyConfirmModal(false);
  };

  const handleUpdate = async () => {
    setSubmitError(null);

    // Validate all three questions
    let hasValidationError = false;

    if (isStoringItems === null) {
      setShowStoringError(true);
      hasValidationError = true;
    }

    if (hasDamage === null) {
      setShowDamageError(true);
      hasValidationError = true;
    }

    if (hasPadlock === null) {
      setShowPadlockError(true);
      hasValidationError = true;
    }

    if (hasValidationError) return;

    // If "No" to storing items and not yet confirmed, show modal
    if (isStoringItems === 'No' && !emptyConfirmed) {
      setShowEmptyConfirmModal(true);
      return;
    }

    // Validate damage photos/description if damage is reported
    if (hasDamage === 'Yes') {
      const hasPhotos = Object.keys(files).length > 0;
      const hasDescription = damageDescription.trim().length > 0;

      if (!hasPhotos) setShowPhotoError(true);
      if (!hasDescription) setShowDescriptionError(true);

      if (!hasPhotos || !hasDescription) return;
    }

    if (!task?.appointmentId || !task?.storageUnitId) return;

    setIsSubmitting(true);
    try {
      // Upload damage photos if needed
      const photoUrls: Record<string, string> = {};

      if (hasDamage === 'Yes' && Object.keys(files).length > 0) {
        for (const [fieldName, file] of Object.entries(files)) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append(
            'photoDescription',
            fieldName === 'damagePhoto1' ? 'damage1' : 'damage2'
          );

          const uploadResponse = await fetch('/api/upload/damage-photos', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(
              `Failed to upload ${fieldName}: ${errorData.error || 'Unknown error'}`
            );
          }

          const uploadData = await uploadResponse.json();
          photoUrls[fieldName] = uploadData.urls[0];
        }
      }

      const requestBody = {
        storageUnitId: parseInt(task.storageUnitId, 10),
        isStoringItems: isStoringItems === 'Yes',
        hasDamage: hasDamage === 'Yes',
        damageDescription: hasDamage === 'Yes' ? damageDescription : null,
        frontPhotos:
          hasDamage === 'Yes' && photoUrls['damagePhoto1']
            ? [photoUrls['damagePhoto1']]
            : [],
        backPhotos:
          hasDamage === 'Yes' && photoUrls['damagePhoto2']
            ? [photoUrls['damagePhoto2']]
            : [],
        padlockProvided: hasPadlock === 'Yes',
      };

      const response = await fetch(
        `/api/admin/tasks/storage-unit-return/${task.appointmentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to process unit return');
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error processing unit return:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-semibold text-text-primary">
              Task not found
            </h1>
            <p className="mt-2 text-text-secondary">
              The requested task could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isLastUnit = task.isLastUnit === true;

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {task.title}
            </h1>
            <p className="text-text-primary mt-1 text-sm">{task.description}</p>
          </div>
        </div>

        <div className="bg-surface-primary rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            {/* Unit Info Card */}
            <div className="bg-purple-600 rounded-lg p-6">
              <div className="flex justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-700 rounded-full p-3">
                    <CubeIcon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-semibold">
                      {task.storageUnitNumber}
                    </h4>
                    <p className="text-white/90 text-sm">storage unit #</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mr-6">
                  <div className="bg-purple-700 rounded-full p-3">
                    <CalendarDaysIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-semibold">
                      {task.appointment?.appointmentType}
                    </h4>
                    <p className="text-white/90 text-xs">appointment type</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Grid */}
            <div
              className={`grid gap-6 border-b border-border pb-6 ${
                task.movingPartner
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              <div className="border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold">
                  Job Code
                </h3>
                <p className="mt-1 text-sm text-text-primary">{task.jobCode}</p>
              </div>
              <div className="sm:border-r border-border pr-4">
                <h3 className="font-medium text-text-primary font-semibold">
                  Customer
                </h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.customerName}
                </p>
              </div>
              {task.movingPartner && (
                <div className="border-r border-border pr-4">
                  <h3 className="font-medium text-text-primary font-semibold">
                    Moving Partner
                  </h3>
                  <p className="mt-1 text-sm text-text-primary">
                    {task.movingPartner.name}
                  </p>
                </div>
              )}
              <div className="pr-4">
                <h3 className="font-medium text-text-primary font-semibold">
                  Driver
                </h3>
                <p className="mt-1 text-sm text-text-primary">
                  {task.driver
                    ? `${task.driver.firstName} ${task.driver.lastName}`
                    : 'No driver'}
                </p>
              </div>
            </div>

            <h3 className="font-medium text-text-primary font-semibold mb-6">
              Check back in storage unit {task.storageUnitNumber}
            </h3>

            <div className="space-y-8">
              {/* Q1: Storing customer items? */}
              <div>
                <p className="text-text-primary mb-4">
                  Is {task.storageUnitNumber} storing customer items?
                </p>
                <YesOrNoRadio
                  value={isStoringItems}
                  onChange={handleStoringItemsChange}
                  hasError={showStoringError}
                />
                {showStoringError && (
                  <p className="form-error">
                    Please indicate if this unit is storing customer items
                  </p>
                )}
                {isStoringItems === 'No' && emptyConfirmed && (
                  <p className="mt-2 text-sm text-amber-600">
                    Confirmed empty — billing will be adjusted when all units
                    are processed.
                  </p>
                )}
              </div>

              {/* Q2: Damage */}
              <div>
                <p className="text-text-primary mb-4">
                  Any damage to the trailer or storage unit?
                </p>
                <YesOrNoRadio
                  value={hasDamage}
                  onChange={value => {
                    setHasDamage(value);
                    setShowDamageError(false);
                  }}
                  hasError={showDamageError && !hasDamage}
                />
                {showDamageError && !hasDamage && (
                  <p className="form-error">
                    Please indicate if there is any damage
                  </p>
                )}

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    hasDamage === 'Yes'
                      ? 'max-h-[1000px] opacity-100 mt-6'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-8">
                    <div>
                      <p className="text-text-primary mb-4">
                        Add photos of damage
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <PhotoUploads
                            icon={
                              <PhotoIcon className="text-text-tertiary h-10 w-10" />
                            }
                            photoUploadTitle="Damage Photo 1"
                            buttonText="Add Photo"
                            onPhotosSelected={handleFrontPhotosSelected}
                            maxPhotos={1}
                            photoDescription="damage1"
                          />
                        </div>
                        <div>
                          <PhotoUploads
                            icon={
                              <PhotoIcon className="text-text-tertiary h-10 w-10" />
                            }
                            photoUploadTitle="Damage Photo 2"
                            buttonText="Add Photo"
                            onPhotosSelected={handleBackPhotosSelected}
                            maxPhotos={1}
                            photoDescription="damage2"
                          />
                        </div>
                      </div>
                      {showPhotoError && (
                        <p className="form-error">
                          Please add at least one photo of the damage
                        </p>
                      )}
                    </div>

                    <div>
                      <textarea
                        value={damageDescription}
                        onChange={e => {
                          setDamageDescription(e.target.value);
                          setShowDescriptionError(false);
                        }}
                        className={`input-field h-32 ${showDescriptionError ? 'input-field--error' : ''}`}
                        placeholder="Describe the damage..."
                        aria-invalid={showDescriptionError}
                        aria-describedby={
                          showDescriptionError ? 'damage-error' : undefined
                        }
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

              {/* Q3: Padlock */}
              <div>
                <p className="text-text-primary mb-4">
                  Boombox padlock on this unit?
                </p>
                <YesOrNoRadio
                  value={hasPadlock}
                  onChange={value => {
                    setHasPadlock(value);
                    setShowPadlockError(false);
                  }}
                  hasError={showPadlockError}
                />
                {showPadlockError && (
                  <p className="form-error">
                    Please indicate if there is a Boombox padlock on this unit
                  </p>
                )}
                {hasPadlock === 'Yes' && (
                  <p className="mt-2 text-sm text-text-secondary">
                    Customer will be charged $35 for the padlock.
                  </p>
                )}
              </div>
            </div>

            {/* Last unit billing notice */}
            {isLastUnit && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  This is the last unit for this appointment. Submitting will
                  finalize billing — including any padlock charges, refunds for
                  empty units, and subscription adjustments.
                </p>
              </div>
            )}

            {/* Submit */}
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

      {/* Confirmation Modal — marking unit as empty */}
      {showEmptyConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCancelEmpty}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-empty-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h3
                  id="confirm-empty-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  Confirm unit is empty
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Marking this unit as empty affects the customer&apos;s
                  billing. An empty unit will trigger a refund or subscription
                  adjustment when all units for this appointment are processed.
                </p>
                <p className="mt-2 text-sm font-medium text-text-primary">
                  Please verify that {task.storageUnitNumber} has no customer
                  items before confirming.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancelEmpty}
              >
                Go Back
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!bg-amber-600 hover:!bg-amber-500"
                onClick={handleConfirmEmpty}
              >
                Confirm Empty
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
