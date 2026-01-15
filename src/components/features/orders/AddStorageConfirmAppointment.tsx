/**
 * @fileoverview Add Storage Confirm Appointment - Final confirmation step with description input
 * @source boombox-10.0/src/app/components/add-storage/userpageconfirmappointment.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Final step of add storage form for appointment confirmation
 * - Provides textarea for customer to add location details and special instructions
 * - Displays payment information and charging timeline with modal popup
 * - Handles navigation back to previous step based on plan type (DIY vs Full Service)
 * 
 * API ROUTES UPDATED:
 * - No direct API routes (form submission handled by parent component)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced InformationalPopup with Modal component from design system primitives
 * - Applied semantic colors (text-primary, bg-surface-tertiary, border-border)
 * - Used design system form styling for textarea and consistent spacing
 * 
 * @refactor Replaced InformationalPopup with Modal component, updated form elements to use
 * design system components, applied semantic color tokens throughout
 */

'use client';

import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';

// UI Components
import { Modal } from '@/components/ui/primitives/Modal';
import { TextArea } from '@/components/ui/primitives/TextArea';

// Types
import { AddStorageFormState } from '@/types/addStorage.types';

interface AddStorageConfirmAppointmentProps {
  formState: AddStorageFormState;
  onDescriptionChange: (description: string) => void;
  onGoBack: () => void;
}

export default function AddStorageConfirmAppointment({
  formState,
  onDescriptionChange,
  onGoBack,
}: AddStorageConfirmAppointmentProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onDescriptionChange(event.target.value);
  };

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        {/* Header with back navigation */}
        <header className="flex items-center mb-12 gap-2 lg:-ml-10">
          <button
            type="button"
            onClick={onGoBack}
            className="p-1 rounded-full hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
            aria-label="Go back to previous step"
          >
            <ChevronLeftIcon className="w-8" />
          </button>
          <h1 
            className="text-4xl text-text-primary"
            id="confirmation-title"
          >
            Confirm appointment
          </h1>
        </header>

        {/* Description Input Section */}
        <fieldset className="mb-4">
          <legend className="mb-4 mt-10 text-text-primary">Provide relevant information about your location</legend>
          <div>
            <TextArea
              value={formState.description}
              onChange={handleDescriptionChange}
              placeholder="Let us know if there are stairs, narrow hallways, or tough parking conditions..."
              className="h-36 sm:h-32"
              fullWidth
              resize="none"
              rows={4}
              aria-label="Location details and special instructions"
              aria-describedby="description-help"
            />
            <div 
              id="description-help" 
              className="sr-only"
            >
              Optional field to provide additional details about your location that may help with the delivery
            </div>
          </div>
        </fieldset>  

        {/* Payment Information Section */}
        <section 
          className="flex-col gap-2"
          role="region"
          aria-labelledby="payment-info-heading"
        >
          <h2 
            id="payment-info-heading" 
            className="sr-only"
          >
            Payment Information
          </h2>
          <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border bg-surface-primary rounded-md max-w-fit">
            <p className="text-xs text-text-primary">
              You won&apos;t be charged anything today. Your payment will be processed on the default card on file.
              <br />
              <br />
            </p>
            
            {/* Payment Timeline Modal */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs underline cursor-pointer text-primary font-semibold bg-transparent border-none p-0 underline-offset-2 decoration-dotted hover:decoration-solid"
              aria-label="Learn more about when you will be charged"
            >
              When will I be charged?
            </button>
            
            <Modal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="When will I be charged?"
              size="md"
              aria-labelledby="payment-modal-title"
              aria-describedby="payment-modal-content"
            >
              <div 
                className="space-y-4"
                id="payment-modal-content"
              >
                <p className="text-sm text-text-primary leading-5">
                  Reserving is free! You&apos;ll only be charged for your first month of storage and the pickup fee after your appointment is completed. We&apos;ll run a pre-authorization check 7 days before your appointment to ensure there are enough funds. If your appointment is in less than 7 days, we&apos;ll do the check right after booking. This hold will be released once the check is done.
                </p>
                
                <div className="border-t border-border pt-4 pb-6">
                  <h4 
                    className="font-semibold text-text-primary mb-2"
                    id="reschedule-heading"
                  >
                    What if I need to reschedule?
                  </h4>
                  <p 
                    className="text-sm text-text-primary leading-5"
                    aria-labelledby="reschedule-heading"
                  >
                    Please reschedule or cancel at least 48 hours in advance to avoid a $100 fee. If you cancel on the day of your appointment, the fee increases to $200. It&apos;s easy to make changes online!
                  </p>
                </div>
              </div>
            </Modal>
          </div>
        </section>
      </div>
    </div>
  );
}
