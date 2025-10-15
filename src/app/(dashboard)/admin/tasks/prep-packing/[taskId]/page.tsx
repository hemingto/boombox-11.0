/**
 * @fileoverview Prep packing supply order task page - admin prepares packing supply orders
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/prep-packing-supply-order/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 */

'use client';

import { use } from 'react';
import { PrepPackingSupplyOrderPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function PrepPackingTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <PrepPackingSupplyOrderPage taskId={taskId} />;
}
