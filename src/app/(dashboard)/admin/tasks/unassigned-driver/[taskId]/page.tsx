/**
 * @fileoverview Unassigned driver task page - admin assigns driver to appointments
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/unassigned-driver/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 */

'use client';

import { use } from 'react';
import { UnassignedDriverPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function UnassignedDriverTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <UnassignedDriverPage taskId={taskId} />;
}
