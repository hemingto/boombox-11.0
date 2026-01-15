/**
 * @fileoverview Remove button client component for driver invitations
 * Allows moving partners to delete pending driver invitations
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/primitives/Button';
import { deleteDriverInvite } from '@/lib/services/driverInvitationService';

interface RemoveInviteButtonProps {
  moverId: number;
  token: string;
  email: string;
}

export function RemoveInviteButton({ 
  moverId, 
  token, 
  email, 
}: RemoveInviteButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await deleteDriverInvite(moverId, token);
      // Page will auto-refresh due to revalidatePath in the server action
    } catch (err) {
      console.error('Error removing invite:', err);
      // Could add error toast here
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Button
      onClick={handleRemove}
      loading={isRemoving}
      variant="ghost"
      size="sm"
      className="text-status-error hover:bg-status-bg-error bg-red-50 active:bg-red-50"
      aria-label={`Remove invitation for ${email}`}
    >
      Remove
    </Button>
  );
}

