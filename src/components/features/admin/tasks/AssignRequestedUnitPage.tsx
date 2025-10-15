/**
 * @fileoverview Admin task page for assigning requested storage units
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/assign-requested-unit/page.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment and driver information
 * - Verifies driver identity with license photo
 * - Handles photo upload of trailer on vehicle
 * - Assigns requested storage unit to appointment
 * 
 * API ROUTES USED:
 * - GET /api/appointments/[id]/getAppointmentDetails - Fetch appointment data
 * - GET /api/appointments/[id]/getDriverByUnit - Fetch driver for specific unit
 * - POST /api/upload/unit-pickup-photos - Upload trailer photos
 * - POST /api/admin/appointments/[id]/assign-requested-unit - Assign unit
 * 
 * DESIGN SYSTEM UPDATES:
 * - Uses semantic color tokens (text-text-primary, bg-status-primary)
 * - Uses form-error class for validation messages
 * - Uses btn-primary utility class for submit button
 * - Replaced hardcoded indigo colors with status-primary variants
 * 
 * @refactor Extracted from inline page implementation into feature component
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, PhotoIcon, CubeIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import YesOrNoRadio from '@/components/forms/YesOrNoRadio';
import PhotoUploads from '@/components/forms/PhotoUploads';
import { RequestedStorageUnitSelector } from '@/components/features/admin/shared';
import { OptimizedImage } from '@/components/ui/primitives/OptimizedImage/OptimizedImage';

interface AssignRequestedUnitPageProps {
  taskId: string;
}

interface Appointment {
  id: number;
  jobCode: string;
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
  };
  movingPartner: {
    name: string;
  } | null;
  requestedStorageUnits?: Array<{
    storageUnit: {
      id: number;
      storageUnitNumber: string;
    }
  }>;
}

export function AssignRequestedUnitPage({ taskId }: AssignRequestedUnitPageProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverMatch, setDriverMatch] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trailerPhotos, setTrailerPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [currentUnitDriver, setCurrentUnitDriver] = useState<Appointment['driver']>(null);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [unitIndex, setUnitIndex] = useState<number>(1);
  const [storageUnitId, setStorageUnitId] = useState<number | null>(null);
  
  const router = useRouter();
  
  // Parse taskId
  useEffect(() => {
    let parsedAppointmentId: number | null = null;
    let parsedUnitIndex: number = 1;
    let parsedStorageUnitId: number | null = null;
    
    if (taskId.startsWith('requested-unit-')) {
      const parts = taskId.split('-');
      if (parts.length >= 3) {
        parsedAppointmentId = parseInt(parts[2]);
        if (parts.length >= 4) {
          parsedUnitIndex = parseInt(parts[3]);
          if (parts.length >= 5) {
            parsedStorageUnitId = parseInt(parts[4]);
          }
        }
      }
    }
    
    setAppointmentId(parsedAppointmentId);
    setUnitIndex(parsedUnitIndex);
    setStorageUnitId(parsedStorageUnitId);
  }, [taskId]);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/appointments/${appointmentId}/getAppointmentDetails`);
        if (!response.ok) {
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
      if (!appointmentId || !unitIndex) return;
      
      try {
        const response = await fetch(`/api/appointments/${appointmentId}/getDriverByUnit?unitNumber=${unitIndex}`);
        if (!response.ok) {
          setCurrentUnitDriver(null);
          return;
        }
        
        const data = await response.json();
        if (data.driver) {
          setCurrentUnitDriver(data.driver);
        } else {
          setCurrentUnitDriver(appointment?.driver || null);
        }
      } catch (error) {
        console.error('Error fetching driver for unit:', error);
        setCurrentUnitDriver(null);
      }
    };
    
    fetchDriverForUnit();
  }, [appointmentId, unitIndex, appointment]);

  useEffect(() => {
    if (storageUnitId) {
      setSelectedUnitId(storageUnitId);
    }
  }, [storageUnitId]);

  const handleUnitSelect = (value: number) => {
    setSelectedUnitId(value);
  };

  const handlePhotoChange = (files: File[]) => {
    setTrailerPhotos(files);
    setPhotoError(null);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (trailerPhotos.length === 0) {
      setPhotoError("Please add a photo of the trailer");
      throw new Error("No photos to upload");
    }

    const uploadedUrls: string[] = [];
    
    try {
      for (const photo of trailerPhotos) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('entityType', 'trailer');
        formData.append('appointmentId', appointment?.id.toString() || '');
        
        const uploadResponse = await fetch(`/api/upload/unit-pickup-photos?entityType=trailer&appointmentId=${appointment?.id}`, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload photo: ${uploadResponse.status}`);
        }
        
        const uploadData = await uploadResponse.json();
        uploadedUrls.push(uploadData.url);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      setPhotoError("Failed to upload photos");
      throw error;
    }
  };

  const handleAssignUnit = async () => {
    if (!appointment) return;
    
    const unitIdToAssign = storageUnitId || selectedUnitId;
    
    if (!unitIdToAssign) {
      return;
    }

    if (trailerPhotos.length === 0) {
      setPhotoError("Please add a photo of the trailer on vehicle");
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrls = await uploadPhotos();
      
      const response = await fetch(`/api/admin/appointments/${appointment.id}/assign-requested-unit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storageUnitId: unitIdToAssign,
          driverMatches: driverMatch === 'Yes',
          trailerPhotos: photoUrls,
          unitIndex: unitIndex
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign requested storage unit');
      }

      router.push('/admin/tasks');
    } catch (error) {
      console.error('Error assigning requested storage unit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-tertiary rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-surface-tertiary rounded w-3/4"></div>
              <div className="h-4 bg-surface-tertiary rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-text-primary">Appointment not found</h1>
            <p className="mt-2 text-text-secondary">The requested appointment could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const driverLicensePhoto = currentUnitDriver?.driverLicenseFrontPhoto || appointment.driver?.driverLicenseFrontPhoto;

  return (
    <div className="mt-4 mb-20">
      <div className="w-full sm:max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-text-primary hover:text-text-secondary"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Assign Requested Storage Unit</h1>
            <p className="text-text-primary mt-1 text-sm">
              Assign requested storage unit to job. Verify job code and driver. Take photo of Boombox trailer on vehicle
            </p>
          </div>
        </div>

        <div className="bg-surface-primary">
          <div className="p-6 space-y-6">
            {/* Appointment Card */}
            <div className="bg-status-primary rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative bg-status-primary-hover rounded-full h-12 w-12 flex items-center justify-center">
                    <ListBulletIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      {appointment?.appointmentType}
                    </h4>
                    <p className="text-white/90 text-sm">
                      {appointment && new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })} starting at {appointment && new Date(appointment.time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }).replace(':00', '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="relative bg-status-primary-hover rounded-full h-12 w-12 mr-3 flex items-center justify-center">
                    <CubeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start text-white mr-4">
                    <span className="font-semibold text-lg">
                      Step {unitIndex} of {appointment?.numberOfUnits || appointment.requestedStorageUnits?.length || 1}
                    </span>
                    {appointment?.requestedStorageUnits && appointment.requestedStorageUnits.length > 0 && (
                      <span className="text-sm text-white/90 text-nowrap">
                        {appointment.requestedStorageUnits.map(unit => 
                          unit.storageUnit.storageUnitNumber
                        ).join(', ')}
                      </span>
                    )}
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
                    : (appointment.driver 
                       ? `${appointment.driver.firstName} ${appointment.driver.lastName}` 
                       : 'N/A')}
                </p>
              </div>
            </div>

            {/* Driver Verification Section */}
            <div className="space-y-6 border-b border-border pb-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Driver Verification</h3>
                
                {driverLicensePhoto ? (
                  <div className="mt-4">
                    <OptimizedImage
                      src={driverLicensePhoto}
                      alt="Driver's License"
                      width={400}
                      height={200}
                      containerClassName="w-[300px] h-[150px] md:w-[400px] md:h-[200px] rounded-md overflow-hidden"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="mt-4">
                      <p className="mb-2 text-sm text-text-primary">Does the driver match the driver's license picture?</p>
                      <YesOrNoRadio
                        value={driverMatch}
                        onChange={setDriverMatch}
                        hasError={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-text-secondary">
                    No driver's license photo available
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-4 border-b border-border pb-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Add photo of trailer on vehicle</h3>
                <div className="mt-4 max-w-lg">
                  <PhotoUploads
                    photoUploadTitle="Add Photo of Trailer on Vehicle"
                    buttonText="Add Photo"
                    icon={<PhotoIcon className="w-10 h-10 text-text-tertiary" />}
                    directUpload={false}
                    onPhotosSelected={handlePhotoChange}
                    maxPhotos={1}
                  />
                  {photoError && (
                    <p className="form-error mt-2">{photoError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Storage Unit Assignment Section */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-text-primary font-semibold">Assign requested storage unit</h3>
                <div className="mt-4 space-y-4 max-w-lg">
                  <RequestedStorageUnitSelector
                    label={`Select storage unit for step ${unitIndex} of ${appointment?.numberOfUnits || appointment.requestedStorageUnits?.length || 1}`}
                    value={selectedUnitId}
                    onChange={handleUnitSelect}
                    appointmentId={appointment.id}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleAssignUnit}
                  disabled={
                    isSubmitting || 
                    !selectedUnitId ||
                    trailerPhotos.length === 0
                  }
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Assign storage unit"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

