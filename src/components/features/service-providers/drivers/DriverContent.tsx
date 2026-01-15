/**
 * @fileoverview Driver content management component for moving partners
 * @source boombox-10.0/src/app/components/mover-account/drivercontent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Main driver management interface for moving partners to invite and manage their drivers.
 * Features driver invitation via email or SMS, success confirmation, and driver list display.
 * Provides toggle between email and phone input methods for flexible invitation delivery.
 * 
 * API ROUTES UPDATED:
 * - Old: /api/movers/[moverId]/invite-driver
 * - New: /api/moving-partners/[id]/invite-driver (per api-routes-migration-tracking.md)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic design tokens:
 *   - bg-zinc-950 → bg-primary (buttons)
 *   - hover:bg-zinc-800 → hover:bg-primary-hover
 *   - active:bg-zinc-700 → active:bg-primary-active
 *   - text-white → text-text-inverse (button text)
 *   - text-zinc-950 → text-text-primary (text)
 *   - text-emerald-500 → text-status-success (success icon)
 *   - text-red-600 → text-status-error (error text)
 * - Replaced InformationalPopup with Modal component (per user preference)
 * - Applied consistent transition classes
 * 
 * ACCESSIBILITY ENHANCEMENTS:
 * - Added proper ARIA labels for form sections
 * - Enhanced button states with aria-disabled
 * - Added screen reader announcements for success/error states
 * - Proper focus management in modal
 * - Semantic HTML structure with sections and headings
 * - Form field associations with labels
 * - Live region for status updates
 * 
 * @refactor Migrated from mover-account to service-providers/drivers folder structure.
 * Replaced InformationalPopup with Modal component. Applied design system semantic color
 * tokens throughout. Enhanced accessibility with proper ARIA labels and semantic HTML.
 * Updated API route to use moving-partners endpoint per migration tracking.
 */

'use client';

import { useState, useCallback, ReactNode } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal/Modal';
import { Button } from '@/components/ui/primitives/Button/Button';
import EmailInput from '@/components/forms/EmailInput';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import MoverPartnerDriver from './MoverPartnerDriver';
import { inviteDriver } from '@/lib/services/driverInvitationService';

export interface DriverContentProps {
  /** Moving partner ID */
  moverId: string;
  /** Driver invites Server Component passed from page */
  driverInvites: ReactNode;
  /** Optional callback when driver is invited */
  onDriverInvited?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

export const DriverContent: React.FC<DriverContentProps> = ({
  moverId,
  driverInvites,
  onDriverInvited,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Memoized callback to clear error state
  const handleClearError = useCallback(() => {
    setError('');
  }, []);

  const resetForm = useCallback(() => {
    setEmail('');
    setPhone('');
    setError('');
    setSuccess('');
    setShowSuccessMessage(false);
  }, []);

  const toggleInputMethod = useCallback(() => {
    setShowEmailInput(!showEmailInput);
    setError('');
  }, [showEmailInput]);

  const handleOpenModal = useCallback(() => {
    resetForm();
    setShowInviteModal(true);
  }, [resetForm]);

  const handleCloseModal = useCallback(() => {
    setShowInviteModal(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use Server Action to invite driver
      // revalidatePath() is called automatically in the Server Action
      // The DriverInvites Server Component will auto-refresh
      await inviteDriver(
        parseInt(moverId, 10),
        email || phone, // Send email or phone
        15
      );

      setSuccess('Invitation sent successfully!');
      setShowSuccessMessage(true);
      
      if (onDriverInvited) {
        onDriverInvited();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-96 sm:mb-60 ${className}`}
      role="region"
      aria-label="Driver management"
    >
      {/* Driver Invites Table - Server Component passed as prop */}
      {driverInvites}

      {/* Header with Add Driver Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 sm:mb-0">
          Your drivers
        </h2>

        <Button
          onClick={handleOpenModal}
          variant="primary"
          size="md"
          aria-label="Add new driver"
        >
          Add Driver
        </Button>
      </div>

      {/* Driver List */}
      <MoverPartnerDriver moverId={moverId} />

      {/* Add Driver Modal */}
      <Modal
        open={showInviteModal}
        onClose={handleCloseModal}
        title={showSuccessMessage ? '' : 'Send driver invite'}
        size="md"
        showCloseButton={true}
        closeOnOverlayClick={false}
      >
        {showSuccessMessage ? (
          /* Success State */
          <div className="text-center py-6" role="status" aria-live="polite">
            <CheckCircleIcon 
              className="text-status-success w-16 h-16 mx-auto mb-4" 
              aria-hidden="true"
            />
            <h3 className="text-2xl text-text-primary font-bold mb-4">
              Success!
            </h3>
            <p className="text-text-primary mb-6">
              The invitation has been sent successfully.
            </p>
            <Button
              onClick={handleCloseModal}
              variant="primary"
              size="md"
              aria-label="Close success message"
            >
              Done
            </Button>
          </div>
        ) : (
          /* Invitation Form */
          <div className="mt-2">
            <fieldset className="mb-4" disabled={isLoading}>
              <legend className="sr-only">
                Choose invitation method: {showEmailInput ? 'Email' : 'Phone'}
              </legend>

              {showEmailInput ? (
                <EmailInput
                  value={email}
                  onEmailChange={setEmail}
                  hasError={!!error && !!email}
                  errorMessage={error}
                  onClearError={handleClearError}
                  placeholder="Enter driver's email address"
                  aria-label="Driver Email"
                  label="Driver Email"
                />
              ) : (
                <PhoneNumberInput
                  value={phone}
                  onChange={setPhone}
                  hasError={!!error && !!phone}
                  errorMessage={error}
                  onClearError={handleClearError}
                  placeholder="Enter driver's phone number"
                  label="Driver Phone"
                />
              )}
            </fieldset>

            {/* Toggle Input Method */}
            <p className="text-sm text-text-primary mb-12">
              Would you rather send the invite via{' '}
              <button
                type="button"
                onClick={toggleInputMethod}
                disabled={isLoading}
                className="underline font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-border-focus rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Switch to ${showEmailInput ? 'phone' : 'email'} invitation`}
              >
                {showEmailInput ? 'text instead' : 'email instead'}
              </button>
              ?
            </p>

            {/* Error Message for Empty Input */}
            {error && !email && !phone && (
              <div 
                className="text-status-error text-sm mb-4"
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={handleCloseModal}
                disabled={isLoading}
                variant="secondary"
                size="md"
                aria-label="Cancel invitation"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (showEmailInput ? !email : !phone)}
                loading={isLoading}
                variant="primary"
                size="md"
                aria-label="Send driver invitation"
              >
                {isLoading ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DriverContent;

