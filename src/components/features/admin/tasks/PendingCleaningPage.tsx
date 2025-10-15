/**
 * @fileoverview Admin task page for managing storage unit cleaning workflow
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/pending-cleaning/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays storage unit information requiring cleaning
 * - Allows admin to confirm unit was cleaned
 * - Requires photo upload of cleaned unit interior
 * - Marks unit as clean and available after completion
 * 
 * API ROUTES USED:
 * - GET /api/admin/tasks/[taskId] - Fetch task and storage unit data
 * - POST /api/upload/cleaning-photos - Upload cleaning photos to Cloudinary
 * - POST /api/admin/storage-units/mark-clean - Mark unit as clean
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-info)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded cyan colors with status-info variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, PhotoIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useTask } from '@/hooks';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import PhotoUploads from '@/components/forms/PhotoUploads';

interface PendingCleaningPageProps {
  taskId: string;
}

export function PendingCleaningPage({ taskId }: PendingCleaningPageProps) {
  const router = useRouter();
  const { task, isLoading } = useTask(taskId);
  const [didCleanUnit, setDidCleanUnit] = useState<string | null>(null);
  const [cleaningPhotos, setCleaningPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePhotoChange = (files: File[]) => {
    setCleaningPhotos(files);
    setPhotoError(null);
  };

  const handleMarkAsClean = async () => {
    // Validate unit was cleaned
    if (didCleanUnit !== 'Yes') {
      setShowError(true);
      return;
    }

    // Validate photo is added
    if (cleaningPhotos.length === 0) {
      setPhotoError('Please add a photo of the cleaned storage unit');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Extract the storage unit ID from the task ID
      // Format: cleaning-{storageUnitId}
      const storageUnitId = parseInt(taskId.split('-')[1]);

      if (isNaN(storageUnitId)) {
        throw new Error('Invalid storage unit ID');
      }

      // 2. Upload each photo directly during form submission
      const uploadedUrls: string[] = [];
      const storageUnitNumber = task?.storageUnitNumber || 'unknown';

      for (const photo of cleaningPhotos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('storageUnitNumber', storageUnitNumber);

        const uploadResponse = await fetch(`/api/upload/cleaning-photos`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload photo: ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        uploadedUrls.push(uploadData.url);
      }

      // 3. Submit the cleaning record with the uploaded photo URLs
      const response = await fetch(`/api/admin/storage-units/mark-clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storageUnitId,
          photos: uploadedUrls,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark storage unit as clean');
      }

      // Redirect back to tasks
      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error marking unit as clean:', error);
      setPhotoError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-tertiary rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
              <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
              <div className="h-4 bg-surface-tertiary rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary">Task not found</h1>
            <p className="mt-2 text-text-secondary">The requested task could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Pending Cleaning</h1>
            <p className="text-text-primary mt-1 text-sm">
              Clean storage unit, touch up any paint, and take picture of inside
            </p>
          </div>
        </div>

        <div className="bg-surface-primary rounded-lg shadow-sm">
          <div className="p-6 space-y-10">
            {/* Storage Unit Card */}
            <div className="bg-status-bg-info rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative bg-status-info rounded-full h-12 w-12 overflow-hidden flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-semibold">{task.storageUnitNumber}</h4>
                    <p className="text-white/90 text-sm">storage unit #</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Information */}
            <div>
              <h3 className="font-medium text-text-primary font-semibold">
                Touch up exterior paint, and clean interior of unit
              </h3>
              <div className="mt-8">
                <p className="mb-4 text-sm text-text-primary">
                  Did you clean storage unit {task.storageUnitNumber}?
                </p>
                <YesOrNoRadio
                  value={didCleanUnit}
                  onChange={setDidCleanUnit}
                  hasError={showError && !didCleanUnit}
                />
                {showError && !didCleanUnit && (
                  <p className="form-error">Please confirm if you cleaned the unit</p>
                )}
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-4 pb-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Take photo of clean unit</h3>
                <div className="mt-4 max-w-md">
                  <PhotoUploads
                    photoUploadTitle="Photo of Clean Interior"
                    buttonText="Add Photo"
                    icon={<PhotoIcon className="w-10 h-10 text-text-tertiary" />}
                    directUpload={false}
                    onPhotosSelected={handlePhotoChange}
                    maxPhotos={1}
                  />
                  {photoError && <p className="form-error">{photoError}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleMarkAsClean}
                disabled={isSubmitting || didCleanUnit !== 'Yes' || cleaningPhotos.length === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Mark storage unit as clean"
              >
                {isSubmitting ? 'Submitting...' : 'Mark as Clean'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

