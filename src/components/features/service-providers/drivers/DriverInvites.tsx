/**
 * @fileoverview Driver invites management component for moving partners
 * Displays list of sent driver invitations with status tracking and resend functionality
 * 
 * @source boombox-10.0/src/app/components/mover-account/driverinvites.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Fetches and displays all driver invitations sent by a moving partner
 * - Shows invitation status (pending, accepted, expired)
 * - Allows resending pending invitations
 * - Displays temporary "Sent" confirmation after resending
 * - Auto-resets "Sent" state after 30 seconds
 * - Returns null if no invites exist (hidden state)
 * 
 * API ROUTES UPDATED:
 * - Old: /api/movers/${moverId}/driver-invites → New: /api/moving-partners/${moverId}/driver-invites
 * - Old: /api/movers/${moverId}/resend-invite → New: /api/moving-partners/${moverId}/resend-invite
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced custom status badges with Badge component using semantic variants
 * - Applied semantic color tokens (text-primary, text-secondary, surface-primary, etc.)
 * - Replaced hardcoded colors with design system tokens
 * - Updated button styling to use design system patterns
 * - Improved error state styling with status colors
 * - Enhanced table layout with consistent borders and spacing
 * 
 * @refactor 
 * - Integrated Badge component for status display
 * - Applied comprehensive design system colors
 * - Enhanced accessibility with proper ARIA labels and roles
 * - Improved component structure and TypeScript interfaces
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/primitives/Badge';

interface DriverInvite {
  email: string;
  status: string;
  createdAt: string;
  token: string;
}

interface DriverInvitesProps {
  moverId: string;
}

export const DriverInvites: React.FC<DriverInvitesProps> = ({ moverId }) => {
  const [invites, setInvites] = useState<DriverInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());

  const fetchInvites = useCallback(async () => {
    try {
      setIsLoading(true);
      // Updated API route
      const response = await fetch(`/api/moving-partners/${moverId}/driver-invites`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver invites');
      }
      
      const data = await response.json();
      setInvites(data);
    } catch (err) {
      console.error('Error fetching driver invites:', err);
      setError('Unable to load driver invites');
    } finally {
      setIsLoading(false);
    }
  }, [moverId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleResend = async (token: string) => {
    try {
      setIsResending(token);
      // Updated API route
      const response = await fetch(`/api/moving-partners/${moverId}/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend invite');
      }

      // Add token to sent invites
      setSentInvites(prev => new Set(Array.from(prev).concat(token)));

      // Reset the "Sent" state after 30 seconds
      setTimeout(() => {
        setSentInvites(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(token);
          return newSet;
        });
      }, 30000);

    } catch (err) {
      console.error('Error resending invite:', err);
      setError('Unable to resend invite');
    } finally {
      setIsResending(null);
    }
  };

  // Error state
  if (error) {
    return (
      <div 
        className="p-6 bg-surface-primary rounded-md shadow-custom-shadow"
        role="alert"
        aria-live="polite"
      >
        <p className="text-status-error">{error}</p>
      </div>
    );
  }

  // Return null if loading or if there are no invites (hidden state)
  if (isLoading || invites.length === 0) {
    return null;
  }

  const getStatusVariant = (status: string): 'pending' | 'success' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'accepted':
        return 'success';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <section aria-labelledby="driver-invites-heading">
      <h2 
        id="driver-invites-heading" 
        className="text-2xl text-text-primary mb-4"
      >
        Driver Invites
      </h2>
      
      <div 
        className="mb-20 p-4 bg-surface-primary rounded-md shadow-custom-shadow overflow-hidden"
        role="table"
        aria-label="Driver invitations table"
      >
        {/* Table Header */}
        <div 
          className="grid grid-cols-4 border-b border-border pb-2"
          role="row"
        >
          <div className="text-sm text-text-secondary" role="columnheader">
            Driver Email
          </div>
          <div className="text-sm text-text-secondary text-right" role="columnheader">
            Status
          </div>
          <div className="text-sm text-text-secondary text-right" role="columnheader">
            Date Sent
          </div>
          <div className="text-sm text-text-secondary text-right" role="columnheader">
            Actions
          </div>
        </div>
        
        {/* Table Body */}
        <div role="rowgroup">
          {invites.map((invite) => {
            const isSent = sentInvites.has(invite.token);
            const canResend = invite.status === 'pending' && !isSent;
            
            return (
              <div 
                key={invite.token} 
                className="grid grid-cols-4 pt-2 items-center"
                role="row"
              >
                {/* Email */}
                <div className="text-text-primary font-medium" role="cell">
                  {invite.email}
                </div>
                
                {/* Status Badge */}
                <div className="text-right" role="cell">
                  <Badge
                    label={getStatusLabel(invite.status)}
                    variant={getStatusVariant(invite.status)}
                    size="sm"
                  />
                </div>
                
                {/* Date */}
                <div className="text-text-primary font-medium text-right" role="cell">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </div>
                
                {/* Actions */}
                <div className="flex justify-end" role="cell">
                  <button
                    onClick={() => handleResend(invite.token)}
                    disabled={isResending === invite.token || !canResend}
                    className={`rounded-md py-1.5 px-3 w-fit transition-colors ${
                      isSent 
                        ? 'bg-status-bg-success cursor-default' 
                        : 'bg-surface-tertiary hover:bg-surface-disabled active:bg-border disabled:bg-surface-tertiary disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                    aria-label={`Resend invitation to ${invite.email}`}
                    aria-busy={isResending === invite.token}
                  >
                    <p className={`font-semibold text-sm ${
                      isSent ? 'text-status-success' : 'text-text-primary'
                    }`}>
                      {isResending === invite.token ? 'Sending...' : isSent ? 'Sent' : 'Resend'}
                    </p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DriverInvites;

