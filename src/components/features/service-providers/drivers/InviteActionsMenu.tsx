/**
 * @fileoverview Invite actions dropdown menu client component for driver invitations
 * Provides ellipsis dropdown menu with Resend and Remove actions, including confirmation modal
 * 
 * @source Modeled after boombox-11.0/src/components/features/service-providers/vehicle/AddedVehicle.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Ellipsis icon button that toggles dropdown menu
 * - Dropdown menu with "Resend" and "Remove" options
 * - Confirmation modal before removing an invitation
 * - Uses useClickOutside hook to close menu when clicking outside
 * - Calls service functions for resending and removing invites
 */

'use client';

import { useState, useRef } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal';
import { Button } from '@/components/ui/primitives/Button';
import { useClickOutside } from '@/hooks/useClickOutside';
import { resendDriverInvite, deleteDriverInvite } from '@/lib/services/driverInvitationService';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';

interface InviteActionsMenuProps {
  moverId: number;
  token: string;
  email: string;
  canResend: boolean;
}

/**
 * Format contact info for display - formats phone numbers, leaves emails as-is
 */
function formatContactForDisplay(contact: string): string {
  if (isValidEmail(contact)) {
    return contact;
  }
  return formatPhoneNumberForDisplay(contact);
}

export function InviteActionsMenu({ 
  moverId, 
  token, 
  email, 
  canResend 
}: InviteActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(optionsRef, () => setIsMenuOpen(false));

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleResendClick = async () => {
    setIsMenuOpen(false);
    
    try {
      setIsResending(true);
      await resendDriverInvite(moverId, token);

      // Show "Sent" state temporarily
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
      }, 30000);

    } catch (err) {
      console.error('Error resending invite:', err);
      // Could add error toast here
    } finally {
      setIsResending(false);
    }
  };

  const handleRemoveClick = () => {
    setShowDeleteConfirmation(true);
    setIsMenuOpen(false);
  };

  const handleConfirmRemove = async () => {
    try {
      setIsRemoving(true);
      await deleteDriverInvite(moverId, token);
      setShowDeleteConfirmation(false);
      // Page will auto-refresh due to revalidatePath in the server action
    } catch (err) {
      console.error('Error removing invite:', err);
      // Could add error toast here
    } finally {
      setIsRemoving(false);
    }
  };

  const formattedContact = formatContactForDisplay(email);

  return (
    <>
      <div className="relative" ref={optionsRef}>
        <button 
          onClick={toggleMenu}
          aria-label="Invite options"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="p-1 rounded-full hover:bg-surface-tertiary focus-visible"
          disabled={isResending}
        >
          <EllipsisHorizontalIcon className="w-6 h-6 text-text-primary" />
        </button>
        
        {isMenuOpen && (
          <div 
            role="menu"
            className="absolute w-36 right-0 top-8 bg-surface-primary border border-border rounded-md shadow-custom-shadow z-10"
          >
            <button
              role="menuitem"
              onClick={handleResendClick}
              disabled={!canResend || isSent || isResending}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary rounded-t-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSent ? 'Sent' : isResending ? 'Sending...' : 'Resend'}
            </button>
            <button
              role="menuitem"
              onClick={handleRemoveClick}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-tertiary focus-visible focus:bg-surface-secondary rounded-b-md"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        title="Remove Invitation"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-text-primary">
            Are you sure you want to remove the invitation for <span className="font-medium">{formattedContact}</span>?
          </p>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default InviteActionsMenu;

