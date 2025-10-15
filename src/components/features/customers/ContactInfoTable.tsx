/**
 * @fileoverview ContactInfoTable component - Contact information and storage unit management
 * @source boombox-10.0/src/app/components/user-page/contactinfotable.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 * 
 * COMPONENT FUNCTIONALITY:
 * - Display and edit contact information (name, email, phone)
 * - Phone number verification with SMS codes
 * - Storage unit padlock combination management
 * - Inline editing with validation
 * - Show/hide padlock combinations
 * 
 * API ROUTES UPDATED:
 * - Old: /api/users/${userId}/contact-info → New: /api/customers/${userId}/contact-info
 * - Old: /api/auth/verify-code → New: /api/auth/verify-code (unchanged)
 * - Old: /api/auth/send-code → New: /api/auth/send-code (unchanged)
 * 
 * DESIGN SYSTEM UPDATES:
 * - Replaced hardcoded colors with semantic tokens
 * - Used skeleton primitives for loading states
 * - Applied form utility classes
 * - Used VerifyPhoneNumberPopup component
 */

'use client';

import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/20/solid';
import { VerifyPhoneNumberPopup } from '@/components/features/customers';
import { SkeletonCard, SkeletonText } from '@/components/ui/primitives/Skeleton';
import { formatPhoneNumberForDisplay } from '@/lib/utils/phoneUtils';
import { isValidEmail } from '@/lib/utils/validationUtils';

interface StorageUnit {
  storageUnitNumber: string;
  padlockCombo: string;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  verifiedPhoneNumber: boolean;
  storageUnits: StorageUnit[];
}

export interface ContactInfoTableProps {
  userId: string;
}

/**
 * ContactInfoTable - Comprehensive contact information management
 * 
 * Features:
 * - Contact info display and editing
 * - Phone verification
 * - Padlock combo management
 * - Inline editing with validation
 * - Error handling
 */
export const ContactInfoTable: React.FC<ContactInfoTableProps> = ({ userId }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editField, setEditField] = useState<keyof ContactInfo | null>(null);
  const [editedInfo, setEditedInfo] = useState<Partial<ContactInfo> & {
    padlockCombo?: { [key: string]: string };
  }>({});
  const [isEditingPadlockCombo, setIsEditingPadlockCombo] = useState(false);
  const [showPadlock, setShowPadlock] = useState<{ [key: string]: boolean }>({});
  const [localHasError, setLocalHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [errors, setErrors] = useState<{ verificationError: string | null }>({
    verificationError: null,
  });
  const [padlockComboErrors, setPadlockComboErrors] = useState<{ [key: string]: string | null }>({});

  const handleVerifyClick = () => {
    setIsPopupOpen(true);
    handleResend();
  };

  const togglePadlockVisibility = (unitNumber: string) => {
    setShowPadlock((prev) => ({
      ...prev,
      [unitNumber]: !prev[unitNumber],
    }));
  };

  // Fetch contact info
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`/api/customers/${userId}/contact-info`);
        if (!response.ok) {
          throw new Error('Failed to fetch contact info');
        }
        const data = await response.json();
        setContactInfo(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContactInfo();
  }, [userId]);

  const handleVerificationSubmit = async () => {
    if (!contactInfo?.phoneNumber) {
      setErrors({ verificationError: 'Phone number is missing.' });
      return;
    }
  
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: contactInfo.phoneNumber, code: verificationCode.join('') }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed.');
      }
  
      setContactInfo((prev) =>
        prev ? { ...prev, verifiedPhoneNumber: true } : prev
      );
      setIsPopupOpen(false);
    } catch (error: any) {
      console.error('Error verifying phone number:', error);
      setErrors({ verificationError: error.message || 'Failed to verify phone number. Please try again.' });
    }
  };

  const handleResend = async () => {
    if (!contactInfo?.phoneNumber) {
      setErrors({ verificationError: 'Phone number is missing.' });
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
  
      setErrors({ verificationError: null });
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setErrors({ verificationError: 'Failed to send verification code. Please try again.' });
    }
  };
  
  const handleEdit = (field: keyof ContactInfo) => {
    setIsEditingPadlockCombo(false);
    setEditField(field);

    if (field === 'firstName' || field === 'lastName') {
      setEditedInfo({
        firstName: contactInfo?.firstName || '',
        lastName: contactInfo?.lastName || '',
      });
    } else {
      setEditedInfo({ [field]: contactInfo?.[field] });
    }
    setErrorMessage(null);
    setLocalHasError(false);
  };

  const handleEditPadlockCombo = () => {
    setEditField(null);
    const combos = contactInfo?.storageUnits.reduce(
      (acc, unit) => ({
        ...acc,
        [unit.storageUnitNumber]: unit.padlockCombo,
      }),
      {}
    );
    setEditedInfo({ padlockCombo: combos });
    setIsEditingPadlockCombo(true);
    setErrorMessage(null);
    setLocalHasError(false);
  };

  const handleSave = async () => {
    if (!editField) {
      setErrorMessage('No field selected for editing.');
      setLocalHasError(true);
      return;
    }
  
    // Validation
    switch (editField) {
      case 'phoneNumber':
        const phoneNumberDigits = editedInfo.phoneNumber?.replace(/\D/g, '') || '';
        if (phoneNumberDigits.length !== 10) {
          setErrorMessage('Phone number must be 10 digits.');
          setLocalHasError(true);
          return;
        }
        break;
      case 'email':
        if (!isValidEmail(editedInfo.email || '')) {
          setErrorMessage('Please enter a valid email address.');
          setLocalHasError(true);
          return;
        }
        break;
      default:
        break;
    }
  
    try {
      const response = await fetch(`/api/customers/${userId}/contact-info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField]: editedInfo[editField] }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update contact info');
      }
      
      const updatedData = await response.json();
      setContactInfo(prev => prev ? { ...prev, ...updatedData } : prev);
      setEditField(null);
      setLocalHasError(false);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message);
      setLocalHasError(true);
    }
  };

  const handleSavePadlockCombo = async () => {
    try {
      if (!contactInfo?.storageUnits || !editedInfo.padlockCombo) {
        setLocalHasError(true);
        setErrorMessage('No storage unit data to update.');
        return;
      }
  
      // Validate each padlock combo
      const newPadlockComboErrors: { [key: string]: string | null } = {};
      for (const unit of contactInfo.storageUnits) {
        const newCombo = editedInfo.padlockCombo?.[unit.storageUnitNumber];
        if (!newCombo?.trim()) {
          newPadlockComboErrors[unit.storageUnitNumber] = `Combo for Boombox ${unit.storageUnitNumber} cannot be empty.`;
        } else if (newCombo.length > 35) {
          newPadlockComboErrors[unit.storageUnitNumber] = `Combo for Boombox ${unit.storageUnitNumber} cannot exceed 35 characters.`;
        }
      }
  
      if (Object.values(newPadlockComboErrors).some((error) => error !== null)) {
        setPadlockComboErrors(newPadlockComboErrors);
        return;
      }
  
      setPadlockComboErrors({});
      setLocalHasError(false);
      setErrorMessage(null);
  
      const updatedUnits = contactInfo.storageUnits.map((unit) => ({
        storageUnitNumber: unit.storageUnitNumber,
        padlockCombo: editedInfo.padlockCombo?.[unit.storageUnitNumber] || unit.padlockCombo,
      }));
  
      const response = await fetch(`/api/customers/${userId}/contact-info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageUnits: updatedUnits }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update padlock combinations');
      }
  
      setContactInfo((prev) => {
        if (!prev) return prev;
        const updatedStorageUnits = prev.storageUnits.map((unit) => ({
          ...unit,
          padlockCombo: updatedUnits.find((updated) => updated.storageUnitNumber === unit.storageUnitNumber)?.padlockCombo || unit.padlockCombo,
        }));
        return { ...prev, storageUnits: updatedStorageUnits };
      });
  
      setIsEditingPadlockCombo(false);
      setEditedInfo({});
    } catch (err: any) {
      console.error('Error in handleSavePadlockCombo:', err);
      setLocalHasError(true);
      setErrorMessage('Failed to save changes.');
    }
  };
  
  const handleCancel = () => {
    setEditedInfo({});
    setEditField(null);
    setLocalHasError(false);
    setErrorMessage(null);
    setIsEditingPadlockCombo(false);
    setPadlockComboErrors({});
  };

  const handleFocus = () => {
    setLocalHasError(false);
  };

  const handlePadlockFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const unitNumber = event.target.dataset.unitNumber;
    if (unitNumber) {
      setPadlockComboErrors((prevErrors) => {
        const { [unitNumber]: _, ...rest } = prevErrors;
        return rest;
      });
    }
  };

  const handleChange = (field: keyof ContactInfo, value: string) => {
    if (field === 'phoneNumber') {
      setEditedInfo((prev) => ({
        ...prev,
        phoneNumber: formatPhoneNumberForDisplay(value),
      }));
    } else {
      setEditedInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const isEditable = (field: keyof ContactInfo | 'padlockCombo') => {
    if (field === 'padlockCombo') {
      return isEditingPadlockCombo;
    }
    return editField === field;
  };

  const isGrayedOut = (field: keyof ContactInfo | 'padlockCombo') => {
    if (field === 'padlockCombo') {
      return editField !== null;
    }
    return isEditingPadlockCombo || (editField !== null && editField !== field);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto">
        <SkeletonCard className="p-6">
          <div className="space-y-4">
            {/* Name Section Skeleton */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="w-full space-y-3">
                <SkeletonText className="w-14" />
                <SkeletonText className="w-48" />
              </div>
              <SkeletonText className="w-8" />
            </div>
  
            {/* Email Section Skeleton */}
            <div className="flex items-start justify-between border-b border-border py-4">
              <div className="w-full space-y-3">
                <SkeletonText className="w-12" />
                <SkeletonText className="w-64" />
              </div>
              <SkeletonText className="w-8" />
            </div>
  
            {/* Phone Section Skeleton */}
            <div className="flex items-start justify-between border-b border-border py-4">
              <div className="w-full space-y-3">
                <SkeletonText className="w-28" />
                <div className="flex items-center gap-2">
                  <SkeletonText className="w-32" />
                  <div className="h-6 w-20 bg-surface-tertiary rounded-md animate-pulse" />
                </div>
              </div>
              <SkeletonText className="w-8" />
            </div>
  
            {/* Padlock Combo Skeleton */}
            <div className="flex items-start justify-between pt-4">
              <div className="w-full space-y-3">
                <SkeletonText className="w-28" />
                {[1, 2].map((i) => (
                  <div key={i} className="mt-3 space-y-2">
                    <SkeletonText className="w-24" />
                    <SkeletonText className="w-32" />
                  </div>
                ))}
              </div>
              <SkeletonText className="w-8" />
            </div>
          </div>
        </SkeletonCard>
      </div>
    );
  }

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
    <div className="flex flex-col lg:px-16 px-6 max-w-5xl w-full mx-auto mb-24">
      <div className="bg-white rounded-md shadow-custom-shadow p-6">
        {/* First Name and Last Name Fields */}
        <div className="flex items-start justify-between border-b border-border">
          <div className="w-full pb-4">
            <label className={`form-label ${isGrayedOut('firstName') ? 'opacity-50' : ''}`}>
              Name
            </label>
            {isEditable('firstName') || isEditable('lastName') ? (
              <>
                <div className="mt-2 flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={editedInfo.firstName}
                    onFocus={handleFocus}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className={`input-field w-1/2 ${localHasError ? 'input-field--error' : ''}`}
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    value={editedInfo.lastName}
                    onFocus={handleFocus}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className={`input-field w-1/2 ${localHasError ? 'input-field--error' : ''}`}
                    placeholder="Last Name"
                  />
                </div>
                {errorMessage && (
                  <p className="form-error mt-2">{errorMessage}</p>
                )}
              </>
            ) : (
              <div className={`${isGrayedOut('firstName') ? 'opacity-50' : ''}`}>
                {contactInfo?.firstName} {contactInfo?.lastName}
              </div>
            )}
          </div>
          {!isEditable('firstName') && !isEditable('lastName') && (
            <button
              onClick={() => handleEdit('firstName')}
              disabled={isGrayedOut('firstName')}
              className="text-sm text-text-primary hover:text-text-secondary disabled:opacity-50 underline-offset-4 underline"
            >
              Edit
            </button>
          )}
        </div>

        {/* Email Field */}
        <div className="flex items-start justify-between border-b border-border py-4">
          <div className="w-full">
            <label className={`form-label ${isGrayedOut('email') ? 'opacity-50' : ''}`}>
              Email
            </label>
            {isEditable('email') ? (
              <>
                <input
                  type="email"
                  value={editedInfo.email || ''}
                  onFocus={handleFocus}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`input-field max-w-md mt-2 ${localHasError ? 'input-field--error' : ''}`}
                  placeholder="Email address"
                />
                {errorMessage && (
                  <p className="form-error mt-2">{errorMessage}</p>
                )}
              </>
            ) : (
              <div className={`${isGrayedOut('email') ? 'opacity-50' : ''}`}>
                {contactInfo?.email}
              </div>
            )}
          </div>
          {!isEditable('email') && (
            <button
              onClick={() => handleEdit('email')}
              disabled={isGrayedOut('email')}
              className="text-sm text-text-primary hover:text-text-secondary disabled:opacity-50 underline-offset-4 underline"
            >
              Edit
            </button>
          )}
        </div>

        {/* Phone Number Field */}
        <div className="flex items-start justify-between border-b border-border py-4">
          <div className="w-full">
            <label className={`form-label ${isGrayedOut('phoneNumber') ? 'opacity-50' : ''}`}>
              Phone number
            </label>
            {isEditable('phoneNumber') ? (
              <>
                <input
                  type="tel"
                  value={editedInfo.phoneNumber || ''}
                  onFocus={handleFocus}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className={`input-field max-w-md mt-2 ${localHasError ? 'input-field--error' : ''}`}
                  placeholder="(555) 555-5555"
                />
                {errorMessage && (
                  <p className="form-error mt-2">{errorMessage}</p>
                )}
              </>
            ) : (
              <div className={`flex items-center gap-2 ${isGrayedOut('phoneNumber') ? 'opacity-50' : ''}`}>
                <span>{contactInfo?.phoneNumber}</span>
                {contactInfo?.verifiedPhoneNumber ? (
                  <span className="badge-success">Verified</span>
                ) : (
                  <button
                    onClick={handleVerifyClick}
                    className="text-sm text-text-primary hover:text-text-secondary underline-offset-4 underline"
                  >
                    Verify
                  </button>
                )}
              </div>
            )}
          </div>
          {!isEditable('phoneNumber') && (
            <button
              onClick={() => handleEdit('phoneNumber')}
              disabled={isGrayedOut('phoneNumber')}
              className="text-sm text-text-primary hover:text-text-secondary disabled:opacity-50 underline-offset-4 underline"
            >
              Edit
            </button>
          )}
        </div>

        {/* Padlock Combo Fields */}
        {contactInfo?.storageUnits && contactInfo.storageUnits.length > 0 && (
          <div className="flex items-start justify-between pt-4">
            <div className="w-full">
              <label className={`form-label ${isGrayedOut('padlockCombo') ? 'opacity-50' : ''}`}>
                Padlock combo
              </label>
              {isEditingPadlockCombo ? (
                <div className="space-y-3 mt-2">
                  {contactInfo.storageUnits.map((unit) => (
                    <div key={unit.storageUnitNumber}>
                      <label className="text-sm font-medium text-text-primary">
                        Boombox {unit.storageUnitNumber}
                      </label>
                      <input
                        type="text"
                        value={editedInfo.padlockCombo?.[unit.storageUnitNumber] || ''}
                        data-unit-number={unit.storageUnitNumber}
                        onFocus={handlePadlockFocus}
                        onChange={(e) => {
                          setEditedInfo((prev) => ({
                            ...prev,
                            padlockCombo: {
                              ...prev.padlockCombo,
                              [unit.storageUnitNumber]: e.target.value,
                            },
                          }));
                        }}
                        className={`input-field max-w-md mt-1 ${
                          padlockComboErrors[unit.storageUnitNumber] ? 'input-field--error' : ''
                        }`}
                        placeholder="Enter padlock combo"
                      />
                      {padlockComboErrors[unit.storageUnitNumber] && (
                        <p className="form-error mt-1">{padlockComboErrors[unit.storageUnitNumber]}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`space-y-2 mt-2 ${isGrayedOut('padlockCombo') ? 'opacity-50' : ''}`}>
                  {contactInfo.storageUnits.map((unit) => (
                    <div key={unit.storageUnitNumber} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary w-24">
                        Boombox {unit.storageUnitNumber}:
                      </span>
                      <span className="text-text-secondary">
                        {showPadlock[unit.storageUnitNumber] ? unit.padlockCombo : '••••'}
                      </span>
                      <button
                        onClick={() => togglePadlockVisibility(unit.storageUnitNumber)}
                        className="text-text-primary hover:text-text-secondary"
                      >
                        {showPadlock[unit.storageUnitNumber] ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!isEditingPadlockCombo && (
              <button
                onClick={handleEditPadlockCombo}
                disabled={isGrayedOut('padlockCombo')}
                className="text-sm text-text-primary hover:text-text-secondary disabled:opacity-50 underline-offset-4 underline"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(editField || isEditingPadlockCombo) && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-text-primary underline-offset-4 underline hover:text-text-secondary"
            >
              Cancel
            </button>
            <button
              onClick={isEditingPadlockCombo ? handleSavePadlockCombo : handleSave}
              className="btn-primary"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {/* Phone Verification Popup */}
      <VerifyPhoneNumberPopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSubmit={handleVerificationSubmit}
        code={verificationCode}
        setCode={setVerificationCode}
        error={errors.verificationError}
        clearError={() => setErrors({ verificationError: null })}
        onResend={handleResend}
      />
    </div>
  );
};

