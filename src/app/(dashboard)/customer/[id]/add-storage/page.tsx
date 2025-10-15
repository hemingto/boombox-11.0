/**
 * @fileoverview Add storage page - customer adds additional storage units
 * @source boombox-10.0/src/app/user-page/[id]/add-storage/page.tsx
 * @refactor Migrated to (dashboard)/customer route group
 */

'use client';

import { AddStorageForm } from '@/components/features/orders';

export default function AddStorage() {
  return (
    <div className="min-h-[1200px]">
      <AddStorageForm />
    </div>
  );
}

