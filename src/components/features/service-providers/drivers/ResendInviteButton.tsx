/**
 * @fileoverview Resend button client component for driver invitations
 * Extracted from DriverInvites to allow Server Component pattern
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/primitives/Button';
import { resendDriverInvite } from '@/lib/services/driverInvitationService';

interface ResendInviteButtonProps {
  moverId: number;
  token: string;
  email: string;
  canResend: boolean;
}

export function ResendInviteButton({ 
  moverId, 
  token, 
  email, 
  canResend 
}: ResendInviteButtonProps) {
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResend = async () => {
    try {
      setIsResending(true);
      await resendDriverInvite(moverId, token);

      // Show "Sent" message
      setIsSent(true);

      // Reset after 30 seconds
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

  return (
    <Button
      onClick={handleResend}
      disabled={!canResend || isSent}
      loading={isResending}
      variant={isSent ? 'ghost' : 'secondary'}
      size="sm"
      className={isSent ? 'bg-status-bg-success hover:bg-status-bg-success text-status-success cursor-default' : ''}
      aria-label={`Resend invitation to ${email}`}
    >
      {isSent ? 'Sent' : 'Resend'}
    </Button>
  );
}

