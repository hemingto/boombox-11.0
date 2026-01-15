/**
 * @fileoverview Access storage page - customer requests storage unit access
 * @source boombox-10.0/src/app/user-page/[id]/access-storage/page.tsx
 * @refactor Migrated to (dashboard)/customer route group with provider at page level
 */

'use client';

import { use } from 'react';
import { AccessStorageForm } from '@/components/features/orders';
import { AccessStorageProvider } from '@/components/features/orders/AccessStorageProvider';

interface AccessStoragePageProps {
  params: Promise<{ id: string }>;
}

export default function AccessStorage({ params }: AccessStoragePageProps) {
  const { id: userId } = use(params);
  
  console.log('📄 [AccessStoragePage] Rendering with userId:', userId);
  
  return (
    <AccessStorageProvider 
      mode="create" 
      userId={userId}
      enablePersistence={false}
    >
      <div className="min-h-[1200px]">
        <AccessStorageForm />
      </div>
    </AccessStorageProvider>
  );
}

