/**
 * @fileoverview Terms of service popup for service providers
 * @source boombox-10.0/src/app/components/mover-account/termsofservicepopup.tsx
 * @refactor TODO: Migrate from boombox-10.0 (placeholder for testing)
 */

'use client';

interface TermsOfServicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  userId: string;
  userType: 'driver' | 'mover';
}

export const TermsOfServicePopup = ({
  isOpen,
  onClose,
  onAgree,
  userId,
  userType,
}: TermsOfServicePopupProps) => {
  if (!isOpen) return null;

  return (
    <div>
      <p>TermsOfServicePopup placeholder - will be migrated</p>
      <p>User ID: {userId}</p>
      <p>User Type: {userType}</p>
      <button onClick={onClose}>Close</button>
      <button onClick={onAgree}>Agree</button>
    </div>
  );
};

