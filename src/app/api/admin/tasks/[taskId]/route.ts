/**
 * @fileoverview Unified admin task detail endpoint with service delegation
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts
 * 
 * ROUTE FUNCTIONALITY:
 * GET endpoint: Returns individual task details for all admin task types
 * - Parses taskId format to determine task type (e.g., "prep-packing-supply-22")
 * - Delegates to appropriate service based on task type
 * - Returns standardized task response with all necessary display data
 * 
 * USED BY (boombox-10.0 files):
 * - Admin task detail pages
 * - src/hooks/useTask.ts (line 91: task data fetching hook)
 * - Task management components
 * 
 * INTEGRATION NOTES:
 * - Replaces 716-line monolithic route with service-based delegation (~79% code reduction)
 * - Leverages existing 10 task services in boombox-11.0/src/lib/services/admin/
 * - Maintains exact functionality and response format from boombox-10.0
 * - Follows boombox-11.0 service-based architecture principles
 * 
 * TASK ID FORMATS:
 * - storage-{appointmentId} → AssignStorageUnitService
 * - storage-{appointmentId}-{unitIndex} → AssignStorageUnitService (multi-unit)
 * - storage-return-{appointmentId} → StorageUnitReturnService
 * - unassigned-{appointmentId} → UnassignedDriverService
 * - feedback-{feedbackId} → NegativeFeedbackService
 * - packing-supply-feedback-{feedbackId} → NegativeFeedbackService
 * - cleaning-{storageUnitId} → PendingCleaningService
 * - requested-unit-{appointmentId}-{unitIndex} → AssignRequestedUnitService
 * - update-location-{usageId} → UpdateLocationService
 * - prep-delivery-{appointmentId} → PrepUnitsDeliveryService
 * - prep-packing-supply-{orderId} → PrepPackingSupplyOrderService
 * 
 * @refactor Migrated from monolithic route to service-based architecture
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AssignStorageUnitService,
  UnassignedDriverService,
  StorageUnitReturnService,
  AssignRequestedUnitService,
  NegativeFeedbackService,
  PendingCleaningService,
  PrepPackingSupplyOrderService,
  PrepUnitsDeliveryService,
  UpdateLocationService
} from '@/lib/services';
import { AdminTaskResponseSchema } from '@/lib/validations/api.validations';

// Initialize services
const assignStorageUnitService = new AssignStorageUnitService();
const unassignedDriverService = new UnassignedDriverService();
const storageUnitReturnService = new StorageUnitReturnService();
const assignRequestedUnitService = new AssignRequestedUnitService();
const negativeFeedbackService = new NegativeFeedbackService();
const pendingCleaningService = new PendingCleaningService();
const prepPackingSupplyOrderService = new PrepPackingSupplyOrderService();
const prepUnitsDeliveryService = new PrepUnitsDeliveryService();
const updateLocationService = new UpdateLocationService();

/**
 * Parse task ID to extract task type and entity ID
 * @source boombox-10.0/src/app/api/admin/tasks/[taskId]/route.ts (lines 48-120)
 */
function parseTaskId(taskId: string): {
  taskType: string;
  entityId: number;
  unitIndex?: number;
  storageUnitId?: number;
} | null {
  try {
    // Storage return tasks
    if (taskId.startsWith('storage-return-')) {
      const parts = taskId.split('-');
      return {
        taskType: 'storage-return',
        entityId: parseInt(parts[2]),
        storageUnitId: parts[3] ? parseInt(parts[3]) : undefined
      };
    }
    
    // Storage assignment tasks
    if (taskId.startsWith('storage-')) {
      const parts = taskId.split('-');
      return {
        taskType: 'storage',
        entityId: parseInt(parts[1]),
        unitIndex: parts[2] ? parseInt(parts[2]) : undefined
      };
    }
    
    // Unassigned driver tasks
    if (taskId.startsWith('unassigned-')) {
      return {
        taskType: 'unassigned',
        entityId: parseInt(taskId.split('-')[1])
      };
    }
    
    // Packing supply feedback tasks
    if (taskId.startsWith('packing-supply-feedback-')) {
      return {
        taskType: 'packing-supply-feedback',
        entityId: parseInt(taskId.split('-')[3])
      };
    }
    
    // Regular feedback tasks
    if (taskId.startsWith('feedback-')) {
      return {
        taskType: 'feedback',
        entityId: parseInt(taskId.split('-')[1])
      };
    }
    
    // Cleaning tasks
    if (taskId.startsWith('cleaning-')) {
      return {
        taskType: 'cleaning',
        entityId: parseInt(taskId.split('-')[1])
      };
    }
    
    // Requested unit tasks
    if (taskId.startsWith('requested-unit-')) {
      const parts = taskId.split('-');
      return {
        taskType: 'requested-unit',
        entityId: parseInt(parts[2]), // appointmentId
        unitIndex: parseInt(parts[3])
      };
    }
    
    // Update location tasks
    if (taskId.startsWith('update-location-')) {
      return {
        taskType: 'update-location',
        entityId: parseInt(taskId.split('-')[2])
      };
    }
    
    // Prep delivery tasks
    if (taskId.startsWith('prep-delivery-')) {
      return {
        taskType: 'prep-delivery',
        entityId: parseInt(taskId.split('-')[2])
      };
    }
    
    // Prep packing supply tasks
    if (taskId.startsWith('prep-packing-supply-')) {
      return {
        taskType: 'prep-packing-supply',
        entityId: parseInt(taskId.split('-')[3])
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing task ID:', error);
    return null;
  }
}

/**
 * GET endpoint: Retrieve individual task details
 * Delegates to appropriate service based on task type
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    // Parse task ID to determine type and entity
    const parsed = parseTaskId(taskId);
    
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      );
    }
    
    const { taskType, entityId, unitIndex, storageUnitId } = parsed;
    
    if (isNaN(entityId)) {
      return NextResponse.json(
        { error: 'Invalid entity ID in task ID' },
        { status: 400 }
      );
    }
    
    let task = null;
    
    // Delegate to appropriate service based on task type
    switch (taskType) {
      case 'storage':
        task = await assignStorageUnitService.getStorageUnitAssignmentTask(entityId, unitIndex);
        break;
        
      case 'storage-return':
        task = await storageUnitReturnService.getStorageUnitReturnTask(entityId, storageUnitId);
        break;
        
      case 'unassigned':
        task = await unassignedDriverService.getUnassignedDriverTask(entityId);
        break;
        
      case 'feedback':
      case 'packing-supply-feedback':
        task = await negativeFeedbackService.getNegativeFeedbackTask(entityId);
        break;
        
      case 'cleaning':
        task = await pendingCleaningService.getCleaningTask(entityId);
        break;
        
      case 'requested-unit':
        if (unitIndex === undefined) {
          return NextResponse.json(
            { error: 'Unit index required for requested-unit tasks' },
            { status: 400 }
          );
        }
        // Fetch requested storage unit to get the storageUnitId
        const { prisma } = await import('@/lib/database/prismaClient');
        const requestedUnits = await prisma.requestedAccessStorageUnit.findMany({
          where: { appointmentId: entityId },
          select: { storageUnitId: true },
          orderBy: { id: 'asc' }
        });
        const storageUnitIdForTask = requestedUnits[unitIndex - 1]?.storageUnitId || 0;
        task = await assignRequestedUnitService.getRequestedUnitAssignmentTask(entityId, unitIndex, storageUnitIdForTask);
        break;
        
      case 'update-location':
        task = await updateLocationService.getLocationUpdateTask(entityId);
        break;
        
      case 'prep-delivery':
        task = await prepUnitsDeliveryService.getPrepDeliveryTask(entityId);
        break;
        
      case 'prep-packing-supply':
        task = await prepPackingSupplyOrderService.getPrepTask(entityId);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown task type' },
          { status: 400 }
        );
    }
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const response = {
      task,
      success: true
    };
    
    // Validate response format
    const validation = AdminTaskResponseSchema.safeParse(response);
    if (!validation.success) {
      console.error('Task response validation failed:', validation.error);
      return NextResponse.json(
        { error: 'Internal server error: Invalid response format' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error retrieving task details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

