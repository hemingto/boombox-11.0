/**
 * @fileoverview Access Storage Confirmation Step - Final appointment confirmation
 * @source boombox-10.0/src/app/components/access-storage/accessstorageconfirmappointment.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Final step of the access storage form that allows users to add additional details about their delivery
 * and provides information about payment processing and cancellation policies. Includes smart back navigation
 * based on the selected plan type.
 * 
 * API ROUTES UPDATED:
 * - No direct API routes used in this component (handled by form submission)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced InformationalPopup with Modal component from primitives
 * - Applied semantic color tokens (text-text-primary, bg-surface-primary, etc.)
 * - Used form utility classes for consistent styling
 * - Updated focus states and accessibility attributes
 * 
 * @refactor Replaced InformationalPopup with Modal component, integrated with form context,
 * added comprehensive accessibility support, and updated to use design system colors.
 */

'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Modal } from '@/components/ui/primitives/Modal';
import { TextArea } from '@/components/ui/primitives/TextArea';
import { useAccessStorageForm_RHF } from './AccessStorageProvider';

interface AccessStorageConfirmAppointmentProps {
  goBackToStep1: () => void;
  goBackToStep2: () => void;
  selectedPlanName: string;
}

function AccessStorageConfirmAppointment({
  goBackToStep1,
  goBackToStep2,
  selectedPlanName,
}: AccessStorageConfirmAppointmentProps) {
  const form = useAccessStorageForm_RHF();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Get description from form context
  const description = form.watch('description') || '';
  const setDescription = (value: string) => {
    form.setValue('description', value, { shouldValidate: true, shouldDirty: true });
  };

  const handleBackClick = () => {
    // For DIY plans, go back to scheduling step (Step 2)
    // For labor plans, go back to labor selection step (Step 2)
    // Both cases go to Step 2, but the step content differs based on plan type
    goBackToStep2();
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  return (
    <div className="w-full basis-1/2">
      <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
        {/* Header with Back Button */}
        <header className="mb-12">
          <div className="flex items-center gap-2 lg:-ml-10">
            <button
              type="button"
              onClick={handleBackClick}
              className="p-1 rounded-full hover:bg-surface-tertiary text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2"
              aria-label="Go back to previous step"
            >
              <ChevronLeftIcon className="w-8" />
            </button>
            <h1 className="text-4xl text-text-primary">
              Confirm appointment
            </h1>
          </div>
        </header>

        {/* Description Section */}
        <fieldset className="mb-4">
          <legend className="mb-4 mt-10 text-text-primary">
            Provide relevant information about your delivery
          </legend>
          <div>
            <TextArea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Let us know if there are stairs, narrow hallways, or tough parking conditions..."
              className="h-36 sm:h-32"
              fullWidth
              resize="none"
              rows={4}
              aria-label="Delivery details and special instructions"
              aria-describedby="description-help"
            />
            <div 
              id="description-help" 
              className="sr-only"
            >
              Optional field to provide additional details about your delivery that may help with the appointment
            </div>
          </div>
        </fieldset>

        {/* Payment Information */}
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
            
            {/* Payment Details Modal */}
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs underline cursor-pointer text-primary font-semibold bg-transparent border-none p-0 underline-offset-2 decoration-dotted hover:decoration-solid"
              aria-label="Learn more about when you will be charged"
            >
              When will I be charged?
            </button>

            
            <Modal
              open={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
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
                  <h2 
                    className="text-xl font-semibold text-text-primary mb-4"
                    id="reschedule-heading"
                  >
                    What if I need to reschedule?
                  </h2>
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

// Export memoized component for performance optimization
export default React.memo(AccessStorageConfirmAppointment);
