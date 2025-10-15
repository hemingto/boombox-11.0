/**
 * @fileoverview Storage unit return task page - admin processes unit returns
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/storage-unit-return/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 */

'use client';

import { use } from 'react';
import { StorageUnitReturnPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function StorageReturnTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <StorageUnitReturnPage taskId={taskId} />;
}
