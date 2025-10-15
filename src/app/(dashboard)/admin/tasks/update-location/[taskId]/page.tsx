/**
 * @fileoverview Update location task page - admin updates storage unit location
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/update-location/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 */

'use client';

import { use } from 'react';
import { UpdateLocationPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function UpdateLocationTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <UpdateLocationPage taskId={taskId} />;
}
