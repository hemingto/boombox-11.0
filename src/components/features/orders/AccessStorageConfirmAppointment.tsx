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
import { Modal, Button } from '@/components/ui/primitives';
import { useAccessStorageFormState, useAccessStorageForm_RHF, useAccessStorageContext } from './AccessStorageProvider';

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
  const { formState } = useAccessStorageFormState();
  const { isEditMode, appointmentId } = useAccessStorageContext();
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
          {isEditMode && (
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-tertiary border border-border text-text-secondary text-sm font-medium">
                <span className="w-2 h-2 bg-status-warning rounded-full mr-2" aria-hidden="true"></span>
                Editing Appointment {appointmentId && `#${appointmentId}`}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 lg:-ml-10">
            <button
              type="button"
              onClick={handleBackClick}
              className="w-8 cursor-pointer shrink-0 text-text-primary hover:text-primary focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Go back to previous step"
            >
              <ChevronLeftIcon className="w-8" />
            </button>
            <h1 className="text-4xl text-text-primary">
              {isEditMode ? 'Confirm appointment changes' : 'Confirm appointment'}
            </h1>
          </div>
          {isEditMode && (
            <p className="text-text-secondary text-lg mt-2 ml-10">
              Review your changes below. Your appointment will be updated when you submit.
            </p>
          )}
        </header>

        {/* Description Section */}
        <section className="form-group" aria-labelledby="description-heading">
          <h2 id="description-heading" className="form-label">
            Provide relevant information about your delivery
          </h2>
          
          <div className="mt-4">
            <label htmlFor="delivery-description" className="sr-only">
              Additional delivery information
            </label>
            <textarea
              id="delivery-description"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Let us know if there are stairs, narrow hallways, or tough parking conditions..."
              className="input-field h-36 sm:h-32 resize-none"
              aria-describedby="description-help"
              rows={4}
            />
            <div id="description-help" className="form-helper">
              Optional: Provide additional information about your delivery location or special requirements
            </div>
          </div>
        </section>

        {/* Payment Information */}
        <section className="form-group" aria-labelledby="payment-info-heading">
          <h2 id="payment-info-heading" className="sr-only">Payment Information</h2>
          
          <div className="card p-4 max-w-fit">
            <p className="text-sm text-text-secondary mb-3">
              {isEditMode 
                ? "Changes to your appointment may affect pricing. Any additional charges will be processed on your default payment method."
                : "You won't be charged anything today. Your payment will be processed on the default card on file."
              }
            </p>
            
            {/* Payment Details Modal */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-text-primary p-0 h-auto font-normal hover:text-primary focus:text-primary"
              aria-describedby="payment-modal-description"
            >
              <span className="text-sm underline">
                {isEditMode ? "How do appointment changes affect billing?" : "When will I be charged?"}
              </span>
            </Button>
            
            <div id="payment-modal-description" className="sr-only">
              Opens a dialog with detailed information about payment timing and cancellation policies
            </div>
            
            <Modal
              open={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              title={isEditMode ? "How do appointment changes affect billing?" : "When will I be charged?"}
              size="md"
              showCloseButton={true}
              closeOnOverlayClick={true}
            >
              <div className="space-y-4 text-sm text-text-secondary">
                {isEditMode ? (
                  <>
                    <p className="leading-relaxed">
                      When you update your appointment, we&apos;ll calculate any price differences based on your changes. If the new total is higher, the difference will be charged to your default payment method. If it&apos;s lower, you&apos;ll receive a credit or refund.
                    </p>
                    
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">
                        What changes affect pricing?
                      </h4>
                      <p className="leading-relaxed">
                        Changes to your storage units, labor selection, or appointment date may affect the total cost. The updated pricing will be shown in your quote before you confirm the changes.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">
                        Cancellation policy still applies
                      </h4>
                      <p className="leading-relaxed">
                        Please make changes at least 48 hours in advance to avoid cancellation fees. Same-day changes may incur additional charges.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="leading-relaxed">
                      Reserving is free! You&apos;ll only be charged for your first month of storage and the pickup fee after your appointment is completed. We&apos;ll run a pre-authorization check 7 days before your appointment to ensure there are enough funds. If your appointment is in less than 7 days, we&apos;ll do the check right after booking. This hold will be released once the check is done.
                    </p>
                    
                    <div>
                      <h4 className="font-medium text-text-primary mb-2">
                        What if I need to reschedule?
                      </h4>
                      <p className="leading-relaxed">
                        Please reschedule or cancel at least 48 hours in advance to avoid a $100 fee. If you cancel on the day of your appointment, the fee increases to $200. It&apos;s easy to make changes online!
                      </p>
                    </div>
                  </>
                )}
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
