/**
 * @fileoverview Driver invitation acceptance page - driver signup via moving partner invitation
 * @source boombox-10.0/src/app/driver-accept-invite/page.tsx
 * @refactor Migrated to (auth) route group with proper error handling
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BoomboxLogo } from '@/components/icons/BoomboxLogo';
import { DriverSignupHero, DriverSignUpForm } from '@/components/features/drivers';
import { Spinner } from '@/components/ui/primitives/Spinner/Spinner';

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

        const data = await response.json();
        setInvitationData(data);
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
      <div>
        <nav className="h-16 w-full flex items-center bg-primary">
          <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
            <ul className="md:basis-1/2 justify-start">
              <li>
                <Link href="/">
                  <BoomboxLogo className="w-24 sm:w-32 text-white" />
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto p-6 mt-10">
          <div className="bg-status-bg-error border border-border-error rounded-md p-4">
            <h2 className="text-status-error font-semibold">
              Invalid invitation link
            </h2>
            <p className="text-status-error mt-2">{invitationError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="h-16 w-full flex items-center bg-primary">
        <div className="h-10 w-full py-3 lg:px-16 px-6 flex items-center">
          <ul className="md:basis-1/2 justify-start">
            <li>
              <Link href="/">
                <BoomboxLogo className="w-24 sm:w-32 text-white" />
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : invitationData ? (
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
        ) : null}
      </div>
    </div>
  );
}

