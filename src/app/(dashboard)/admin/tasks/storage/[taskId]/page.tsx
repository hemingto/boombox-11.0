/**
 * @fileoverview Assign storage unit task page - admin assigns units to new appointments
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/assign-storage-unit/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 * @routing-improvement Direct URL access at /admin/tasks/storage/[taskId] (no redirect needed)
 */

'use client';

import { use } from 'react';
import { AssignStorageUnitPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function AssignStorageUnitTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <AssignStorageUnitPage taskId={taskId} />;
}

