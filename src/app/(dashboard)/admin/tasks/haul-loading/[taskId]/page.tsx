'use client';

import { use } from 'react';
import { HaulLoadingPage } from '@/components/features/admin/tasks';

export default function HaulLoadingTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return <HaulLoadingPage taskId={taskId} />;
}
