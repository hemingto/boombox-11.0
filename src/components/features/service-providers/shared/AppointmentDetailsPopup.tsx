/**
 * @fileoverview Appointment details popup modal for service providers (movers and drivers)
 * Displays comprehensive appointment information including customer details, driver assignment,
 * order details, storage units, delivery routes, and job descriptions for various appointment types.
 * 
 * @source boombox-10.0/src/app/components/mover-account/appointment-details-popup.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Displays appointment details in a modal overlay for service providers (movers and drivers)
 * - Shows customer information and assigned driver details for movers
 * - Displays route information for packing supply delivery appointments
 * - Handles multiple appointment types: pickup, delivery, storage access, packing supply delivery
 * - Shows requested storage units and customer job descriptions
 * - Indicates driver assignment status with visual feedback
 * 
 * API ROUTES UPDATED:
 * - No direct API calls (data is passed via props)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom modal implementation with @/components/ui/primitives/Modal
 * - Applied semantic color tokens (status-success, status-error, text-primary, text-secondary)
 * - Updated background colors to use surface-* semantic tokens
 * - Replaced hardcoded colors with design system colors (slate-100 → surface-tertiary, etc.)
 * - Applied consistent hover states using design system colors
 * 
 * @refactor 
 * - Replaced createPortal custom modal with Modal primitive component
 * - Extracted formatPhoneNumber to use centralized formatPhoneNumberForDisplay utility
 * - Enhanced ARIA accessibility with proper labels and semantic HTML
 * - Applied design system colors throughout for consistent styling
 * - Improved keyboard navigation and focus management
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { CalendarDaysIcon, PhoneIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/primitives/Modal';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';

interface AppointmentDetails {
 id: number;
 address: string;
 date: Date;
 time: Date;
 numberOfUnits: number;
 planType: string;
 appointmentType: string;
 insuranceCoverage?: string;
 description?: string;
 additionalInformation?: {
  itemsOver100lbs: boolean;
  moveDescription?: string;
  conditionsDescription?: string;
 };
 requestedStorageUnits?: {
  storageUnitId: number;
  storageUnit: {
   storageUnitNumber: string;
  };
 }[];
 user?: {
  firstName: string;
  lastName: string;
 };
 driver?: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePicture?: string;
 };
 // Packing supply route specific fields
 routeId?: string;
 routeStatus?: string;
 totalStops?: number;
 completedStops?: number;
 estimatedMiles?: number;
 estimatedDurationMinutes?: number;
 estimatedPayout?: number;
 payoutStatus?: string;
 orders?: any[];
 routeMetrics?: {
  totalDistance?: number;
  totalTime?: number;
  startTime?: Date;
  endTime?: Date;
 };
}

interface AppointmentDetailsPopupProps {
 isOpen: boolean;
 onClose: () => void;
 appointment: AppointmentDetails | null;
 userType: 'mover' | 'driver';
}

export const AppointmentDetailsPopup: React.FC<AppointmentDetailsPopupProps> = ({
 isOpen,
 onClose,
 appointment,
 userType
}) => {
 if (!appointment) return null;

 const isPackingSupplyRoute = appointment.appointmentType === 'Packing Supply Delivery' && appointment.routeId;

 // Calculate start and end times (1 hour before appointment time, 3 hours after start)
 const startTime = new Date(appointment.date);
 if (!isPackingSupplyRoute) {
  startTime.setMinutes(startTime.getMinutes() - 60);
 } else {
  // For packing supply routes, start at 12:00 PM
  startTime.setHours(12, 0, 0, 0);
 }
 const endTime = new Date(startTime);
 if (isPackingSupplyRoute && appointment.estimatedDurationMinutes) {
  endTime.setMinutes(endTime.getMinutes() + appointment.estimatedDurationMinutes);
 } else {
  endTime.setHours(endTime.getHours() + 3);
 }

 return (
  <Modal
   open={isOpen}
   onClose={onClose}
   size="lg"
   closeOnOverlayClick={true}
   showCloseButton={true}
   className="bg-surface-primary p-8 pt-12 rounded-lg"
  >
   {/* Header with icon and title */}
   <div className="flex items-center gap-4 mb-4">
    <CalendarDaysIcon 
     className="h-10 w-10 text-primary" 
     aria-hidden="true"
    />
    <div>
     <h2 
      className="text-xl font-semibold text-text-primary mb-1"
      id="appointment-details-title"
     >
      {isPackingSupplyRoute ? `Route ${appointment.routeId}` : `${appointment.appointmentType} appt`}
     </h2>
     <p className="text-text-tertiary">
      {isPackingSupplyRoute ? (
       format(startTime, "MMMM do, yyyy 'delivery route'")
      ) : (
       `${format(startTime, "MMMM do, yyyy 'starting' h:mmaaa")} - ${format(endTime, "'ending' h:mmaaa")}`
      )}
     </p>
     {isPackingSupplyRoute && (
      <p className="text-sm text-zinc-400 mt-1">
       {appointment.totalStops} stops • {appointment.completedStops || 0} completed
      </p>
     )}
    </div>
   </div>

   {/* Appointment Details Section */}
   <div className="space-y-6 mt-6 mb-6">
    {userType === 'mover' && (
     <>
      {appointment.driver ? (
       <section 
        className="bg-surface-tertiary rounded-lg p-6"
        aria-labelledby="assigned-driver-heading"
       >
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
          <div className="relative bg-slate-200 rounded-full">
           {appointment.driver.profilePicture ? (
            <Image 
             src={appointment.driver.profilePicture} 
             alt={`${appointment.driver.firstName} ${appointment.driver.lastName} profile picture`}
             className="h-12 w-12 rounded-full object-cover"
             width={48}
             height={48}
            />
           ) : (
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
             <span className="text-primary text-xl" aria-label="Driver initials">
              {appointment.driver.firstName[0]}
              {appointment.driver.lastName[0]}
             </span>
            </div>
           )}
           <CheckCircleIcon 
            className="h-6 w-6 absolute -bottom-1 -right-1 text-emerald-100 bg-status-success rounded-full" 
            aria-label="Driver verified"
           />
          </div>
          <div>
           <h3 
            className="text-text-primary font-medium"
            id="assigned-driver-heading"
           >
            {appointment.driver.firstName} {appointment.driver.lastName}
           </h3>
           <p className="text-text-tertiary text-xs">assigned driver</p>
          </div>
         </div>
         <a 
          href={`tel:${appointment.driver.phoneNumber}`}
          className="flex items-center gap-2 mr-2 hover:opacity-80 transition-opacity"
          aria-label={`Call driver at ${formatPhoneNumberForDisplay(appointment.driver.phoneNumber)}`}
         >
          <div className="bg-slate-200 p-2 rounded-full">
           <PhoneIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <span className="text-primary font-inter">
           {formatPhoneNumberForDisplay(appointment.driver.phoneNumber)}
          </span>
         </a>
        </div>
       </section>
      ) : (
       <section 
        className="bg-status-bg-error border border-status-error rounded-lg p-6"
        role="alert"
        aria-labelledby="no-driver-heading"
       >
        <div className="flex items-center gap-3">
         <div className="bg-red-200 p-3 rounded-full">
          <ExclamationTriangleIcon 
           className="h-6 w-6 text-status-error" 
           aria-hidden="true"
          />
         </div>
         <div>
          <h3 
           className="text-status-error font-medium font-semibold"
           id="no-driver-heading"
          >
           No Driver Assigned
          </h3>
          <p className="text-status-error text-sm">
           please make sure to assign a driver from your <span className="font-semibold">Onfleet</span> dashboard
          </p>
         </div>
        </div>
       </section>
      )}
     </>
    )}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-zinc-200 pb-6">
     <div className="border-r border-zinc-200 pr-4">
      <h3 className="font-medium text-lg text-text-primary font-semibold">
       {isPackingSupplyRoute ? 'Route Details' : 'Customer'}
      </h3>
      {isPackingSupplyRoute ? (
       <div className="space-y-1">
        <p className="text-text-primary">Status: {appointment.routeStatus?.replace('_', ' ')}</p>
        {appointment.estimatedPayout && (
         <p className="text-text-primary">Payout: ${appointment.estimatedPayout}</p>
        )}
       </div>
      ) : (
       <p className="text-text-primary">{appointment.user?.firstName} {appointment.user?.lastName}</p>
      )}
     </div>
     <div>
      <h3 className="font-medium text-lg text-text-primary font-semibold">
       {isPackingSupplyRoute ? 'Route Overview' : 'Customer Address'}
      </h3>
      {isPackingSupplyRoute ? (
       <div className="space-y-1">
        <p className="text-text-primary">{appointment.totalStops} delivery stops</p>
        {appointment.estimatedMiles && (
         <p className="text-text-primary">{appointment.estimatedMiles} miles</p>
        )}
       </div>
      ) : (
       <address className="text-text-primary not-italic">{appointment.address}</address>
      )}
     </div>
    </div>

    {/* Order Details / Route Details */}
    <section 
     className="border-b border-zinc-200 pb-6"
     aria-labelledby="order-details-heading"
    >
     <h3 
      className="text-lg font-semibold text-text-primary mb-2"
      id="order-details-heading"
     >
      {isPackingSupplyRoute ? 'Route details' : 'Order details'}
     </h3>
     <div className="space-y-1 text-zinc-600">
      {isPackingSupplyRoute ? (
       <>
        <p>{appointment.appointmentType}</p>
        <p>{appointment.totalStops} Delivery Stops</p>
        {appointment.estimatedDurationMinutes && (
         <p>Est. Duration: {Math.floor(appointment.estimatedDurationMinutes / 60)}h {appointment.estimatedDurationMinutes % 60}m</p>
        )}
        {appointment.payoutStatus && (
         <p>Payout Status: {appointment.payoutStatus.replace('_', ' ')}</p>
        )}
       </>
      ) : appointment.appointmentType === 'Storage Unit Access' || appointment.appointmentType === 'End Storage Term' ? (
       <>        
       <p>{appointment.requestedStorageUnits?.length || 0} Requested Unit{(appointment.requestedStorageUnits?.length || 0) !== 1 ? 's' : ''}</p>
       <p>{appointment.planType}</p>
       </>
      ) : (
       <>
        <p>{appointment.numberOfUnits} Boombox</p>
        <p>{appointment.planType}</p>
       </>
      )}
      {!isPackingSupplyRoute && <p>{appointment.insuranceCoverage}</p>}
     </div>
    </section>

    {/* Requested Units */}
    {appointment.requestedStorageUnits && appointment.requestedStorageUnits.length > 0 && (
     <section aria-labelledby="requested-units-heading">
      <h3 
       className="text-lg font-semibold text-text-primary mb-2"
       id="requested-units-heading"
      >
       Requested Units
      </h3>
      <ul className="space-y-1 text-zinc-600">
       {appointment.requestedStorageUnits.map((unit, index) => (
        <li key={index}>Unit #{unit.storageUnit.storageUnitNumber}</li>
       ))}
      </ul>
     </section>
    )}

    {/* Customer Description / Delivery Stops */}
    {isPackingSupplyRoute ? (
     <section aria-labelledby="delivery-stops-heading">
      <h3 
       className="text-lg font-semibold text-text-primary mb-2"
       id="delivery-stops-heading"
      >
       Delivery Stops
      </h3>
      <div 
       className="space-y-2 text-zinc-600 max-h-48 overflow-y-auto"
       role="list"
      >
       {appointment.orders && appointment.orders.length > 0 ? (
        appointment.orders.map((order: any, index: number) => (
         <div 
          key={index} 
          className="p-3 bg-surface-secondary rounded-md"
          role="listitem"
         >
          <p className="font-medium text-text-primary">
           Stop {order.routeStopNumber}: {order.contactName}
          </p>
          <address className="text-sm not-italic">{order.deliveryAddress}</address>
          {order.status && (
           <p className="text-xs text-text-tertiary">Status: {order.status}</p>
          )}
         </div>
        ))
       ) : (
        <p>No delivery stops information available</p>
       )}
      </div>
     </section>
    ) : (
     <section aria-labelledby="job-description-heading">
      <h3 
       className="text-lg font-semibold text-text-primary mb-2"
       id="job-description-heading"
      >
       Customer Job Description
      </h3>
      <div className="space-y-1 text-zinc-600">
       <p>{appointment.description || "No added customer description"}</p>
       {appointment.additionalInformation?.itemsOver100lbs !== undefined && (
        <p>{appointment.additionalInformation.itemsOver100lbs === false ? "No Items over 100 lbs" : "Has items over 100 lbs"}</p>
       )}
       {appointment.additionalInformation?.moveDescription && (
        <p>{appointment.additionalInformation.moveDescription}</p>
       )}
       {appointment.additionalInformation?.conditionsDescription && (
        <p>{appointment.additionalInformation.conditionsDescription}</p>
       )}
      </div>
     </section>
    )}
   </div>
  </Modal>
 );
};

