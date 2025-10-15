/**
 * @fileoverview VerifyPhoneNumberPopup component - Phone number verification modal
 * @source boombox-10.0/src/app/components/user-page/verifyphonenumberpopup.tsx
 * @refactored Following REFACTOR_PRD.md and component-migration-checklist.md
 */

'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/primitives/Modal';
import { VerificationCode } from '@/components/features/auth/VerificationCodeInput';

export interface VerifyPhoneNumberPopupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  code: string[];
  setCode: (newCode: string[]) => void;
  error: string | null;
  clearError: () => void;
  onResend: () => void;
}

/**
 * VerifyPhoneNumberPopup - Modal for phone number verification
 * 
 * Features:
 * - 4-digit verification code input
 * - Resend code functionality
 * - Loading states
 * - Error handling
 */
export const VerifyPhoneNumberPopup: React.FC<VerifyPhoneNumberPopupProps> = ({
  open,
  onClose,
  onSubmit,
  code,
  setCode,
  error,
  clearError,
  onResend,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify your phone number" size="md">
      <form onSubmit={handleSubmit} className="mt-8">
        <VerificationCode
          code={code}
          description="Please enter the four digit code we sent to your new number"
          setCode={setCode}
          error={error}
          clearError={clearError}
        />
        
        <p className="text-sm mb-4 text-text-secondary">
          Didn&apos;t receive code?{' '}
          <button
            type="button"
            onClick={onResend}
            className="font-semibold underline text-text-primary hover:text-text-secondary"
          >
            Resend
          </button>
        </p>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

