/**
 * @fileoverview Negative feedback task page - admin reviews and handles negative feedback
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/negative-feedback/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 * @routing-improvement Direct URL access at /admin/tasks/feedback/[taskId] (no redirect needed)
 */

'use client';

import { use } from 'react';
import { NegativeFeedbackPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function NegativeFeedbackTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <NegativeFeedbackPage taskId={taskId} />;
}

