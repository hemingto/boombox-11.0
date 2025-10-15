/**
 * @fileoverview Customer account info page - contact information management
 * @source boombox-10.0/src/app/user-page/[id]/account-info/page.tsx
 * @refactor Migrated to (dashboard)/customer route group
 */

'use client';

import { ContactInfoHero, ContactInfoTable } from '@/components/features/customers';
import { useUser } from '@/contexts/UserContext';

export default function AccountInfo() {
  const userId = useUser();

  return (
    <div className="min-h-[500px]">
      <ContactInfoHero userId={userId} />
      <ContactInfoTable userId={userId} />
    </div>
  );
}

