/**
 * @fileoverview Prep units for delivery task page - admin prepares units for delivery
 * @source boombox-10.0/src/app/admin/tasks/[taskId]/prep-units-delivery/page.tsx
 * @refactor CRITICAL: Migrated to direct route structure (eliminates client-side redirect)
 */

'use client';

import { use } from 'react';
import { PrepUnitsDeliveryPage } from '@/components/features/admin/tasks';

type PageParams = {
  taskId: string;
};

export default function PrepDeliveryTaskPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const actualParams = use(params);
  const taskId = actualParams.taskId;

  return <PrepUnitsDeliveryPage taskId={taskId} />;
}
