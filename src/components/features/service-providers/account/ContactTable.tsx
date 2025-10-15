/**
 * @fileoverview Contact information table for service providers with inline editing
 * @source boombox-10.0/src/app/components/mover-account/contacttable.tsx
 * 
 * COMPONENT FUNCTIONALITY:
 * Editable contact information table for drivers and moving partners.
 * Supports inline editing, phone verification, and service management.
 * 
 * FEATURES:
 * - Inline editing for all contact fields
 * - Phone number verification via SMS
 * - Service selection for drivers
 * - Moving partner status display
 * - Dynamic activation messages
 * - Form validation
 * 
 * API ROUTES UPDATED:
 * - Old: /api/drivers/${userId} → New: /api/drivers/[id]/profile
 * - Old: /api/movers/${userId} → New: /api/moving-partners/[id]/profile
 * - Old: /api/auth/driver-phone-number-verify → New: /api/auth/driver-phone-verify
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced border-slate-100 with border-border-secondary
 * - Replaced bg-slate-100 with bg-surface-tertiary
 * - Replaced amber-* colors with status-warning tokens
 * - Replaced emerald-* colors with status-success tokens
 * - Replaced red-* colors with status-error tokens
 * - Replaced zinc-* colors with primary/text tokens
 * 
 * @refactor Migrated to service-providers structure with extracted business logic
 */

'use client';

import { useState } from 'react';
import { useContactInfo } from '@/hooks/useContactInfo';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { Skeleton } from '@/components/ui/primitives/Skeleton';
import VerifyPhone from '@/components/features/auth/VerifyPhoneNumberPopup';

interface ContactTableProps {
  userId: string;
  userType: 'driver' | 'mover';
}

export const ContactTable = ({ userId, userType }: ContactTableProps) => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const {
    contactInfo,
    movingPartnerStatus,
    isLoading,
    error,
    editField,
    editedInfo,
    localHasError,
    errorMessage,
    isEditingServices,
    selectedServices,
    availableServices,
    activationMessage,
    handleEdit,
    handleSave,
    handleCancel,
    handleChange,
    handleFocus,
    isEditable,
    isGrayedOut,
    handleServiceToggle,
    handleSaveServices,
    setIsEditingServices,
    setSelectedServices,
    refetch,
  } = useContactInfo({ userId, userType });

  const handleVerifyClick = async () => {
    setIsPopupOpen(true);
    // Resend verification code
    if (!contactInfo?.phoneNumber) {
      setVerificationError('Phone number is missing.');
      return;
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: contactInfo.phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code.');
      }

      setVerificationError(null);
    } catch (error: unknown) {
      console.error('Error sending verification code:', error);
      setVerificationError(
        'Failed to send verification code. Please try again.'
      );
    }
  };

  const handleVerificationSubmit = async () => {
    if (!contactInfo?.phoneNumber) {
      setVerificationError('Phone number is missing.');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: contactInfo.phoneNumber,
          code: verificationCode.join(''),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }

      await fetch('/api/auth/driver-phone-verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType }),
      });

      await refetch();
      setIsPopupOpen(false);
    } catch (error: unknown) {
      console.error('Error verifying phone number:', error);
      setVerificationError(
        (error as Error).message ||
          'Failed to verify phone number. Please try again.'
      );
    }
  };

  const handleResend = async () => {
    if (!contactInfo?.phoneNumber) {
      setVerificationError('Phone number is missing.');
      return;
    }

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: contactInfo.phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code.');
      }

      setVerificationError(null);
    } catch (error: unknown) {
      console.error('Error sending verification code:', error);
      setVerificationError(
        'Failed to send verification code. Please try again.'
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col max-w-5xl w-full mx-auto">
        <div className="bg-surface-primary rounded-md shadow-custom-shadow p-6 animate-pulse">
          <div className="flex items-start justify-between border-b border-border-secondary pb-4">
            <div className="w-full">
              <Skeleton className="h-4 w-14 mb-3" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>

          <div className="flex items-start justify-between border-b border-border-secondary py-4">
            <div className="w-full">
              <Skeleton className="h-4 w-12 mb-3" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>

          <div className="flex items-start justify-between py-4">
            <div className="w-full">
              <Skeleton className="h-4 w-28 mb-3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-5xl lg:px-16 px-6 mx-auto">
        <div className="bg-status-bg-error p-3 mb-4 border border-border-error rounded-md max-w-fit">
          <p className="text-sm text-status-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-5xl w-full mx-auto mb-12">
      {/* Activation Message Banner */}
      {contactInfo && !contactInfo.verifiedPhoneNumber && (
        <div className="bg-status-bg-warning w-fit border border-border-warning rounded-md p-4 mb-6">
          <p className="text-status-warning text-sm">{activationMessage}</p>
        </div>
      )}

      <div className="bg-surface-primary rounded-md shadow-custom-shadow p-6">
        {/* Name Field */}
        <div className="flex items-start justify-between border-b border-border-secondary">
          <div className="w-full pb-4">
            <label
              className={`${
                editField &&
                editField !== 'name' &&
                editField !== 'firstName' &&
                editField !== 'lastName'
                  ? 'opacity-50'
                  : ''
              }`}
            >
              {userType === 'driver' ? 'Name' : 'Company Name'}
            </label>
            {isEditable(userType === 'driver' ? 'firstName' : 'name') ? (
              <>
                {userType === 'driver' ? (
                  <div className="mt-2 flex gap-2 max-w-md">
                    <input
                      type="text"
                      value={editedInfo.firstName || ''}
                      onFocus={handleFocus}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`w-1/2 py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                        ${
                          localHasError
                            ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                            : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                        }`}
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={editedInfo.lastName || ''}
                      onFocus={handleFocus}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={`w-1/2 py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                        ${
                          localHasError
                            ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                            : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                        }`}
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editedInfo.name || ''}
                    onFocus={handleFocus}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`mt-2 max-w-md w-full py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                      ${
                        localHasError
                          ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                          : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                      }`}
                    placeholder="Company Name"
                  />
                )}
                {localHasError &&
                  (editField === 'name' ||
                    editField === 'firstName' ||
                    editField === 'lastName') && (
                    <p className="text-status-error text-sm sm:-mt-2 mb-3">
                      {errorMessage}
                    </p>
                  )}
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      if (userType === 'driver') {
                        if (
                          !editedInfo.firstName?.trim() ||
                          !editedInfo.lastName?.trim()
                        ) {
                          return;
                        }
                      } else {
                        if (!editedInfo.name?.trim()) {
                          return;
                        }
                      }
                      handleSave();
                    }}
                    className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <p
                className={`mt-2 text-sm text-text-secondary ${
                  isGrayedOut('name') ||
                  isGrayedOut('firstName') ||
                  isGrayedOut('lastName')
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {userType === 'driver'
                  ? `${contactInfo?.firstName} ${contactInfo?.lastName}`
                  : contactInfo?.name}
              </p>
            )}
          </div>
          {isEditable(userType === 'driver' ? 'firstName' : 'name') ? (
            <button
              onClick={handleCancel}
              className="decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() =>
                handleEdit(userType === 'driver' ? 'firstName' : 'name')
              }
              className={`decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                isGrayedOut('name') ||
                isGrayedOut('firstName') ||
                isGrayedOut('lastName')
                  ? 'opacity-50'
                  : ''
              }`}
            >
              Edit
            </button>
          )}
        </div>

        {/* Description Field (Movers Only) */}
        {userType === 'mover' && (
          <div
            className={`flex items-start justify-between border-b border-border-secondary ${
              isGrayedOut('description') ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col w-full pt-4 pb-4">
              <label>Description</label>
              {isEditable('description') ? (
                <div>
                  <textarea
                    value={editedInfo.description || ''}
                    onFocus={handleFocus}
                    onChange={(e) =>
                      handleChange('description', e.target.value.slice(0, 80))
                    }
                    className={`mt-2 max-w-md w-full py-2.5 px-3 rounded-md focus:outline-none focus:ring-primary
                      ${
                        localHasError && editField === 'description'
                          ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                          : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                      }`}
                    placeholder="Enter company description"
                    rows={3}
                    maxLength={80}
                  />
                  <div className="text-xs text-text-secondary sm:mb-4 mb-2">
                    {editedInfo.description?.length || 0}/80 characters
                  </div>
                  {localHasError && editField === 'description' && (
                    <p className="text-status-error text-sm sm:-mt-2 mb-3">
                      {errorMessage}
                    </p>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        if (!editedInfo.description?.trim()) {
                          return;
                        }
                        handleSave();
                      }}
                      className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  {contactInfo?.description || 'No description provided'}
                </p>
              )}
            </div>
            {isEditable('description') ? (
              <button
                onClick={handleCancel}
                className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => handleEdit('description')}
                className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                  isGrayedOut('description') ? 'opacity-50' : ''
                }`}
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Email Field */}
        <div
          className={`flex items-start justify-between border-b border-border-secondary ${
            isGrayedOut('email') ? 'opacity-50' : ''
          }`}
        >
          <div className="flex flex-col w-full pt-4 pb-4">
            <label>Email</label>
            {isEditable('email') ? (
              <div>
                <input
                  type="text"
                  value={editedInfo.email || ''}
                  onFocus={handleFocus}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`mt-2 max-w-sm md:max-w-md w-full py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                    ${
                      localHasError && editField === 'email'
                        ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                        : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                    }`}
                  placeholder="Enter your email"
                />
                {localHasError && editField === 'email' && (
                  <p className="text-status-error text-sm sm:-mt-2 mb-3">
                    {errorMessage}
                  </p>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">
                {contactInfo?.email}
              </p>
            )}
          </div>
          {isEditable('email') ? (
            <button
              onClick={handleCancel}
              className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => handleEdit('email')}
              className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                isGrayedOut('email') ? 'opacity-50' : ''
              }`}
            >
              Edit
            </button>
          )}
        </div>

        {/* Phone Number Field */}
        <div
          className={`flex items-start justify-between border-b border-border-secondary ${
            isGrayedOut('phoneNumber') ? 'opacity-50' : ''
          }`}
        >
          <div className="flex flex-col w-full pt-4 pb-4">
            <label>Phone Number</label>
            {isEditable('phoneNumber') ? (
              <div>
                <input
                  type="text"
                  value={formatPhoneNumberForDisplay(
                    editedInfo.phoneNumber || ''
                  )}
                  onFocus={handleFocus}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className={`mt-2 max-w-xs w-full py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                    ${
                      localHasError && editField === 'phoneNumber'
                        ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                        : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                    }`}
                  placeholder="Enter your phone number"
                />
                {localHasError && editField === 'phoneNumber' && (
                  <p className="text-status-error text-sm sm:-mt-2 mb-3">
                    {errorMessage}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                {formatPhoneNumberForDisplay(contactInfo?.phoneNumber ?? '')}
                {contactInfo?.verifiedPhoneNumber ? (
                  <span className="px-3 py-2 text-xs text-status-success bg-status-bg-success rounded-md">
                    Verified
                  </span>
                ) : (
                  <button
                    className={`px-3 py-2 text-xs text-status-warning bg-status-bg-warning rounded-full hover:bg-orange-100 active:bg-status-bg-warning transition ${
                      isGrayedOut('phoneNumber') ? 'opacity-50' : ''
                    }`}
                    onClick={handleVerifyClick}
                  >
                    Verify number
                  </button>
                )}
              </div>
            )}
          </div>
          {isEditable('phoneNumber') ? (
            <button
              onClick={handleCancel}
              className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => handleEdit('phoneNumber')}
              className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                isGrayedOut('phoneNumber') ? 'opacity-50' : ''
              }`}
            >
              Edit
            </button>
          )}
        </div>

        {/* Hourly Rate Field (Movers Only) */}
        {userType === 'mover' && (
          <div
            className={`flex items-start justify-between border-b border-border-secondary ${
              isGrayedOut('hourlyRate') ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col w-full pt-4 pb-4">
              <label>Hourly Rate ($)</label>
              {isEditable('hourlyRate') ? (
                <div>
                  <input
                    type="number"
                    value={editedInfo.hourlyRate || ''}
                    onFocus={handleFocus}
                    onChange={(e) => handleChange('hourlyRate', e.target.value)}
                    className={`mt-2 max-w-xs w-full py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                      ${
                        localHasError && editField === 'hourlyRate'
                          ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                          : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                      }`}
                    placeholder="Enter hourly rate"
                    min="0"
                    step="1.00"
                  />
                  {localHasError && editField === 'hourlyRate' && (
                    <p className="text-status-error text-sm sm:-mt-2 mb-3">
                      {errorMessage}
                    </p>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  ${contactInfo?.hourlyRate?.toFixed(2) || '0.00'}/hour
                </p>
              )}
            </div>
            {isEditable('hourlyRate') ? (
              <button
                onClick={handleCancel}
                className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => handleEdit('hourlyRate')}
                className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                  isGrayedOut('hourlyRate') ? 'opacity-50' : ''
                }`}
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Website Field (Movers Only) */}
        {userType === 'mover' && (
          <div
            className={`flex items-start justify-between border-b border-border-secondary ${
              isGrayedOut('website') ? 'opacity-50' : ''
            }`}
          >
            <div className="flex flex-col w-full pt-4 pb-4">
              <label>Website</label>
              {isEditable('website') ? (
                <div>
                  <input
                    type="url"
                    value={editedInfo.website || ''}
                    onFocus={handleFocus}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className={`mt-2 max-w-md w-full py-2.5 px-3 sm:mb-4 mb-2 rounded-md focus:outline-none focus:ring-primary
                      ${
                        localHasError && editField === 'website'
                          ? 'ring-status-error ring-2 bg-status-bg-error placeholder:text-status-error text-status-error'
                          : 'bg-surface-tertiary focus:outline-none placeholder:text-text-secondary focus:placeholder:text-text-primary placeholder:text-sm focus-within:ring-2 focus-within:ring-primary focus:bg-surface-primary'
                      }`}
                    placeholder="Enter website URL"
                  />
                  {localHasError && editField === 'website' && (
                    <p className="text-status-error text-sm sm:-mt-2 mb-3">
                      {errorMessage}
                    </p>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      className="block rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  {contactInfo?.website ? (
                    <a
                      href={contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hover:underline ${
                        isGrayedOut('website') ? 'opacity-50' : ''
                      }`}
                    >
                      {contactInfo.website}
                    </a>
                  ) : (
                    'No website provided'
                  )}
                </p>
              )}
            </div>
            {isEditable('website') ? (
              <button
                onClick={handleCancel}
                className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => handleEdit('website')}
                className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                  isGrayedOut('website') ? 'opacity-50' : ''
                }`}
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Company Partner (Linked Drivers Only) */}
        {userType === 'driver' &&
          movingPartnerStatus?.isLinkedToMovingPartner && (
            <div className="flex items-start justify-between border-b border-border-secondary">
              <div className="flex flex-col w-full pt-4 pb-4">
                <label>Company Partner</label>
                <p className="mt-2 text-sm text-text-secondary">
                  {movingPartnerStatus.movingPartner?.name}
                </p>
              </div>
            </div>
          )}

        {/* Services Field (Unlinked Drivers Only) */}
        {userType === 'driver' &&
          !movingPartnerStatus?.isLinkedToMovingPartner && (
            <div
              className={`flex items-start justify-between border-t border-border-secondary ${
                isGrayedOut('services') ? 'opacity-50' : ''
              }`}
            >
              <div className="flex flex-col w-full pt-4 pb-4">
                <label>Services</label>
                {isEditingServices ? (
                  <div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableServices.map((service) => (
                        <div key={service} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`service-${service}`}
                            checked={selectedServices.includes(service)}
                            onChange={() => handleServiceToggle(service)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                          />
                          <label
                            htmlFor={`service-${service}`}
                            className="ml-2 text-sm text-text-primary"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                    {localHasError && isEditingServices && (
                      <p className="text-status-error text-sm mt-2">
                        {errorMessage}
                      </p>
                    )}
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={handleSaveServices}
                        className="block mt-2 rounded-md py-2.5 px-6 font-semibold bg-primary text-text-inverse hover:bg-primary-hover active:bg-zinc-700 font-inter"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contactInfo?.services && contactInfo.services.length > 0 ? (
                      contactInfo.services.map((service) => (
                        <span
                          key={service}
                          className="px-3 py-2 text-sm bg-surface-tertiary rounded-full"
                        >
                          {service}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary">
                        No services selected
                      </p>
                    )}
                  </div>
                )}
              </div>
              {isEditingServices ? (
                <button
                  onClick={() => {
                    setIsEditingServices(false);
                    setSelectedServices(contactInfo?.services || []);
                  }}
                  className="decoration-dotted hover:decoration-solid underline underline-offset-2 pt-4 text-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingServices(true)}
                  className={`mt-4 decoration-dotted hover:decoration-solid underline underline-offset-2 text-sm ${
                    isGrayedOut('services') ? 'opacity-50' : ''
                  }`}
                >
                  Edit
                </button>
              )}
            </div>
          )}

        {/* Phone Verification Popup */}
        {isPopupOpen && (
          <VerifyPhone
            onClose={() => setIsPopupOpen(false)}
            onSubmit={handleVerificationSubmit}
            onResend={handleResend}
            code={verificationCode}
            setCode={setVerificationCode}
            error={verificationError}
            clearError={() => setVerificationError(null)}
          />
        )}
      </div>
    </div>
  );
};
