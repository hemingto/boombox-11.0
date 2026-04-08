/**
 * @fileoverview Account information content for service providers
 * @source boombox-10.0/src/app/components/mover-account/accountinfocontent.tsx
 *
 * COMPONENT FUNCTIONALITY:
 * Displays account information for drivers, moving partners, and hauling partners.
 * Shows moving partner preview card (how they appear to customers),
 * profile picture upload, contact information, driver's license images,
 * and hauler insurance document uploads (multiple).
 *
 * ACCOUNT TYPES SUPPORTED:
 * - Driver accounts (userType="driver")
 * - Moving partner accounts (userType="mover")
 * - Hauling partner accounts (userType="hauler")
 *
 * @refactor Migrated to service-providers structure with extracted business logic
 */

'use client';

import { useState, useEffect } from 'react';
import { LaborRadioCard } from '@/components/forms/LaborRadioCard';
import { ContactTable } from '@/components/features/service-providers/account/ContactTable';
import { ProfilePicture } from '@/components/ui/primitives/ProfilePicture';
import { DriversLicenseImages } from '@/components/features/service-providers/drivers';
import { PhotoUploads } from '@/components/forms';
import { useServiceProviderData } from '@/hooks/useServiceProviderData';
import { DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

interface AccountInfoContentProps {
  userType: 'driver' | 'mover' | 'hauler';
  userId: string;
}

export function AccountInfoContent({
  userType = 'mover',
  userId,
}: AccountInfoContentProps) {
  const {
    data: providerData,
    isLoading,
    error,
  } = useServiceProviderData({
    userId,
    userType: userType === 'hauler' ? 'driver' : userType,
  });

  const [insuranceDocumentUrls, setInsuranceDocumentUrls] = useState<string[]>(
    []
  );
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  useEffect(() => {
    if (userType === 'hauler') {
      fetch(`/api/hauling-partners/${userId}/insurance-document`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.insuranceDocumentUrls) {
            setInsuranceDocumentUrls(data.insuranceDocumentUrls);
          }
        })
        .catch(() => {});
    }
  }, [userId, userType]);

  const handleInsurancePhotoSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));

    try {
      const res = await fetch(
        `/api/hauling-partners/${userId}/upload-insurance-document`,
        { method: 'POST', body: formData }
      );
      if (res.ok) {
        const data = await res.json();
        setInsuranceDocumentUrls(data.insuranceDocumentUrls);
        setUploadResetKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error uploading insurance documents:', err);
    }
  };

  const handleDeleteInsuranceDocument = async (url: string) => {
    setDeletingUrl(url);
    try {
      const res = await fetch(
        `/api/hauling-partners/${userId}/insurance-document`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setInsuranceDocumentUrls(data.insuranceDocumentUrls);
      }
    } catch (err) {
      console.error('Error deleting insurance document:', err);
    } finally {
      setDeletingUrl(null);
    }
  };

  const getDocumentDisplayName = (url: string, index: number) => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const decoded = decodeURIComponent(filename);
      if (decoded.length > 40) return `Insurance Document ${index + 1}`;
      return decoded;
    } catch {
      return `Insurance Document ${index + 1}`;
    }
  };

  return (
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-10">
      {/* Moving Partner Preview Card */}
      {userType === 'mover' && !isLoading && !error && providerData && (
        <>
          <div className="mt-4 max-w-lg">
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
            <p className="text-sm text-text-primary">
              <strong>Note:</strong> This is a representation of how customers
              see your business while booking jobs on the Boombox platform
            </p>
          </div>
        </>
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
        {(userType === 'mover' || userType === 'hauler') && (
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

      {/* Insurance Document Upload (Haulers Only) */}
      {userType === 'hauler' && (
        <div className="mt-9 mb-12">
          <h2 className="text-2xl mb-8 text-text-primary">
            Insurance Documents
          </h2>

          {/* Display existing uploaded documents */}
          {insuranceDocumentUrls.length > 0 && (
            <div className="flex flex-col gap-3 mb-6 max-w-lg">
              {insuranceDocumentUrls.map((url, index) => (
                <div
                  key={url}
                  className={cn(
                    'flex items-center justify-between p-4 bg-surface-tertiary border border-border-secondary rounded-md',
                    deletingUrl === url && 'opacity-50'
                  )}
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <DocumentIcon className="w-8 h-8 text-text-secondary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {getDocumentDisplayName(url, index)}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        Click to view
                      </p>
                    </div>
                  </a>
                  <button
                    onClick={() => handleDeleteInsuranceDocument(url)}
                    disabled={deletingUrl === url}
                    className="p-2 rounded-full text-text-secondary hover:text-status-error hover:bg-status-bg-error transition-colors flex-shrink-0 ml-3"
                    aria-label={`Delete ${getDocumentDisplayName(url, index)}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload new documents */}
          <div className="w-full">
            <PhotoUploads
              key={uploadResetKey}
              onPhotosSelected={handleInsurancePhotoSelected}
              photoUploadTitle="Upload Insurance Documents"
              buttonText={
                insuranceDocumentUrls.length > 0
                  ? 'Add More Documents'
                  : 'Add Insurance Documents'
              }
              icon={
                <DocumentArrowDownIcon className="w-16 h-16 text-slate-200 mb-1" />
              }
              aspectRatio="aspect-video"
              maxPhotos={10}
              entityId={userId}
              entityType="hauler"
              name="insuranceDocument"
              hidePreview
            />
          </div>

          <div className="mt-4 p-3 sm:mb-4 mb-2 border border-border rounded-md max-w-fit">
            <p className="text-sm text-text-primary">
              <span className="font-semibold">Note:</span> Upload your insurance
              documents for auto, general, cargo, and workers comp policies that
              includes the policy numbers and expiration dates.
            </p>
          </div>
        </div>
      )}

      {/* Driver's License Images Section (Drivers and Movers Only) */}
      {(userType === 'driver' || userType === 'mover') && (
        <DriversLicenseImages userId={userId} userType={userType} />
      )}
    </div>
  );
}
