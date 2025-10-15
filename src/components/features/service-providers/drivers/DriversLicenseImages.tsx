/**
 * @fileoverview Driver's license photo upload and management component
 * Allows drivers to upload, view, and delete front and back photos of their driver's license
 * 
 * @source boombox-10.0/src/app/components/mover-account/driverslicenseimages.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Fetches and displays existing driver's license photos (front and back)
 * - Allows uploading new license photos via PhotoUploads component
 * - Supports deleting existing photos with confirmation modal
 * - Shows loading states during photo fetch and display
 * - Only renders for driver user type (returns null for movers)
 * - Displays alert message if no license photos exist
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId}/license-photos → New: /api/drivers/[id]/license-photos
 * - Old: /api/drivers/${userId}/remove-license-photos → New: /api/drivers/[id]/remove-license-photos
 * - Old: /api/drivers/${userId}/upload-drivers-license → New: /api/drivers/[id]/upload-drivers-license
 * 
 * DESIGN SYSTEM UPDATES:
 * - Applied semantic color tokens (text-primary, surface-tertiary, etc.)
 * - Updated modal styling to use design system patterns
 * - Replaced hardcoded colors with semantic tokens
 * - Enhanced button styling with design system classes
 * - Improved alert message styling with proper semantic colors
 * 
 * @refactor 
 * - Integrated with design system colors and patterns
 * - Enhanced accessibility with proper ARIA labels and modal structure
 * - Improved component documentation
 * - Updated API route paths to new structure
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CreditCardIcon, TrashIcon } from '@heroicons/react/24/outline';
import PhotoUploads from '@/components/forms/PhotoUploads';

interface DriversLicenseImagesProps {
  userId: string;
  userType: 'driver' | 'mover';
}

const DriversLicenseImages: React.FC<DriversLicenseImagesProps> = ({ 
  userId, 
  userType 
}) => {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [driverLicenseFront, setDriverLicenseFront] = useState<string | undefined>(undefined);
  const [driverLicenseBack, setDriverLicenseBack] = useState<string | undefined>(undefined);
  const [isLoadingFront, setIsLoadingFront] = useState<boolean>(false);
  const [isLoadingBack, setIsLoadingBack] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  const [photoToDelete, setPhotoToDelete] = useState<'front' | 'back' | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchDriverLicensePhotos = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Updated API route
      const response = await fetch(`/api/drivers/${userId}/license-photos`);
      if (response.ok) {
        const data = await response.json();
        if (data.frontPhoto) {
          setIsLoadingFront(true);
          setDriverLicenseFront(data.frontPhoto);
        }
        if (data.backPhoto) {
          setIsLoadingBack(true);
          setDriverLicenseBack(data.backPhoto);
        }
      }
    } catch (error) {
      console.error("Error fetching driver's license photos:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDriverLicensePhotos();
  }, [userType, userId, fetchDriverLicensePhotos]);

  const handleFileCapture = (fieldName: string, file: File) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleFrontPhotoSelected = (files: File[]) => {
    if (files.length > 0) {
      handleFileCapture('frontVehiclePhoto', files[0]);
    }
  };

  const handleBackPhotoSelected = (files: File[]) => {
    if (files.length > 0) {
      handleFileCapture('backVehiclePhoto', files[0]);
    }
  };

  // Refresh photos after successful upload
  const handleSuccessfulUpload = async () => {
    await fetchDriverLicensePhotos();
  };

  const handleDeleteClick = (photoType: 'front' | 'back') => {
    setPhotoToDelete(photoType);
    setShowDeleteConfirmation(true);
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;
    
    try {
      setIsDeleting(true);
      // Updated API route
      const response = await fetch(`/api/drivers/${userId}/remove-license-photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoType: photoToDelete }),
      });
      
      if (response.ok) {
        if (photoToDelete === 'front') {
          setDriverLicenseFront(undefined);
        } else {
          setDriverLicenseBack(undefined);
        }
      } else {
        console.error('Failed to delete photo');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setPhotoToDelete(null);
    }
  };

  // If not a driver, don't render anything
  if (userType !== 'driver') {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl text-text-primary mt-4 mb-8">Driver&apos;s License</h2>

      {!driverLicenseFront && !driverLicenseBack && !isLoadingData && (
        <div 
          className="bg-amber-50 w-fit border border-amber-200 rounded-md p-4 mb-6"
          role="alert"
          aria-live="polite"
        >
          <p className="text-amber-700 text-sm">
            To activate your driver account upload a front and back photo of your driver&apos;s license
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Front License Photo */}
        <div className="w-full">
          {isLoadingData ? (
            <div className="border bg-surface-tertiary rounded-md p-4 aspect-video flex items-center justify-center">
              <CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />
            </div>
          ) : driverLicenseFront ? (
            <>
              <h3 className="font-medium text-text-primary mb-2">Front</h3>
              <div className="aspect-video relative rounded-md overflow-hidden">
                {isLoadingFront && (
                  <div className="border bg-surface-tertiary rounded-md p-4 aspect-video flex items-center justify-center">
                    <CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />
                  </div>
                )}
                <Image 
                  src={driverLicenseFront} 
                  alt="Front of Driver's License" 
                  className="w-full h-full object-cover"
                  width={600}
                  height={400}
                  onLoad={() => setIsLoadingFront(false)}
                  onError={() => setIsLoadingFront(false)}
                />
                <button 
                  onClick={() => handleDeleteClick('front')}
                  className="absolute top-4 right-4 w-8 h-8 bg-primary bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-opacity"
                  aria-label="Delete front license photo"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <PhotoUploads 
              onPhotosSelected={handleFrontPhotoSelected} 
              photoUploadTitle="Front of Driver's License Photo"
              buttonText="Add Front of License Photo"
              aspectRatio="aspect-video"
              directUpload={true}
              uploadEndpoint={`/api/drivers/${userId}/upload-drivers-license`}
              icon={<CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />}
              photoDescription="front"
              onUploadSuccess={handleSuccessfulUpload}
            />
          )}
        </div>
        
        {/* Back License Photo */}
        <div className="w-full">
          {isLoadingData ? (
            <div className="border bg-surface-tertiary rounded-md p-4 aspect-video flex items-center justify-center">
              <CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />
            </div>
          ) : driverLicenseBack ? (
            <>
              <h3 className="font-medium text-text-primary mb-2">Back</h3>
              <div className="aspect-video relative rounded-md overflow-hidden">
                {isLoadingBack && (
                  <div className="border bg-surface-tertiary rounded-md p-4 aspect-video flex items-center justify-center">
                    <CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />
                  </div>
                )}
                <Image 
                  src={driverLicenseBack} 
                  alt="Back of Driver's License" 
                  className="w-full h-full object-cover"
                  width={600}
                  height={400}
                  onLoad={() => setIsLoadingBack(false)}
                  onError={() => setIsLoadingBack(false)}
                />
                <button 
                  onClick={() => handleDeleteClick('back')}
                  className="absolute top-4 right-4 w-8 h-8 bg-primary bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-opacity"
                  aria-label="Delete back license photo"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <PhotoUploads 
              onPhotosSelected={handleBackPhotoSelected} 
              photoUploadTitle="Back of Driver's License Photo"
              buttonText="Add Back of License Photo"
              aspectRatio="aspect-video"
              directUpload={true}
              uploadEndpoint={`/api/drivers/${userId}/upload-drivers-license`}
              icon={<CreditCardIcon className="w-16 h-16 text-text-tertiary mb-1" aria-hidden="true" />}
              photoDescription="back"
              onUploadSuccess={handleSuccessfulUpload}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div 
          className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-surface-primary rounded-md p-6 sm:p-10 max-w-lg w-full mx-4 shadow-custom-shadow">
            <h3 
              id="delete-modal-title"
              className="text-2xl font-semibold text-text-primary mb-4"
            >
              Remove Photo
            </h3>
            <p className="text-text-primary mb-4">
              Are you sure you want to remove your driver&apos;s license photo?
            </p>
            <div className="mt-10 flex justify-end space-x-2">
              <button
                className="px-4 py-2 text-sm text-text-primary underline-offset-4 underline hover:text-text-secondary transition-colors"
                onClick={() => setShowDeleteConfirmation(false)}
                aria-label="Cancel deletion"
              >
                Close
              </button>
              <button
                className="rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse text-sm hover:bg-primary-hover active:bg-primary transition-colors disabled:opacity-50"
                onClick={handleDeletePhoto}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriversLicenseImages;

