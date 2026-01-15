/**
 * @fileoverview Admin task page for assigning storage units to customer appointments
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/assign-storage-unit/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment details and customer information
 * - Shows driver verification with license photo
 * - Requires photo upload of trailer on vehicle
 * - Allows admin to select and assign storage unit to appointment
 * - Supports multi-unit assignments with unit index tracking
 * 
 * API ROUTES USED:
 * - GET /api/orders/appointments/[id]/details - Fetch appointment data
 * - GET /api/orders/appointments/[id]/driver-by-unit - Get driver for specific unit
 * - POST /api/uploads/unit-pickup-photos - Upload trailer photos to Cloudinary
 * - POST /api/admin/tasks/assign-storage-unit/[appointmentId] - Assign unit to appointment
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-surface-primary)
 * - Uses btn-primary utility class for submit button
 * - Uses form-error class for validation messages
 * - Replaced hardcoded orange colors with status-warning variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/Button';
import { ChevronLeftIcon, PhotoIcon, CubeIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { format } from 'date-fns';

// Import shared components
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import PhotoUploads from '@/components/forms/PhotoUploads';
import { StorageUnitSelector } from '@/components/features/admin/shared';

interface Appointment {
 id: number;
 jobCode: string;
 address: string;
 date: Date;
 time: Date;
 appointmentType: string;
 numberOfUnits: number;
 driver: {
  firstName: string;
  lastName: string;
  driverLicenseFrontPhoto: string | null;
  phoneNumber?: string;
 } | null;
 user: {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
 };
 movingPartner: {
  name: string;
  phoneNumber?: string;
 } | null;
 storageStartUsages?: Array<{
  storageUnit: {
   storageUnitNumber: string;
  };
 }>;
 requestedStorageUnits?: Array<{
  storageUnit: {
   storageUnitNumber: string;
  };
 }>;
}

interface AssignStorageUnitPageProps {
 taskId: string;
}

export function AssignStorageUnitPage({ taskId }: AssignStorageUnitPageProps) {
 const [appointment, setAppointment] = useState<Appointment | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [driverMatch, setDriverMatch] = useState<string | null>(null);
 const [selectedUnit, setSelectedUnit] = useState<string>('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [trailerPhotos, setTrailerPhotos] = useState<File[]>([]);
 const [photoError, setPhotoError] = useState<string | null>(null);
 const [currentUnitDriver, setCurrentUnitDriver] = useState<{
  firstName: string;
  lastName: string;
  driverLicenseFrontPhoto: string | null;
  phoneNumber?: string;
 } | null>(null);
 const router = useRouter();

 // Extract appointment ID and unit index from taskId (enhanced format)
 const parts = taskId.split('-');
 const appointmentId = taskId.startsWith('storage-') ? parseInt(parts[1]) : null;
 const unitIndex = parts.length > 2 ? parseInt(parts[2]) : 1;

 useEffect(() => {
  const fetchAppointmentDetails = async () => {
   if (!appointmentId) return;

   try {
    setIsLoading(true);
    const response = await fetch(`/api/orders/appointments/${appointmentId}/details`);
    if (!response.ok) {
     console.error(`Error response: ${response.status}`, await response.text());
     throw new Error(`Failed to fetch appointment details: ${response.status}`);
    }
    const data = await response.json();
    setAppointment(data);
   } catch (error) {
    console.error('Error fetching appointment details:', error);
   } finally {
    setIsLoading(false);
   }
  };

  if (appointmentId) {
   fetchAppointmentDetails();
  }
 }, [appointmentId]);

 // Fetch driver information based on unit number
 useEffect(() => {
  const fetchDriverForUnit = async () => {
   if (!appointmentId) return;

   try {
    const response = await fetch(
     `/api/orders/appointments/${appointmentId}/driver-by-unit?unitNumber=${unitIndex}`
    );
    if (!response.ok) {
     console.error(`Error fetching driver: ${response.status}`, await response.text());
     setCurrentUnitDriver(null);
     return;
    }

    const data = await response.json();

    if (data.driver) {
     setCurrentUnitDriver(data.driver);
    } else {
     // If no specific driver is assigned for this unit, use the default driver from appointment
     setCurrentUnitDriver(appointment?.driver || null);
    }
   } catch (error) {
    console.error('Error fetching driver for unit:', error);
    setCurrentUnitDriver(null);
   }
  };

  fetchDriverForUnit();
 }, [appointmentId, unitIndex, appointment]);

 const handleUnitSelect = (value: string) => {
  setSelectedUnit(value);
 };

 const handlePhotoChange = (files: File[]) => {
  setTrailerPhotos(files);
  setPhotoError(null);
 };

 const uploadPhotos = async (): Promise<string[]> => {
  if (trailerPhotos.length === 0) {
   setPhotoError('Please add a photo of the trailer');
   throw new Error('No photos to upload');
  }

  const uploadedUrls: string[] = [];

  try {
   // Upload each photo using the Cloudinary API
   for (const photo of trailerPhotos) {
    const formData = new FormData();
    formData.append('file', photo);
    formData.append('entityType', 'trailer');
    formData.append('appointmentId', appointment?.id.toString() || '');

    const uploadResponse = await fetch(
     `/api/uploads/unit-pickup-photos?entityType=trailer&appointmentId=${appointment?.id}`,
     {
      method: 'POST',
      body: formData,
     }
    );

    if (!uploadResponse.ok) {
     throw new Error(`Failed to upload photo: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    uploadedUrls.push(uploadData.url);
   }

   return uploadedUrls;
  } catch (error) {
   console.error('Error uploading photos:', error);
   setPhotoError('Failed to upload photos');
   throw error;
  }
 };

 const handleAssignUnit = async () => {
  if (!appointment) return;

  // Validate the storage unit is selected
  if (!selectedUnit) {
   return;
  }

  // Validate photo is added
  if (trailerPhotos.length === 0) {
   setPhotoError('Please add a photo of the trailer on vehicle');
   return;
  }

  setIsSubmitting(true);
  try {
   // First upload photos
   const photoUrls = await uploadPhotos();

   // Then assign storage unit
   const response = await fetch(`/api/admin/tasks/assign-storage-unit/${appointment.id}`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     storageUnitNumbers: [selectedUnit],
     driverMatches: driverMatch === 'Yes',
     trailerPhotos: photoUrls,
     unitIndex: unitIndex,
    }),
   });

   if (!response.ok) {
    throw new Error('Failed to assign storage unit');
   }

   const responseData = await response.json();
   console.log('Assignment response:', responseData);

   // Redirect back to tasks
   router.push('/admin/tasks');
  } catch (error) {
   console.error('Error assigning storage unit:', error);
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

 if (!appointment) {
  return (
   <div className="min-h-screen p-4">
    <div className="max-w-7xl mx-auto">
     <div className="text-center">
      <h1 className="text-2xl font-semibold text-text-primary">Appointment not found</h1>
      <p className="mt-2 text-text-secondary">The requested appointment could not be found.</p>
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
      className="flex items-center text-text-primary hover:text-text-secondary"
      aria-label="Go back"
     >
      <ChevronLeftIcon className="h-6 w-6" />
     </button>
     <div>
      <h1 className="text-xl font-semibold text-text-primary">Assign Storage Unit</h1>
      <p className="text-text-secondary mt-1 text-sm">
       Assign storage unit to job. Verify job code and driver. Take photo of Boombox trailer on
       vehicle
      </p>
     </div>
    </div>

    <div className="bg-surface-primary rounded-lg mb-64">
     <div className="p-6 space-y-6">
      {/* Customer Card */}
      <div className="bg-orange-500 rounded-lg p-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         <div className="relative bg-orange-600 rounded-full h-12 w-12 overflow-hidden flex items-center justify-center">
          <ListBulletIcon className="h-6 w-6 text-white" aria-hidden="true" />
         </div>
         <div>
          <h4 className="text-white font-medium">{appointment.appointmentType}</h4>
          <p className="text-white/90 text-sm">
           {appointment &&
            new Date(appointment.date).toLocaleDateString('en-US', {
             weekday: 'short',
             month: 'short',
             day: 'numeric',
            })}{' '}
           starting at{' '}
           {appointment &&
            new Date(appointment.time)
             .toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
             })
             .replace(':00', '')}
          </p>
         </div>
        </div>
        <div className="flex items-center">
         <div className="relative bg-orange-600 rounded-full h-12 w-12 overflow-hidden mr-3 flex items-center justify-center">
          <CubeIcon className="h-6 w-6 text-white" aria-hidden="true" />
         </div>
         <div className="flex flex-col items-start text-white mr-4">
          <div className="flex items-center">
           <span className="font-semibold text-lg">
            Unit {unitIndex} of {appointment.numberOfUnits || 1}
           </span>
          </div>
          <span className="text-xs text-white/90"># of units</span>
         </div>
        </div>
       </div>
      </div>

      {/* Job Information Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-border pb-4">
       <div className="border-r border-border pr-6">
        <h3 className="font-medium text-text-primary font-semibold">Job Code</h3>
        <p className="mt-1 text-sm text-text-primary">{appointment.jobCode}</p>
       </div>
       <div className="md:border-r border-border pr-6">
        <h3 className="font-medium text-text-primary font-semibold">Customer</h3>
        <p className="mt-1 text-sm text-text-primary">
         {appointment.user?.firstName} {appointment.user?.lastName}
        </p>
       </div>
       <div className="border-r border-border pr-6">
        <h3 className="font-medium text-text-primary font-semibold">Moving Partner</h3>
        <p className="mt-1 text-sm text-text-primary">
         {appointment.movingPartner?.name || 'N/A'}
        </p>
       </div>
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Driver</h3>
        <p className="mt-1 text-sm text-text-primary">
         {currentUnitDriver
          ? `${currentUnitDriver.firstName} ${currentUnitDriver.lastName}`
          : appointment.driver
           ? `${appointment.driver.firstName} ${appointment.driver.lastName}`
           : 'N/A'}
        </p>
       </div>
      </div>

      {/* Driver Verification Section */}
      <div className="space-y-6 border-b border-border pb-6">
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Driver Verification</h3>

        {(currentUnitDriver?.driverLicenseFrontPhoto ||
         appointment.driver?.driverLicenseFrontPhoto) ? (
         <div className="mt-4">
          <div className="w-[300px] h-[150px] md:w-[400px] md:h-[200px] bg-surface-tertiary rounded-md overflow-hidden">
           <Image
            src={
             (
              currentUnitDriver?.driverLicenseFrontPhoto ||
              appointment.driver?.driverLicenseFrontPhoto ||
              ''
             ).includes('cloudinary')
              ? (
                currentUnitDriver?.driverLicenseFrontPhoto ||
                appointment.driver?.driverLicenseFrontPhoto ||
                ''
               ).replace('/upload/', '/upload/c_fill,g_auto,h_200,w_400/')
              : currentUnitDriver?.driverLicenseFrontPhoto ||
               appointment.driver?.driverLicenseFrontPhoto ||
               ''
            }
            alt="Driver's License"
            width={400}
            height={200}
            className="w-full h-full object-cover"
            onError={(e) => {
             console.error('Error loading driver license image');
             const target = e.target as HTMLImageElement;
             target.src = '/images/placeholder-license.png'; // Fallback image
            }}
            unoptimized={
             (
              currentUnitDriver?.driverLicenseFrontPhoto ||
              appointment.driver?.driverLicenseFrontPhoto ||
              ''
             ).startsWith('data:')
            }
           />
          </div>
          <div className="mt-4">
           <p className="mb-2 text-sm text-text-primary">
            Does the driver match the driver&apos;s license picture?
           </p>
           <YesOrNoRadio value={driverMatch} onChange={setDriverMatch} hasError={false} />
          </div>
         </div>
        ) : (
         <div className="mt-4 text-sm text-text-secondary">
          No driver&apos;s license photo available
         </div>
        )}
       </div>
      </div>

      {/* Photo Upload Section */}
      <div className="space-y-4 border-b border-border pb-6">
       <div>
        <h3 className="font-medium text-text-primary font-semibold">
         Add photo of trailer on vehicle
        </h3>
        <div className="mt-4 max-w-lg">
         <PhotoUploads
          photoUploadTitle="Add Photo of Trailer on Vehicle"
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

      {/* Storage Unit Assignment Section */}
      <div className="space-y-6">
       <div>
        <h3 className="font-medium text-text-primary font-semibold">Assign storage unit</h3>
        <div className="mt-4 space-y-4 max-w-lg">
         <StorageUnitSelector
          label={`Select a unit for Unit ${unitIndex} of ${appointment.numberOfUnits || 1}`}
          value={selectedUnit}
          onChange={handleUnitSelect}
          disabled={isSubmitting}
         />
        </div>
       </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleAssignUnit}
                  disabled={
                    driverMatch !== 'Yes' ||
                    !selectedUnit ||
                    trailerPhotos.length === 0
                  }
                  loading={isSubmitting}
                  variant="primary"
                  className="!bg-orange-500 hover:!bg-orange-400 active:!bg-orange-400 disabled:!bg-orange-500"
                  aria-label="Assign storage unit to appointment"
                >
                  Assign Storage Unit
                </Button>
              </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
}

