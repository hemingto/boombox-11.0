/**
 * @fileoverview Driver invites management SERVER component for moving partners
 * Displays list of sent driver invitations with status tracking and resend functionality
 * 
 * @source boombox-10.0/src/app/components/mover-account/driverinvites.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * - Server Component that fetches driver invitations directly from database
 * - Shows invitation status (pending, accepted, expired)
 * - Allows resending pending invitations via Client Component button
 * - Returns null if no invites exist (hidden state)
 * - Automatically refetches when revalidatePath() is called
 * 
 * REFACTOR TO SERVER COMPONENT:
 * - Removed 'use client' directive - now a Server Component
 * - Replaced Server Action call with direct Prisma query
 * - Extracted interactive Resend button to ResendInviteButton Client Component
 * - Removed all React hooks (useState, useEffect, useCallback)
 * - Simplified data fetching - no loading states needed
 * - Auto-refresh now works with revalidatePath()
 * 
 * DESIGN SYSTEM:
 * - Uses Badge component for status display
 * - Semantic color tokens throughout
 * - Consistent table layout with proper accessibility
 */

import { prisma } from '@/lib/database/prismaClient';
import { Badge } from '@/components/ui/primitives/Badge';
import { InviteActionsMenu } from './InviteActionsMenu';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';

interface DriverInvite {
  email: string;
  status: string;
  createdAt: Date;
  token: string;
}

interface DriverInvitesProps {
  moverId: string;
}

// Helper functions moved outside component (pure functions)
function getStatusVariant(status: string): 'pending' | 'success' | 'error' | 'default' {
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
}

function getStatusLabel(status: string): string {
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
}

/**
 * Format contact info for display - formats phone numbers, leaves emails as-is
 */
function formatContactForDisplay(contact: string): string {
  // If it looks like an email, return as-is
  if (isValidEmail(contact)) {
    return contact;
  }
  // Otherwise, try to format as phone number
  return formatPhoneNumberForDisplay(contact);
}

// Server Component - async function
export async function DriverInvites({ moverId }: DriverInvitesProps) {
  // Direct Prisma query - fetched on server
  const invites = await prisma.driverInvitation.findMany({
    where: {
      movingPartnerId: parseInt(moverId, 10),
      status: 'pending',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      token: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  // Return null if no invites (hidden state)
  if (invites.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="driver-invites-heading">
      <h2 
        id="driver-invites-heading" 
        className="text-2xl text-text-primary mb-4"
      >
        Driver Invites
      </h2>
      
      <div 
        className="mb-20 p-4 bg-surface-primary rounded-md shadow-custom-shadow"
        role="table"
        aria-label="Driver invitations table"
      >
        {/* Table Header */}
        <div 
          className="grid grid-cols-4 border-b border-border pb-2"
          role="row"
        >
          <div className="text-sm text-text-tertiary" role="columnheader">
            Driver
          </div>
          <div className="text-sm text-text-tertiary text-right" role="columnheader">
            Status
          </div>
          <div className="text-sm text-text-tertiary text-right" role="columnheader">
            Date Sent
          </div>
          <div className="text-sm text-text-tertiary text-right" role="columnheader">
            Options
          </div>
        </div>
        
        {/* Table Body */}
        <div role="rowgroup">
          {invites.map((invite) => {
            const canResend = invite.status === 'pending';
            
            return (
              <div 
                key={invite.token} 
                className="grid grid-cols-4 pt-2 items-center"
                role="row"
              >
                {/* Email or Phone */}
                <div className="text-text-primary font-medium" role="cell">
                  {formatContactForDisplay(invite.email)}
                </div>
                
                {/* Status Badge */}
                <div className="text-right" role="cell">
                  <Badge
                    label={getStatusLabel(invite.status)}
                    variant={getStatusVariant(invite.status)}
                    size="md"
                  />
                </div>
                
                {/* Date */}
                <div className="text-text-primary font-medium text-right" role="cell">
                  {new Date(invite.createdAt).toLocaleDateString()}
                </div>
                
                {/* Actions - Client Component for interactivity */}
                <div className="flex justify-end" role="cell">
                  <InviteActionsMenu
                    moverId={parseInt(moverId, 10)}
                    token={invite.token}
                    email={invite.email}
                    canResend={canResend}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default DriverInvites;
