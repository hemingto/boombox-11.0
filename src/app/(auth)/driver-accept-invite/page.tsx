/**
 * @fileoverview Driver invitation acceptance page - driver signup via moving partner invitation
 * @source boombox-10.0/src/app/driver-accept-invite/page.tsx
 * @refactor Migrated to (auth) route group with proper error handling
 * 
 * LAYOUT NOTES:
 * - Navbar is provided by (auth) layout.tsx via MinimalNavbar component
 * - No duplicate navbar should be rendered in this page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DriverSignupHero, DriverSignUpForm } from '@/components/features/drivers';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';
import { H3Icon } from '@heroicons/react/24/outline';

interface InvitationData {
  movingPartnerName: string;
  email: string;
}

export default function DriverAcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [invitationError, setInvitationError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );

  useEffect(() => {
    if (!token) {
      setInvitationError('Invalid invitation link');
      setIsLoading(false);
      return;
    }

    const fetchInvitationData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/drivers/invitation-details?token=${token}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to fetch invitation data'
          );
        }

        const responseJson = await response.json();
        
        // API returns { success: true, data: { movingPartnerName, email } }
        if (responseJson.success && responseJson.data) {
          setInvitationData(responseJson.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching invitation data:', error);
        setInvitationError(
          error instanceof Error
            ? error.message
            : 'Failed to load invitation data. Please try again later.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationData();
  }, [token]);

  if (invitationError) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10">
        <div className="bg-status-bg-error border border-border-error rounded-md p-4">
          <h3 className="text-status-error font-semibold">
            Invalid invitation link
          </h3>
          <p className="text-status-error text-sm">please reach out to help@boomboxstorage.com to help resolve this issue</p>
          <p className="mt-4 text-status-error">Error:</p>
          <p className="text-status-error mt-2 text-sm">{invitationError}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isLoading}
        message="Loading invitation details..."
        spinnerSize="xl"
      />
      
      {!isLoading && invitationData && (
        <>
          <DriverSignupHero
            title="Driver Sign Up"
            description={`Join ${invitationData.movingPartnerName} as a driver`}
          />
          <DriverSignUpForm
            invitationToken={token}
            hideServicesSection={true}
          />
        </>
      )}
    </div>
  );
}

