/**
 * @fileoverview Account information content for service providers
 * @source boombox-10.0/src/app/components/mover-account/accountinfocontent.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Displays account information for both drivers and moving partners.
 * Shows moving partner preview card (how they appear to customers),
 * profile picture upload, contact information, and driver's license images.
 * 
 * ACCOUNT TYPES SUPPORTED:
 * - Driver accounts (userType="driver")
 * - Moving partner accounts (userType="mover")
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced border-slate-100 with border-border-secondary
 * - Applied semantic color tokens throughout
 * - Used standard container patterns from design system
 * 
 * @refactor Migrated to service-providers structure with extracted business logic
 */

'use client';

import { LaborRadioCard } from '@/components/forms/LaborRadioCard';
import { ContactTable } from '@/components/features/service-providers/account/ContactTable';
import { ProfilePicture } from '@/components/ui/primitives/ProfilePicture';
import { DriversLicenseImages } from '@/components/features/service-providers/drivers';
import { useServiceProviderData } from '@/hooks/useServiceProviderData';
import { LoadingOverlay } from '@/components/ui/primitives/LoadingOverlay';

interface AccountInfoContentProps {
  userType: 'driver' | 'mover';
  userId: string;
}

export function AccountInfoContent({
  userType = 'mover',
  userId,
}: AccountInfoContentProps) {
  const { data: providerData, isLoading, error } = useServiceProviderData({
    userId,
    userType,
  });

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10">
      {/* Moving Partner Preview Card */}
      {userType === 'mover' && !isLoading && !error && providerData && (
        <>
          <div className="mt-4 max-w-lg cursor-default">
            <LaborRadioCard
              key={providerData.id}
              id={providerData.id.toString()}
              title={providerData.title}
              description={providerData.description}
              price={providerData.price}
              reviews={providerData.reviews}
              rating={providerData.rating}
              link={providerData.link}
              imageSrc={providerData.imageSrc}
              featured={providerData.featured}
            />
          </div>
          <div className="p-3 mb-4 border border-border-secondary rounded-md max-w-lg">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Note:</strong> This is a
              representation of how customers see your business while booking jobs on
              the Boombox platform
            </p>
          </div>
        </>
      )}

      {/* Loading State */}
      {userType === 'mover' && isLoading && (
        <LoadingOverlay visible={true} message="Loading account information..." />
      )}

      {/* Error State */}
      {userType === 'mover' && error && (
        <div className="p-4 mb-4 bg-status-bg-error border border-border-error rounded-md max-w-lg">
          <p className="text-sm text-status-error">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Profile Picture Section */}
      <div>
        {userType === 'mover' && (
          <h2 className="text-2xl mt-9 mb-8 text-text-primary">
            Set your company picture
          </h2>
        )}
        <ProfilePicture
          userType={userType}
          userId={userId}
          size="lg"
          onProfilePictureChange={(url: string) =>
            console.log('New profile picture:', url)
          }
        />
      </div>

      {/* Contact Information Section */}
      <h2 className="text-2xl mt-9 mb-8 text-text-primary">
        Edit {userType === 'driver' ? 'your' : 'company'} information
      </h2>

      <ContactTable userId={userId} userType={userType} />

      {/* Driver's License Images Section */}
      <DriversLicenseImages userId={userId} userType={userType} />
    </div>
  );
}

