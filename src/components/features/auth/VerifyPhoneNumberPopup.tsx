/**
 * @fileoverview Phone number verification popup component
 * @source boombox-10.0/src/app/components/user-page/verifyphonenumberpopup.tsx
 * @refactor Moved to auth features folder for better organization
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VerificationCode } from './VerificationCodeInput';

interface VerifyPhoneProps {
 onClose: () => void;
 onSubmit: () => void;
 onResend: () => void;
 code: string[];
 setCode: (code: string[]) => void;
 error: string | null;
 clearError: () => void;
}

export default function VerifyPhone({
 onClose,
 onSubmit,
 onResend,
 code,
 setCode,
 error,
 clearError,
}: VerifyPhoneProps) {
 const popupRef = useRef<HTMLDivElement>(null);
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
    onClose();
   }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, [onClose]);

 const handleSubmit = async () => {
  setIsLoading(true);
  try {
   await onSubmit();
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
   <div ref={popupRef} className="bg-white rounded-lg w-96 sm:w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative">
    <button 
     onClick={onClose} 
     className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-tertiary active:bg-surface-disabled z-10"
     aria-label="Close modal"
    >
     <XMarkIcon className="w-5 h-5" />
    </button>
    <h2 className="text-2xl font-semibold mt-4 mb-4">Verify your phone number</h2>

    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-8">
     <VerificationCode 
      code={code} 
      description='Please enter the four code we sent your new number' 
      setCode={setCode} 
      error={error} 
      clearError={clearError} 
     />
     <p className="text-sm mb-4">
      Didn&apos;t receive code?{' '}
      <button type="button" onClick={onResend} className="font-semibold underline">
       Resend
      </button>
     </p>
     <div className="flex justify-end">
      <button
       type="button"
       onClick={handleSubmit}
       disabled={isLoading}
       className="py-2.5 px-5 font-semibold bg-zinc-950 text-white text-sm rounded-md hover:bg-zinc-800 active:bg-zinc-700 font-inter flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
       {isLoading && (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
       )}
       {isLoading ? 'Verifying...' : 'Verify'}
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}

