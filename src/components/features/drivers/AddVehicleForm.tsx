/**
 * @fileoverview Add Vehicle Form component for drivers and movers
 * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Comprehensive vehicle registration form with photo uploads, form validation,
 * and API integration. Supports both driver and mover user types with proper
 * routing to different API endpoints. Features drag-and-drop photo uploads,
 * real-time validation, and loading states.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/upload/photos → New: /api/uploads/photos (for drivers)
 * - Old: /api/movers/${userId}/upload-vehicle-photos → New: /api/moving-partners/[id]/upload-vehicle-photos
 * - Old: /api/drivers/${userId}/vehicle → New: /api/drivers/[id]/vehicle
 * - Old: /api/movers/${userId}/vehicle → New: /api/moving-partners/[id]/vehicle
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens throughout (text-status-error, bg-surface-tertiary, etc.)
 * - Used form utility classes (form-label, form-error, btn-primary) for consistent styling
 * - Replaced hardcoded colors with design system tokens
 * - Enhanced loading states with LoadingOverlay component
 * - Applied consistent spacing and responsive patterns
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added comprehensive ARIA labels and semantic HTML structure
 * - Implemented proper heading hierarchy (h2 for sections)
 * - Added live regions for error announcements
 * - Enhanced keyboard navigation with focus management
 * - Screen reader optimized form feedback and validation messages
 * 
 * @refactor Complete architectural modernization: extracted useState hooks to useAddVehicleForm hook,
 * integrated with design system components (Input, Select, YesOrNoRadio, PhotoUploads),
 * separated business logic into VehicleService, added comprehensive accessibility,
 * and enhanced error handling with real-time feedback.
 */

'use client';

import React from 'react';
import { PhotoIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

// UI Components
import { Input, Select, LoadingOverlay } from '@/components/ui';
import { YesOrNoRadio, PhotoUploads } from '@/components/forms';

// Hooks and utilities
import { 
  useAddVehicleForm, 
  VEHICLE_MAKES, 
  YEAR_OPTIONS,
  type UseAddVehicleFormOptions 
} from '@/hooks/useAddVehicleForm';
import { cn } from '@/lib/utils/cn';

export interface AddVehicleFormProps extends UseAddVehicleFormOptions {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Add Vehicle Form component with comprehensive validation and photo uploads
 * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx
 */
export function AddVehicleForm({ 
  userId, 
  userType, 
  onSuccess,
  className 
}: AddVehicleFormProps) {
  const {
    formData,
    errors,
    photos,
    isSubmitting,
    updateField,
    updatePhoto,
    clearError,
    handleSubmit,
  } = useAddVehicleForm({ userId, userType, onSuccess });

  // Photo upload handlers
  const handleFrontPhotoSelected = (files: File[]) => {
    if (files.length > 0) {
      updatePhoto('frontVehiclePhoto', files[0]);
    }
  };

  const handleBackPhotoSelected = (files: File[]) => {
    if (files.length > 0) {
      updatePhoto('backVehiclePhoto', files[0]);
    }
  };

  const handleInsurancePhotoSelected = (files: File[]) => {
    if (files.length > 0) {
      updatePhoto('autoInsurancePhoto', files[0]);
    }
  };

  return (
    <div className={cn(
      "flex-col max-w-2xl bg-surface-primary rounded-md shadow-custom-shadow mx-4 sm:mx-auto p-6 sm:p-10 sm:mb-48 mb-24",
      className
    )}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <LoadingOverlay visible={isSubmitting} message="Adding your vehicle..." />
      )}
      
      <h2 className="mb-6 text-text-primary">Provide your vehicle information</h2>
      
      {/* Global Error Message */}
      {errors.submit && (
        <div 
          className="mb-4 p-3 bg-status-bg-error text-status-error rounded-md"
          role="alert"
          aria-live="polite"
        >
          {errors.submit}
        </div>
      )}

      {/* Vehicle Information Section */}
      <section aria-labelledby="vehicle-info-heading">
        <h3 
          id="vehicle-info-heading" 
          className="form-label mb-4 mt-4"
        >
          What&apos;s your vehicle&apos;s year, make and model?
        </h3>

        {/* Vehicle Year */}
        <div className="form-group">
          <Select
            label="Vehicle Year"
            value={formData.year || ''}
            onChange={(value: string) => updateField('year', value)}
            error={errors.year || undefined}
            onClearError={() => clearError('year')}
            options={YEAR_OPTIONS.map(year => ({ value: year, label: year }))}
            placeholder="Select year"
            required
            aria-describedby={errors.year ? 'year-error' : undefined}
          />
          {errors.year && (
            <p 
              id="year-error"
              className="form-error"
              role="alert"
            >
              {errors.year}
            </p>
          )}
        </div>
        
        {/* Vehicle Make */}
        <div className="form-group">
          <Select
            label="Vehicle Make"
            value={formData.make || ''}
            onChange={(value: string) => updateField('make', value)}
            error={errors.make || undefined}
            onClearError={() => clearError('make')}
            options={VEHICLE_MAKES.map(make => ({ value: make, label: make }))}
            placeholder="Select make"
            required
            aria-describedby={errors.make ? 'make-error' : undefined}
          />
          {errors.make && (
            <p 
              id="make-error"
              className="form-error"
              role="alert"
            >
              {errors.make}
            </p>
          )}
        </div>
        
        {/* Vehicle Model */}
        <div className="form-group">
          <Input
            label="Vehicle Model"
            value={formData.model}
            onChange={(e) => updateField('model', e.target.value)}
            error={errors.model || undefined}
            onClearError={() => clearError('model')}
            placeholder="e.g., Camry, F-150"
            required
            aria-describedby={errors.model ? 'model-error' : undefined}
          />
        </div>
      </section>

      {/* License Plate Section */}
      <section aria-labelledby="license-plate-heading">
        <h3 
          id="license-plate-heading" 
          className="form-label mb-4 mt-4"
        >
          What is your vehicle&apos;s license plate number?
        </h3>
        
        <div className="form-group">
          <Input
            label="License Plate Number"
            value={formData.licensePlate}
            onChange={(e) => updateField('licensePlate', e.target.value)}
            error={errors.licensePlate || undefined}
            onClearError={() => clearError('licensePlate')}
            placeholder="Enter your license plate number"
            required
            aria-describedby={errors.licensePlate ? 'license-plate-error' : undefined}
          />
        </div>
      </section>

      {/* Trailer Hitch Section */}
      <section aria-labelledby="trailer-hitch-heading">
        <h3 
          id="trailer-hitch-heading" 
          className="form-label mb-4 mt-4"
        >
          Does your vehicle have a trailer hitch?
        </h3>
        
        <div className="form-group">
          <YesOrNoRadio
            value={formData.hasTrailerHitch}
            onChange={(value) => updateField('hasTrailerHitch', value)}
            hasError={!!errors.trailerHitch}
            errorMessage={errors.trailerHitch || undefined}
            name="trailer-hitch"
          />
        </div>
      </section>

      {/* Vehicle Photos Section */}
      <section aria-labelledby="vehicle-photos-heading">
        <h2 
          id="vehicle-photos-heading"
          className="mb-6 mt-8 text-text-primary"
        >
          Provide front and back photos of your vehicle
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="w-full">
            <PhotoUploads 
              onPhotosSelected={handleFrontPhotoSelected} 
              photoUploadTitle="Front of Vehicle Photo"
              buttonText="Add Front Photo"
              icon={<PhotoIcon className="w-16 h-16 text-slate-200 mb-1" />}
              maxPhotos={1}
              entityId={userId}
              entityType={userType}
            />
          </div>
          
          <div className="w-full">
            <PhotoUploads 
              onPhotosSelected={handleBackPhotoSelected} 
              photoUploadTitle="Back of Vehicle Photo"
              buttonText="Add Back Photo"
              icon={<PhotoIcon className="w-16 h-16 text-slate-200 mb-1" />}
              maxPhotos={1}
              entityId={userId}
              entityType={userType}
            />
          </div>
        </div>

        {/* Photo Guidelines */}
        <div className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-tertiary border border-border rounded-md max-w-fit">
          <p className="text-sm text-text-primary">
            Make sure the license plate number is clearly visible in the photos.
          </p>
          <p className="text-sm mt-2 text-text-primary">
            To view examples of acceptable vehicle photos click{' '}
            <button 
              type="button"
              className="underline cursor-pointer font-semibold text-primary hover:text-primary-hover focus:text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="View examples of acceptable vehicle photos"
            >
              here
            </button>
          </p>
        </div>
      </section>
      
      {/* Insurance Document Section */}
      <section aria-labelledby="insurance-heading">
        <h2 
          id="insurance-heading"
          className="mb-6 mt-8 text-text-primary"
        >
          Provide vehicle&apos;s auto insurance
        </h2>
        
        <div className="w-full">
          <PhotoUploads 
            onPhotosSelected={handleInsurancePhotoSelected} 
            photoUploadTitle="Auto Insurance Document"
            buttonText="Add Insurance Document"
            icon={<DocumentArrowDownIcon className="w-16 h-16 text-slate-200 mb-1" />}
            aspectRatio="aspect-video"
            maxPhotos={1}
            entityId={userId}
            entityType={userType}
          />
        </div>

        {/* Insurance Guidelines */}
        <div className="mt-4 p-3 sm:mb-4 mb-2 bg-surface-tertiary border border-border rounded-md max-w-fit">
          <p className="text-sm text-text-primary">
            Make sure the photo is clear, text should not be blurry.
          </p>
          <p className="text-sm mt-2 text-text-primary">
            To view an example of acceptable auto insurance photos click{' '}
            <button 
              type="button"
              className="underline cursor-pointer font-semibold text-primary hover:text-primary-hover focus:text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="View examples of acceptable auto insurance photos"
            >
              here
            </button>
          </p>
        </div>
      </section>
      
      {/* Submit Button */}
      <div className="mt-12">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
          aria-describedby="submit-button-description"
        >
          {isSubmitting ? 'Adding Vehicle...' : 'Add Vehicle'}
        </button>
        <p 
          id="submit-button-description"
          className="sr-only"
        >
          Submit the vehicle information form to add your vehicle to your account
        </p>
      </div>
    </div>
  );
}

export default AddVehicleForm;
