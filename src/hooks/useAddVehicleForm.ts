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
  validateForm: () => boolean;
  
  // Submission
  handleSubmit: () => Promise<void>;
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
  const validateForm = useCallback((): boolean => {
    const newErrors: VehicleFormErrors = { ...DEFAULT_ERRORS };
    let isValid = true;

    // Validate make
    if (!formData.make) {
      newErrors.make = 'Please select a vehicle make';
      isValid = false;
    }

    // Validate model
    const modelValidation = validateField(formData.model, { required: true });
    if (!modelValidation.isValid) {
      newErrors.model = modelValidation.error || 'Vehicle model is required';
      isValid = false;
    }

    // Validate year
    if (!formData.year) {
      newErrors.year = 'Please select a vehicle year';
      isValid = false;
    }

    // Validate license plate
    const licensePlateValidation = validateField(formData.licensePlate, { 
      required: true, 
      licensePlate: true 
    });
    if (!licensePlateValidation.isValid) {
      newErrors.licensePlate = licensePlateValidation.error || 'Please enter a valid license plate number';
      isValid = false;
    }

    // Validate trailer hitch
    if (!formData.hasTrailerHitch) {
      newErrors.trailerHitch = 'Please select whether your vehicle has a trailer hitch';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  /**
   * Handle form submission
   * @source boombox-10.0/src/app/components/driver-signup/addvehicleform.tsx (handleSubmit function)
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!validateForm()) {
      console.log('Validation failed');
      return;
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
            throw new Error(`Failed to upload ${fieldName}. Please try again.`);
          }
        }
      }
      
      // 2. Create the vehicle record with photo URLs
      const vehicleData = {
        make: formData.make!,
        model: formData.model,
        year: formData.year!,
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
          ? `/driver-account-page/${userId}/vehicle`
          : `/mover-account-page/${userId}/vehicle`;
        router.push(redirectPath);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'An unexpected error occurred. Please try again.'
      }));
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
