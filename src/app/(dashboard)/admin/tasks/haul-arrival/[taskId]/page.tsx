'use client';

import { use } from 'react';
import { HaulArrivalPage } from '@/components/features/admin/tasks';

export default function HaulArrivalTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  return <HaulArrivalPage taskId={taskId} />;
}
