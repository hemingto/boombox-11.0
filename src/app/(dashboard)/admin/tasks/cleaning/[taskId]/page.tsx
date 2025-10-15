/**
 * @fileoverview Pending cleaning task page - admin manages unit cleaning status
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/pending-cleaning/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 * @routing-improvement Direct URL access at /admin/tasks/cleaning/[taskId] (no redirect needed)
 */

'use client';

import { use } from 'react';
import { PendingCleaningPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function PendingCleaningTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <PendingCleaningPage taskId={taskId} />;
}

