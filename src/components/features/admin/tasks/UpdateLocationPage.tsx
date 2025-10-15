/**
 * @fileoverview Admin task page for updating storage unit warehouse location
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/update-location/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays storage unit information for location update
 * - Allows admin to input and update warehouse location
 * - Validates location input before submission
 * - Redirects to tasks page after successful update
 * 
 * API ROUTES USED:
 * - PATCH /api/admin/tasks/[taskId]/update-location - Update warehouse location
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-success)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded emerald colors with status-success variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useTask } from '@/hooks';

interface UpdateLocationPageProps {
  taskId: string;
}

export function UpdateLocationPage({ taskId }: UpdateLocationPageProps) {
  const router = useRouter();
  const { task, isLoading, error } = useTask(taskId);
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!warehouseLocation.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}/update-location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouseLocation: warehouseLocation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error updating warehouse location:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
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

  if (error || !task) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-status-error">Error loading task. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{task.title}</h1>
            <p className="text-text-primary mt-1 text-sm">{task.description}</p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            {/* Storage Unit Info Card */}
            <div className="bg-status-success rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-status-success-hover rounded-full p-3">
                  <CubeIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-white text-lg font-semibold">
                    {task.storageUnitNumber}
                  </h4>
                  <p className="text-white/90 text-sm">storage unit #</p>
                </div>
              </div>
            </div>

            {/* Mark location of storage unit */}
            <div className="mt-8">
              <h2 className="font-semibold text-lg mb-6 text-text-primary">Mark location of storage unit</h2>
              
              <div className="mb-6 max-w-lg">
                <label htmlFor="location" className="form-label">
                  What is the warehouse location of {task.storageUnitNumber}?
                </label>
                <input
                  id="location"
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="Enter warehouse location"
                  className="input-field"
                  aria-label="Warehouse location input"
                />
              </div>

              <div className="flex justify-end mt-20">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !warehouseLocation.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Set warehouse location"
                >
                  {isSubmitting ? 'Submitting...' : 'Set Location'}
                </button>
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
    </div>
  );
}

