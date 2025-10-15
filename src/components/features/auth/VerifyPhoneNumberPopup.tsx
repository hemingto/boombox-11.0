/**
 * @fileoverview Phone number verification popup component
 * @source boombox-10.0/src/app/components/user-page/verifyphonenumberpopup.tsx
 * @refactor Moved to auth features folder for better organization
 */

'use client';

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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Verify Phone Number</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter the 4-digit code sent to your phone
        </p>

        <div className="flex gap-2 mb-4">
          {code.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => {
                const newCode = [...code];
                newCode[index] = e.target.value;
                setCode(newCode);
              }}
              className="w-12 h-12 text-center border border-gray-300 rounded-md text-lg"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onResend}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Resend Code
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm bg-zinc-950 text-white rounded-md hover:bg-zinc-800"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

