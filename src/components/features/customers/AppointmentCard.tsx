/**
 * @fileoverview Customer appointment card displaying appointment details with interactive map and actions
 * @source boombox-10.0/src/app/components/user-page/appointmentcard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment details including date, time, location, and pricing
 * - Shows interactive Google Map with appointment location marker
 * - Provides expandable quote details section with pricing breakdown
 * - Supports appointment cancellation with reason selection
 * - Shows tracking button for in-progress appointments
 * - Allows appointment editing when tracking is not active
 * - Displays cancellation fee warning for appointments within 24 hours
 * 
 * API ROUTES UPDATED:
 * - Old: POST /api/appointments/${appointmentId}/cancel → New: POST /api/orders/appointments/${appointmentId}/cancel
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens (bg-surface-*, text-text-*, bg-status-*)
 * - Applied global CSS classes (btn-primary, card, form-error)
 * - Used consistent spacing and border patterns from design system
 * 
 * @refactor Extracted business logic to utilities, replaced InformationalPopup with Modal primitive,
 * updated to use design system colors, improved component structure and organization
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
 ChevronRightIcon,
 PencilSquareIcon,
 NoSymbolIcon,
 ChevronDownIcon,
 DocumentCurrencyDollarIcon,
 ChevronUpIcon,
 InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Modal } from '@/components/ui/primitives/Modal';
import { Tooltip } from '@/components/ui/primitives/Tooltip';
import { Button } from '@/components/ui/primitives/Button';
import { mapStyles } from '@/app/mapstyles';
import { cancelationPricing } from '@/data/cancelationpricing';
import { accessStorageUnitPricing } from '@/data/accessStorageUnitPricing';
import { isAppointmentWithin24Hours } from '@/lib/utils/dateUtils';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currencyUtils';

interface RequestedStorageUnit {
 id: number;
 storageUnitNumber: string;
}

export interface AppointmentCardProps {
 appointmentId: number;
 title: string;
 description: string;
 displaydate: string;
 date: string;
 time: string;
 location: string;
 userId: string;
 appointmentType: string;
 numberOfUnits: number;
 loadingHelpPrice: number;
 monthlyStorageRate: number;
 monthlyInsuranceRate: number;
 onCancellation: (appointmentId: number) => void;
 movingPartnerName: string | null | undefined;
 thirdPartyTitle: string | null | undefined;
 planType: string | null | undefined;
 insuranceCoverage?: string;
 status: string;
 trackingUrl: string | null | undefined;
 requestedStorageUnits?: RequestedStorageUnit[];
}

const CANCELLATION_OPTIONS = [
 'I no longer need storage',
 'Chose another storage company',
 "The date I wanted wasn't available",
 'Scheduling conflict',
 'Other',
];

const ACCESS_STORAGE_CANCELLATION_OPTIONS = [
 'I no longer need storage access',
 "The date I wanted wasn't available",
 'Scheduling conflict',
 'Other',
];

export function AppointmentCard({
 appointmentId,
 title,
 description,
 date,
 displaydate,
 time,
 location,
 userId,
 appointmentType,
 numberOfUnits,
 loadingHelpPrice,
 monthlyStorageRate,
 monthlyInsuranceRate,
 onCancellation,
 movingPartnerName,
 thirdPartyTitle,
 planType,
 insuranceCoverage,
 trackingUrl,
 status,
 requestedStorageUnits = [],
}: AppointmentCardProps) {
 const router = useRouter();
 const [cancellationReason, setCancellationReason] = useState<string>('');
 const [isCancelling, setIsCancelling] = useState<boolean>(false);
 const [isPriceDetailsOpen, setIsPriceDetailsOpen] = useState(false);
 const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
 const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
 const [mapZoom] = useState<number>(14);

 // Check if appointment is within 24 hours (for cancellation fee)
 const isWithin24Hours = isAppointmentWithin24Hours(date);
 
 // Check if editing should be disabled (within 24 hours OR already passed)
 const appointmentDateTime = new Date(date);
 const isAppointmentPassed = appointmentDateTime.getTime() <= Date.now();
 const isEditDisabled = isWithin24Hours || isAppointmentPassed;

 // Geocode location to coordinates
 useEffect(() => {
  if (location && typeof window !== 'undefined' && window.google) {
   const geocoder = new google.maps.Geocoder();
   geocoder.geocode({ address: location }, (results, status) => {
    if (status === 'OK' && results && results.length > 0) {
     const { lat, lng } = results[0].geometry.location;
     setMapCenter({ lat: lat(), lng: lng() });
    } else {
     console.error('Geocoding failed: ', status);
    }
   });
  }
 }, [location]);

 const handleCancelAppointment = async () => {
  if (!cancellationReason) {
   console.error('Cancellation reason is required');
   return;
  }

  setIsCancelling(true);
  try {
   const response = await fetch(`/api/orders/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancellationReason, userId }),
   });

   if (response.ok) {
    console.log('Appointment canceled successfully');
    onCancellation(appointmentId);
    setIsCancelModalOpen(false);
    router.refresh(); // Force a refresh to fetch fresh data
   } else {
    console.error('Failed to cancel appointment:', await response.json());
   }
  } catch (error) {
   console.error('Error:', error);
  } finally {
   setIsCancelling(false);
  }
 };

 const handleEditClick = () => {
  const params = new URLSearchParams({
   appointmentId: String(appointmentId),
   appointmentType: appointmentType,
  });

  router.push(`/customer/${userId}/edit-appointment?${params.toString()}`);
 };

 // Calculate total price
 // Note: monthlyStorageRate and monthlyInsuranceRate are already total values (not per-unit)
 const calculateTotal = () => {
  if (appointmentType === 'Storage Unit Access' || appointmentType === 'End Storage Term') {
   const accessCost =
    requestedStorageUnits.length > 0
     ? accessStorageUnitPricing * requestedStorageUnits.length
     : accessStorageUnitPricing * numberOfUnits;
   return accessCost + (loadingHelpPrice || 0);
  }

  return (
   (monthlyStorageRate || 0) +
   (monthlyInsuranceRate || 0) +
   (loadingHelpPrice || 0)
  );
 };

 const containerStyle = {
  width: '100%',
  height: '128px',
  borderTopLeftRadius: '0.375rem',
  borderTopRightRadius: '0.375rem',
  borderBottomLeftRadius: '0',
  borderBottomRightRadius: '0',
 };

 return (
  <div className="bg-surface-primary mb-4 rounded-md shadow-custom-shadow">
   <div className="w-full rounded-t-md shrink-0 relative">
    {/* Tracking status badge */}
    {status !== 'Complete' && trackingUrl && (
     <>
      <div className="text-sm flex items-center gap-2 absolute top-4 left-4 z-10 px-3 py-2 bg-status-bg-success rounded-full">
       <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
       <p className="text-sm text-status-success">In Progress</p>
      </div>
      <a
       href={trackingUrl || undefined}
       target="_blank"
       rel="noopener noreferrer"
       className="absolute top-4 right-4 z-10 bg-surface-primary rounded-md px-3 py-2 flex items-center gap-2 shadow-md hover:bg-slate-50"
      >
       <span className="text-sm font-semibold text-text-primary">Track Status</span>
      </a>
     </>
    )}

    <div className="rounded-t-md mb-4">
     <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter || { lat: 37.75, lng: -122.294465 }}
      zoom={mapZoom}
      options={{
       styles: mapStyles,
       disableDefaultUI: false,
       fullscreenControl: false,
      }}
     >
      {mapCenter && <Marker position={mapCenter} />}
     </GoogleMap>
    </div>
   </div>

   <div className="flex px-4 pb-4 items-center gap-2">
    {/* Content */}
    <div className="w-full flex-col flex sm:flex-row items-start">
     {/* Title and description */}
     <div className="w-full sm:min-h-20 basis-1/3 sm:basis-1/2 pb-4 border-b sm:border-none border-border sm:pr-4">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-primary">{description}</p>
     </div>

     {/* Address */}
     <div className="sm:min-h-20 pt-4 mb-1 sm:mb-0 sm:pt-0 flex grow flex-row sm:flex-col items-center sm:items-start sm:border-l border-border sm:px-4">
      <h3 className="text-base font-semibold mr-2 sm:mr-0">Address</h3>
      <p className="text-sm text-text-primary">{location}</p>
     </div>

     {/* Date and time */}
     <div className="grow-0 sm:min-h-20 flex flex-row sm:flex-col items-center sm:items-start sm:border-l border-border sm:px-4">
      <h3 className="text-base font-semibold mr-2 sm:mr-0">Date</h3>
      <p className="text-sm text-text-primary mr-1 sm:mr-0">{displaydate}</p>
      <p className="text-sm text-text-primary">{time}</p>
     </div>
    </div>
   </div>

   {/* Actions */}
   <div className="border-t border-border">
    {/* Price Details Button */}
    <div className="border-b border-border">
     <button
      onClick={() => setIsPriceDetailsOpen(!isPriceDetailsOpen)}
      className="px-4 py-4 flex items-center justify-between w-full text-text-primary sm:hover:bg-slate-50 active:bg-surface-tertiary"
     >
      <div className="flex items-center">
       <DocumentCurrencyDollarIcon className="w-5 h-5 mr-2 text-text-primary" />
       <span className="text-sm">Quote Details</span>
      </div>
      {isPriceDetailsOpen ? (
       <ChevronUpIcon className="w-4 h-4 text-text-primary" />
      ) : (
       <ChevronDownIcon className="w-4 h-4 text-text-primary" />
      )}
     </button>

     {/* Price Details Content */}
     <div
      className={`overflow-hidden transition-all duration-300 ease ${
       isPriceDetailsOpen ? 'max-h-96' : 'max-h-0'
      }`}
     >
      <div className="bg-surface-tertiary relative">
       <div className="px-4 pt-4 pb-6">
        <div className="bg-surface-primary relative">
         <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-surface-primary translate-y-full"
          style={{
           clipPath:
            'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
          }}
         />
         <div className="p-6">
          <div className="space-y-4">
           {appointmentType === 'Storage Unit Access' || appointmentType === 'End Storage Term' ? (
            <>
             {requestedStorageUnits.length > 0 ? (
              requestedStorageUnits.map((unit) => (
               <div key={unit.id} className="flex justify-between items-center">
                <span className="text-sm">{`Boombox ${unit.storageUnitNumber} Access`}</span>
                <span className="text-sm font-medium">{formatCurrencyCompact(accessStorageUnitPricing)}</span>
               </div>
              ))
             ) : (
              <div className="flex justify-between items-center">
               <span className="text-sm">
                {`${numberOfUnits} Boombox ${numberOfUnits > 1 ? 'Deliveries' : 'Delivery'}`}
               </span>
               <span className="text-sm font-medium">
                {formatCurrencyCompact(accessStorageUnitPricing * numberOfUnits)}
               </span>
              </div>
             )}
            </>
           ) : (
            <div className="flex justify-between items-center">
             <span className="text-sm">{`${numberOfUnits} Boombox${numberOfUnits > 1 ? 'es' : ''}`}</span>
             <span className="text-sm font-medium">
              {formatCurrencyCompact(monthlyStorageRate || 0)}/mo
             </span>
            </div>
           )}
           <div className="flex justify-between items-center">
            <span className="text-sm">
             {movingPartnerName || thirdPartyTitle || planType || 'Loading Help'}
            </span>
            <div>
             {loadingHelpPrice === 0 && (
              <span className="text-text-tertiary text-xs mr-1">Free! 1st hour</span>
             )}
             <span className="text-sm font-medium">{formatCurrencyCompact(loadingHelpPrice || 0)}/hr</span>
            </div>
           </div>
           {appointmentType !== 'Storage Unit Access' && appointmentType !== 'End Storage Term' && (
            <div className="flex justify-between items-center">
             <span className="text-sm">{insuranceCoverage}</span>
             <span className="text-sm font-medium">
              {formatCurrencyCompact(monthlyInsuranceRate || 0)}/mo
             </span>
            </div>
           )}
           <div className="h-px bg-border my-2"></div>
           <div className="flex justify-between items-center">
            <div className="flex items-center">
             <span className="text-sm font-semibold mr-1">Total</span>
             <Tooltip text="This is the total amount you will pay on the day of your appointment" />
            </div>
            <span className="text-sm font-semibold">{formatCurrencyCompact(calculateTotal())}</span>
           </div>
          </div>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Cancel and Edit buttons - only show if no tracking URL */}
    {!trackingUrl && (
     <>
      <button
       onClick={() => setIsCancelModalOpen(true)}
       className="px-4 py-4 flex items-center justify-between w-full text-text-primary sm:hover:bg-slate-50 active:bg-surface-tertiary"
      >
       <div className="flex items-center">
        <NoSymbolIcon className="w-5 h-5 mr-2 text-text-primary" />
        <span className="text-sm">Cancel Appointment</span>
       </div>
       <ChevronRightIcon className="w-4 h-4 text-text-primary" />
      </button>
      <button
       onClick={isEditDisabled ? undefined : handleEditClick}
       disabled={isEditDisabled}
       className={`px-4 py-4 flex items-center justify-between w-full rounded-b-md border-t border-border ${
        isEditDisabled
         ? 'text-text-disabled cursor-not-allowed bg-slate-100'
         : 'text-text-primary sm:hover:bg-slate-50 active:bg-surface-tertiary'
       }`}
       aria-disabled={isEditDisabled}
      >
       <div className="flex items-center">
        <PencilSquareIcon className={`w-5 h-5 mr-2 ${isEditDisabled ? 'text-text-disabled' : 'text-text-primary'}`} />
        <span className="text-sm">Edit Appointment</span>
       </div>
       <div className="flex items-center gap-1">
        {isEditDisabled && (
         <Tooltip text={isAppointmentPassed 
          ? "This appointment has already passed and cannot be edited."
          : "Edits can only be made with more than 24 hours notice. Please contact support for assistance."
         }>
          <InformationCircleIcon className="w-5 h-5 text-text-tertiary font-medium" />
         </Tooltip>
        )}
        <ChevronRightIcon className={`w-4 h-4 shrink-0 ${isEditDisabled ? 'text-text-disabled' : 'text-text-primary'}`} />
       </div>
      </button>
     </>
    )}
   </div>

   {/* Cancellation Modal */}
   <Modal
    open={isCancelModalOpen}
    onClose={() => setIsCancelModalOpen(false)}
    title="Tell us why you need to cancel"
    size="md"
   >
    <div className="space-y-4">
     {isWithin24Hours && (
      <div className="bg-status-bg-warning p-3 border border-border-warning rounded-md">
       <p className="text-sm text-status-warning">
        Your order is subject to a <span className="font-semibold">{formatCurrency(cancelationPricing.fee)} cancellation fee</span>. We require at least 24 hours notice to avoid a cancellation fee.
       </p>
      </div>
     )}

     <div>
      <div className="space-y-2">
       {(appointmentType === 'Storage Unit Access' || appointmentType === 'End Storage Term'
        ? ACCESS_STORAGE_CANCELLATION_OPTIONS
        : CANCELLATION_OPTIONS
       ).map((option) => (
        <label
         key={option}
         className={`flex items-center p-4 border-2 rounded-md cursor-pointer ${
          cancellationReason === option
           ? 'border-2 border-primary bg-surface-primary'
           : 'bg-slate-100 border-slate-100'
         }`}
        >
         <input
          type="radio"
          name="cancellation-reason"
          value={option}
          checked={cancellationReason === option}
          onChange={(e) => setCancellationReason(e.target.value)}
          className="mr-3 accent-primary w-4 h-4"
         />
         <span className="text-sm text-text-primary">{option}</span>
        </label>
       ))}
      </div>
     </div>

     <div className="bg-status-bg-warning border border-border-warning rounded-md p-4 mb-8">
      <p className="text-status-warning text-sm">
        Once canceled, your time is no longer reserved and your rate is subject to change.
      </p>
     </div>

    <div className="flex justify-end gap-3 pt-8">
     <Button
      onClick={() => setIsCancelModalOpen(false)}
      variant="secondary"
      size="md"
      disabled={isCancelling}
     >
      Keep Appointment
     </Button>
     <Button
      onClick={handleCancelAppointment}
      variant="primary"
      size="md"
      disabled={!cancellationReason || isCancelling}
      loading={isCancelling}
     >
      Confirm
     </Button>
    </div>
    </div>
   </Modal>
  </div>
 );
}

export default AppointmentCard;

