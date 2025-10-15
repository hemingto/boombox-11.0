/**
 * @fileoverview Access storage page - customer requests storage unit access
 * @source boombox-10.0/src/app/user-page/[id]/access-storage/page.tsx
 * @refactor Migrated to (dashboard)/customer route group
 */

'use client';

import { AccessStorageForm } from '@/components/features/orders';

export default function AccessStorage() {
  return (
    <div className="min-h-[1200px]">
      <AccessStorageForm />
    </div>
  );
}

