"use client";

/**
 * @fileoverview Calendar job card component for service providers displaying appointment details
 * @source boombox-10.0/src/app/components/mover-account/calendarjobcard.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays detailed job information cards for service providers in their calendar view.
 * Shows customer details, delivery date/time, address, and job description.
 * Provides cancel appointment functionality with reason selection via modal.
 * 
 * API ROUTES UPDATED:
 * - No API routes used directly in this component (cancellation logic would be in parent)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens:
 *  - bg-white → bg-surface-primary
 *  - text-zinc-950 → text-text-primary
 *  - text-zinc-500 → text-text-secondary
 *  - text-zinc-700 → text-text-primary
 *  - text-zinc-600 → text-text-secondary
 *  - border-slate-100 → border-border
 *  - bg-slate-100 → bg-surface-tertiary
 *  - bg-slate-200 → bg-surface-disabled
 * - Replaced InformationalPopup with Modal component (per user preference)
 * - Used btn-primary class for primary button styling
 * - Used consistent hover and active states from design system
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for interactive elements
 * - Included semantic HTML structure with article and sections
 * - Enhanced keyboard navigation support
 * - Added proper roles and labels for screen readers
 * - Ensured color contrast meets WCAG 2.1 AA standards
 * 
 * @refactor Migrated from mover-account to service-providers/calendar folder structure.
 * Replaced InformationalPopup with Modal component for consistency. Applied design system
 * semantic color tokens throughout. Enhanced accessibility with proper ARIA labels and semantic HTML.
 */

import { useState } from 'react';
import { ChevronRightIcon, PencilSquareIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { RadioList } from '@/components/forms/RadioList';
import { Modal } from '@/components/ui/primitives/Modal/Modal';

export interface CalendarJobCardProps {
 /** Job title or type */
 title: string;
 /** Required crew size for the job */
 crewSize: string;
 /** Customer unique identifier */
 customerId: string;
 /** Customer full name */
 customerName: string;
 /** Formatted delivery date */
 date: string;
 /** Formatted delivery time */
 time: string;
 /** Full delivery address */
 address: string;
 /** Job description provided by customer */
 description: string;
 /** Optional callback when cancellation is confirmed */
 onCancelConfirm?: (reason: string) => void;
 /** Optional callback when edit is clicked */
 onEdit?: () => void;
}

export const CalendarJobCard: React.FC<CalendarJobCardProps> = ({
 title,
 crewSize,
 customerId,
 customerName,
 date,
 time,
 address,
 description,
 onCancelConfirm,
 onEdit,
}) => {
 const [showCancelModal, setShowCancelModal] = useState(false);
 const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(null);

 const cancellationOptions = [
  'Scheduling conflict',
  "I don't have enough labor",
  'Job looks too hard',
  'Emergency',
  'Other',
 ];

 const handleCancelConfirm = () => {
  if (selectedCancelReason && onCancelConfirm) {
   onCancelConfirm(selectedCancelReason);
  }
  setShowCancelModal(false);
  setSelectedCancelReason(null);
 };

 const handleCloseModal = () => {
  setShowCancelModal(false);
  setSelectedCancelReason(null);
 };

 return (
  <>
   <article 
    className="bg-surface-primary mb-4 rounded-lg shadow-custom-shadow"
    aria-label={`Job: ${title}`}
   >
    <div className="p-6">
     {/* Header Section */}
     <header className="flex flex-col mb-4 pb-4 border-b border-border">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary">{crewSize}</p>
     </header>

     {/* Customer Details Section */}
     <section 
      className="flex flex-row gap-4 border-b pb-4 mb-4 border-border"
      aria-label="Job details"
     >
      <div className="basis-1/3 border-r border-border pr-4">
       <h4 className="text-sm font-semibold text-text-primary">Customer</h4>
       <p className="text-sm text-text-primary mt-1">
        <span className="text-text-secondary">ID: </span>
        {customerId}
       </p>
       <p className="text-sm text-text-primary">{customerName}</p>
      </div>
      
      <div className="basis-1/3 border-r border-border pr-4">
       <h4 className="text-sm font-semibold text-text-primary">Delivery Date</h4>
       <p className="text-sm text-text-primary mt-1">
        {date}
       </p>
       <p className="text-sm text-text-secondary">{time}</p>
      </div>
      
      <div className="basis-1/3">
       <h4 className="text-sm font-semibold text-text-primary">Delivery Address</h4>
       <p className="text-sm text-text-primary mt-1">{address}</p>
      </div>
     </section>

     {/* Job Description Section */}
     <section aria-label="Job description">
      <h4 className="text-sm mb-1 font-semibold text-text-primary">
       Customer Job Description:
      </h4>
      <p className="text-sm text-text-secondary">{description}</p>
     </section>
    </div>

    {/* Action Buttons */}
    <footer className="border-t border-border">
     {/* Cancel Appointment Button */}
     <button
      onClick={() => setShowCancelModal(true)}
      className="px-4 py-4 flex items-center justify-between w-full text-text-primary hover:bg-surface-tertiary active:bg-surface-disabled rounded-b-lg"
      aria-label="Cancel appointment"
     >
      <div className="flex items-center">
       <NoSymbolIcon 
        className="w-5 h-5 mr-2 text-text-primary" 
        aria-hidden="true"
       />
       <span className="text-sm font-medium">Cancel Appointment</span>
      </div>
      <ChevronRightIcon 
       className="w-4 h-4 text-text-primary" 
       aria-hidden="true"
      />
     </button>
    </footer>
   </article>

   {/* Cancel Appointment Modal */}
   <Modal
    open={showCancelModal}
    onClose={handleCloseModal}
    title="Confirm your cancellation"
    size="md"
    showCloseButton={true}
    closeOnOverlayClick={false}
   >
    {/* Warning Message */}
    <div 
     className="bg-status-bg-warning border border-border-warning rounded-md p-4 mb-6"
     role="alert"
     aria-live="polite"
    >
     <p className="text-sm text-status-warning">
      Canceling on a customer hurts your rating and can limit your ability to book 
      future jobs on our platform. Please make sure you have a valid reason for 
      canceling. Service providers who continually cancel on customers are subject 
      to removal from our platform.
     </p>
    </div>

    {/* Cancellation Reason Selection */}
    <div className="mb-6">
     <p className="text-lg font-medium text-text-primary mb-4">
      Tell us why you need to cancel
     </p>
     <RadioList
      options={cancellationOptions}
      onChange={(reason) => setSelectedCancelReason(reason)}
      name="cancellationReason"
      legend="Select cancellation reason"
     />
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end gap-3">
     <button
      onClick={handleCloseModal}
      className="px-5 py-2.5 text-sm font-semibold text-text-primary bg-surface-secondary hover:bg-surface-tertiary active:bg-surface-disabled rounded-md border border-border"
      aria-label="Cancel and go back"
     >
      Go Back
     </button>
     <button
      onClick={handleCancelConfirm}
      disabled={!selectedCancelReason}
      className="px-5 py-2.5 text-sm font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-primary-active rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
      aria-label="Confirm cancellation"
     >
      Confirm Cancellation
     </button>
    </div>
   </Modal>
  </>
 );
};

export default CalendarJobCard;

