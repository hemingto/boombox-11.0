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

import React, { useRef } from 'react';
import Link from 'next/link';
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

  // Refs for each form field to enable scrolling to errors
  const yearRef = useRef<HTMLDivElement>(null);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const licensePlateRef = useRef<HTMLDivElement>(null);
  const trailerHitchRef = useRef<HTMLDivElement>(null);
  const frontPhotoRef = useRef<HTMLDivElement>(null);
  const backPhotoRef = useRef<HTMLDivElement>(null);
  const insurancePhotoRef = useRef<HTMLDivElement>(null);

  // Map error field names to refs
  const errorFieldRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    year: yearRef,
    make: makeRef,
    model: modelRef,
    licensePlate: licensePlateRef,
    trailerHitch: trailerHitchRef,
    frontVehiclePhoto: frontPhotoRef,
    backVehiclePhoto: backPhotoRef,
    autoInsurancePhoto: insurancePhotoRef,
  };

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

  // Form submit handler with scroll-to-error functionality
  const handleFormSubmit = async () => {
    const firstErrorField = await handleSubmit();
    if (firstErrorField && errorFieldRefs[firstErrorField]?.current) {
      errorFieldRefs[firstErrorField].current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
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

        {/* Vehicle Year */}
        <div className="form-group mb-4" ref={yearRef}>
          <Select
            label="Vehicle Year"
            size="sm"
            value={formData.year || ''}
            onChange={(value: string) => updateField('year', value)}
            error={errors.year || undefined}
            onClearError={() => clearError('year')}
            options={YEAR_OPTIONS.map(year => ({ value: year, label: year }))}
            placeholder="Select year"
            required
            compactLabel
            name="year"
          />
        </div>
        
        {/* Vehicle Make */}
        <div className="form-group mb-4" ref={makeRef}>
          <Select
            label="Vehicle Make"
            size="sm"
            value={formData.make || ''}
            onChange={(value: string) => updateField('make', value)}
            error={errors.make || undefined}
            onClearError={() => clearError('make')}
            options={VEHICLE_MAKES.map(make => ({ value: make, label: make }))}
            placeholder="Select make"
            required
            compactLabel
            name="make"
          />
        </div>
        
        {/* Vehicle Model */}
        <div className="form-group mb-8" ref={modelRef}>
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
        
        <div className="form-group mb-8" ref={licensePlateRef}>
          <Input
            label="What is your vehicle's license plate number?"
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
        
        <div className="form-group" ref={trailerHitchRef}>
          <YesOrNoRadio
            value={formData.hasTrailerHitch}
            onChange={(value) => updateField('hasTrailerHitch', value)}
            hasError={!!errors.trailerHitch}
            errorMessage={errors.trailerHitch || undefined}
            onErrorClear={() => clearError('trailerHitch')}
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
          <div className="w-full" ref={frontPhotoRef}>
            <PhotoUploads 
              onPhotosSelected={handleFrontPhotoSelected} 
              photoUploadTitle="Front of Vehicle Photo"
              buttonText="Add Front Photo"
              icon={<PhotoIcon className="w-16 h-16 text-slate-200 mb-1" />}
              maxPhotos={1}
              entityId={userId}
              entityType={userType}
              name="frontVehiclePhoto"
              error={errors.frontVehiclePhoto || undefined}
              onErrorClear={() => clearError('frontVehiclePhoto')}
            />
          </div>
          
          <div className="w-full" ref={backPhotoRef}>
            <PhotoUploads 
              onPhotosSelected={handleBackPhotoSelected} 
              photoUploadTitle="Back of Vehicle Photo"
              buttonText="Add Back Photo"
              icon={<PhotoIcon className="w-16 h-16 text-slate-200 mb-1" />}
              maxPhotos={1}
              entityId={userId}
              entityType={userType}
              name="backVehiclePhoto"
              error={errors.backVehiclePhoto || undefined}
              onErrorClear={() => clearError('backVehiclePhoto')}
            />
          </div>
        </div>

        {/* Photo Guidelines */}
        <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border rounded-md max-w-fit">
          <p className="text-sm text-text-primary">
            Make sure the license plate number is clearly visible in the photos.
          </p>
          <p className="text-sm mt-2 text-text-primary">
            To view examples of acceptable vehicle photos click{' '}
            <Link 
              href="/vehicle-requirements"
              target="_blank"
              rel="noopener noreferrer"
              className="underline cursor-pointer font-semibold focus:outline-none"
              aria-label="View examples of acceptable vehicle photos (opens in new tab)"
            >
              here
            </Link>
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
        
        <div className="w-full" ref={insurancePhotoRef}>
          <PhotoUploads 
            onPhotosSelected={handleInsurancePhotoSelected} 
            photoUploadTitle="Auto Insurance Document"
            buttonText="Add Insurance Document"
            icon={<DocumentArrowDownIcon className="w-16 h-16 text-slate-200 mb-1" />}
            aspectRatio="aspect-video"
            maxPhotos={1}
            entityId={userId}
            entityType={userType}
            name="autoInsurancePhoto"
            error={errors.autoInsurancePhoto || undefined}
            onErrorClear={() => clearError('autoInsurancePhoto')}
          />
        </div>

        {/* Insurance Guidelines */}
        <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border rounded-md max-w-fit">
          <p className="text-sm text-text-primary">
            <span className="font-semibold">Note:</span> Upload an ID card or policy document that includes the policy number, the policy expiration date, and VIN number.
          </p>
        </div>
      </section>
      
      {/* Submit Button */}
      <div className="mt-12">
        <button
          type="button"
          className="btn-primary w-full"
          onClick={handleFormSubmit}
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
