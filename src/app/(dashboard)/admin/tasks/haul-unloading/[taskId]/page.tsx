'use client';

import { use } from 'react';
import { HaulUnloadingPage } from '@/components/features/admin/tasks';

export default function HaulUnloadingTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return <HaulUnloadingPage taskId={taskId} />;
}
