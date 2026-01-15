/**
 * @fileoverview Custom hook for managing Add Vehicle Form state and operations
 * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx
 * 
 * HOOK FUNCTIONALITY:
 * Manages complex state for vehicle creation including form validation, photo uploads,
 * and API interactions. Provides clean separation between UI state management and business logic.
 * 
 * STATE MANAGEMENT EXTRACTED:
 * - Form field state and validation
 * - Photo upload management
 * - Submission workflow
 * - Error handling and display
 * - Loading states
 * 
 * @refactor Extracted from AddVehicleForm component to separate state management
 * from UI rendering, following React best practices for custom hooks
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { VehicleService, UserType } from '@/lib/services/vehicleService';
import { validateField, ValidationMessages } from '@/lib/utils/validationUtils';

// Vehicle make options (common car manufacturers)
export const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 
  'Hyundai', 'Kia', 'Subaru', 'Volkswagen', 'BMW', 
  'Mercedes-Benz', 'Audi', 'Lexus', 'Mazda', 'Jeep',
  'Dodge', 'Ram', 'GMC', 'Buick', 'Cadillac', 'Other'
];

// Generate year options from 1990 to current year
const currentYear = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1990 + 1 }, 
  (_, i) => (currentYear - i).toString()
);

export interface VehicleFormData {
  make: string | null;
  model: string;
  year: string | null;
  licensePlate: string;
  hasTrailerHitch: "Yes" | "No" | null;
}

export interface VehicleFormErrors {
  make: string | null;
  model: string | null;
  year: string | null;
  licensePlate: string | null;
  trailerHitch: string | null;
  frontVehiclePhoto: string | null;
  backVehiclePhoto: string | null;
  autoInsurancePhoto: string | null;
  submit: string | null;
}

export interface VehiclePhotos {
  frontVehiclePhoto: File | null;
  backVehiclePhoto: File | null;
  autoInsurancePhoto: File | null;
}

export interface UseAddVehicleFormOptions {
  userId: string;
  userType: UserType;
  onSuccess?: () => void;
}

export interface UseAddVehicleFormReturn {
  // Form data
  formData: VehicleFormData;
  errors: VehicleFormErrors;
  photos: VehiclePhotos;
  
  // State
  isSubmitting: boolean;
  
  // Form handlers
  updateField: (field: keyof VehicleFormData, value: any) => void;
  updatePhoto: (field: keyof VehiclePhotos, file: File | null) => void;
  clearError: (field: keyof VehicleFormErrors) => void;
  
  // Validation
  validateForm: () => { isValid: boolean; firstErrorField: string | null };
  
  // Submission
  handleSubmit: () => Promise<string | null>;
}

const DEFAULT_FORM_DATA: VehicleFormData = {
  make: null,
  model: '',
  year: null,
  licensePlate: '',
  hasTrailerHitch: null,
};

const DEFAULT_ERRORS: VehicleFormErrors = {
  make: null,
  model: null,
  year: null,
  licensePlate: null,
  trailerHitch: null,
  frontVehiclePhoto: null,
  backVehiclePhoto: null,
  autoInsurancePhoto: null,
  submit: null,
};

const DEFAULT_PHOTOS: VehiclePhotos = {
  frontVehiclePhoto: null,
  backVehiclePhoto: null,
  autoInsurancePhoto: null,
};

/**
 * Custom hook for managing Add Vehicle Form state and operations
 * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (state management logic)
 */
export function useAddVehicleForm({
  userId,
  userType,
  onSuccess
}: UseAddVehicleFormOptions): UseAddVehicleFormReturn {
  const router = useRouter();
  
  // State management
  const [formData, setFormData] = useState<VehicleFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<VehicleFormErrors>(DEFAULT_ERRORS);
  const [photos, setPhotos] = useState<VehiclePhotos>(DEFAULT_PHOTOS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Update form field value and clear related error
   */
  const updateField = useCallback((field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Update photo file
   */
  const updatePhoto = useCallback((field: keyof VehiclePhotos, file: File | null) => {
    setPhotos(prev => ({ ...prev, [field]: file }));
    // Clear error for this photo field when a photo is uploaded
    if (file) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, []);

  /**
   * Clear specific error
   */
  const clearError = useCallback((field: keyof VehicleFormErrors) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  }, []);

  /**
   * Validate entire form
   * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (validateForm function)
   */
  const validateForm = useCallback((): { isValid: boolean; firstErrorField: string | null } => {
    const newErrors: VehicleFormErrors = { ...DEFAULT_ERRORS };
    let isValid = true;
    let firstErrorField: string | null = null;

    // Validate in the order fields appear in the form
    // Validate year
    if (!formData.year) {
      newErrors.year = 'Please select a vehicle year';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'year';
    }

    // Validate make
    if (!formData.make) {
      newErrors.make = 'Please select a vehicle make';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'make';
    }

    // Validate model
    const modelValidation = validateField(formData.model, { required: true });
    if (!modelValidation.isValid) {
      newErrors.model = 'Please enter your vehicle model (e.g., Camry, F-150)';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'model';
    }

    // Validate license plate
    const licensePlateValidation = validateField(formData.licensePlate, { 
      required: true, 
      licensePlate: true 
    });
    if (!licensePlateValidation.isValid) {
      newErrors.licensePlate = 'Please enter your vehicle\'s license plate number';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'licensePlate';
    }

    // Validate trailer hitch
    if (!formData.hasTrailerHitch) {
      newErrors.trailerHitch = 'Please select whether your vehicle has a trailer hitch';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'trailerHitch';
    }

    // Validate photos
    if (!photos.frontVehiclePhoto) {
      newErrors.frontVehiclePhoto = 'Please upload a front vehicle photo';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'frontVehiclePhoto';
    }

    if (!photos.backVehiclePhoto) {
      newErrors.backVehiclePhoto = 'Please upload a back vehicle photo';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'backVehiclePhoto';
    }

    if (!photos.autoInsurancePhoto) {
      newErrors.autoInsurancePhoto = 'Please upload your auto insurance document';
      isValid = false;
      if (!firstErrorField) firstErrorField = 'autoInsurancePhoto';
    }

    setErrors(newErrors);
    return { isValid, firstErrorField };
  }, [formData, photos]);

  /**
   * Handle form submission
   * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (handleSubmit function)
   */
  const handleSubmit = useCallback(async (): Promise<string | null> => {
    const validation = validateForm();
    if (!validation.isValid) {
      console.log('Validation failed');
      return validation.firstErrorField;
    }
    
    try {
      setIsSubmitting(true);
      setErrors(prev => ({ ...prev, submit: null }));
      
      // 1. First upload all photos to Cloudinary
      const photoUrls: Record<string, string> = {};
      
      const photoEntries = Object.entries(photos).filter(([_, file]) => file !== null) as [string, File][];
      
      if (photoEntries.length > 0) {
        console.log(`Uploading ${photoEntries.length} files...`);
        
        // Upload files sequentially
        for (const [fieldName, file] of photoEntries) {
          try {
            console.log(`Uploading ${fieldName}...`);
            
            const url = await VehicleService.uploadVehiclePhoto(userId, userType, file, fieldName);
            photoUrls[fieldName] = url;
            console.log(`Successfully uploaded ${fieldName}:`, url);
          } catch (uploadError) {
            console.error(`Error uploading ${fieldName}:`, uploadError);
            
            // Provide user-friendly error messages based on field type
            let errorMessage: string;
            if (fieldName === 'autoInsurancePhoto') {
              errorMessage = 'Failed to upload your insurance document. Please try again or email us at help@boomboxstorage.com';
            } else if (fieldName === 'frontVehiclePhoto') {
              errorMessage = 'Failed to upload your front vehicle photo. Please try again or email us at help@boomboxstorage.com';
            } else if (fieldName === 'backVehiclePhoto') {
              errorMessage = 'Failed to upload your back vehicle photo. Please try again or email us at help@boomboxstorage.com';
            } else {
              errorMessage = `Failed to upload ${fieldName}. Please try again or email us at help@boomboxstorage.com`;
            }
            
            throw new Error(errorMessage);
          }
        }
      }
      
      // 2. Create the vehicle record with photo URLs
      const vehicleData = {
        make: formData.make!,
        model: formData.model,
        year: formData.year!, // Keep year as string (Prisma expects String)
        licensePlate: formData.licensePlate,
        hasTrailerHitch: formData.hasTrailerHitch === "Yes",
        frontVehiclePhoto: photoUrls['frontVehiclePhoto'] || null,
        backVehiclePhoto: photoUrls['backVehiclePhoto'] || null,
        autoInsurancePhoto: photoUrls['autoInsurancePhoto'] || null,
      };

      console.log('Creating vehicle record:', vehicleData);
      
      const vehicle = await VehicleService.createVehicle(userId, userType, vehicleData);
      console.log('Vehicle created successfully:', vehicle);
      
      // Success! Call onSuccess callback or redirect
      console.log('Vehicle added successfully!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise redirect to appropriate account page
        const redirectPath = userType === 'driver' 
          ? `/service-provider/driver/${userId}/vehicle`
          : `/service-provider/mover/${userId}/vehicle`;
        router.push(redirectPath);
      }
      
      return null; // Success - no error to scroll to
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'An unexpected error occurred. Please try again.'
      }));
      return null; // Don't scroll on submission errors
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, photos, userId, userType, onSuccess, router, validateForm]);

  return {
    formData,
    errors,
    photos,
    isSubmitting,
    updateField,
    updatePhoto,
    clearError,
    validateForm,
    handleSubmit,
  };
}
