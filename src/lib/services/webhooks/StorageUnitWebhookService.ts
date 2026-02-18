/**
 * @fileoverview Storage unit webhook service - orchestrates step-specific handlers
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (storage unit logic)
 * @refactor Extracted storage unit webhook processing into dedicated service with step handlers
 */

import {
  updateTaskCompletionPhoto,
  getMetadataValue,
  extractAllDeliveryPhotoUrls
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findOnfleetTaskByShortId,
  updateOnfleetTaskWebhookTime,
  updateStorageUnitPhotosFromWebhook
} from '@/lib/utils/webhookQueries';
import { StepOneHandler } from './storage/StepOneHandler';
import { StepTwoHandler } from './storage/StepTwoHandler';
import { StepThreeHandler } from './storage/StepThreeHandler';
import { StepFourHandler } from './storage/StepFourHandler';
import { TaskCostingService } from '@/lib/services/payments/TaskCostingService';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StorageUnitWebhookService {
  /**
   * Handle storage unit webhook events
   * Routes to appropriate step handlers based on step number and trigger type
   */
  static async handle(webhookData: OnfleetWebhookPayload): Promise<{ success: boolean; message?: string }> {
    console.log('=== [StorageUnitWebhook] Starting processing ===');
    
    try {
      const { taskId, time, triggerName, data } = webhookData;
      const taskDetails = data?.task;
      const metadata = taskDetails?.metadata;
      const step = getMetadataValue(metadata, 'step');

      console.log(`[StorageUnitWebhook] triggerName: ${triggerName}`);
      console.log(`[StorageUnitWebhook] taskId: ${taskId}`);
      console.log(`[StorageUnitWebhook] step from metadata: ${step}`);
      console.log(`[StorageUnitWebhook] time: ${time}`);

      if (!taskDetails) {
        console.error('[StorageUnitWebhook] ERROR: No task details in webhook data');
        return { success: false, message: 'No task details found' };
      }

      console.log(`[StorageUnitWebhook] Task shortId: ${taskDetails.shortId}`);
      console.log(`[StorageUnitWebhook] Task metadata:`, JSON.stringify(metadata, null, 2));

      // Find the OnfleetTask to get the unitNumber
      console.log(`[StorageUnitWebhook] Looking up OnfleetTask by shortId: ${taskDetails.shortId}`);
      const onfleetTask = await findOnfleetTaskByShortId(taskDetails.shortId);
      
      if (onfleetTask) {
        console.log(`[StorageUnitWebhook] OnfleetTask found:`, {
          id: onfleetTask.id,
          shortId: onfleetTask.shortId,
          unitNumber: onfleetTask.unitNumber,
          stepNumber: onfleetTask.stepNumber,
          appointmentId: onfleetTask.appointmentId
        });
      } else {
        console.log(`[StorageUnitWebhook] WARNING: OnfleetTask NOT FOUND for shortId: ${taskDetails.shortId}`);
      }

      // Update webhook time for taskStarted triggers on steps 1-4
      const stepNumber = Number(step);
      console.log(`[StorageUnitWebhook] Step number (parsed): ${stepNumber}, is valid step: ${[1, 2, 3, 4].includes(stepNumber)}`);
      
      if (triggerName === 'taskStarted' && [1, 2, 3, 4].includes(stepNumber)) {
        if (onfleetTask) {
          console.log(`[StorageUnitWebhook] Updating webhook time for taskStarted, step ${step}`);
          await updateOnfleetTaskWebhookTime(taskDetails.shortId, time.toString());
          console.log(`[StorageUnitWebhook] Webhook time updated successfully`);
        } else {
          console.log(`[StorageUnitWebhook] Skipping webhook time update - OnfleetTask not found in database for shortId: ${taskDetails.shortId}`);
        }
      }

      // Save completion photo for ALL completed tasks (steps 1, 2, 3, 4)
      if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(stepNumber)) {
        if (onfleetTask) {
          console.log(`[StorageUnitWebhook] Saving completion photo for step ${step}`);
          await updateTaskCompletionPhoto(taskDetails);
          console.log(`[StorageUnitWebhook] Completion photo saved`);
        } else {
          console.log(`[StorageUnitWebhook] Skipping completion photo save - OnfleetTask not found in database for shortId: ${taskDetails.shortId}`);
        }
      }

      // Update StorageUnitUsage photos for ALL units on step 2 completion
      // Previously this only ran for unitNumber === 1 inside StepTwoHandler,
      // causing multi-unit appointments to miss photo updates for units 2+.
      if (triggerName === 'taskCompleted' && stepNumber === 2 && onfleetTask?.storageUnitId) {
        const allPhotoUrls = extractAllDeliveryPhotoUrls(taskDetails);
        if (allPhotoUrls.length > 0) {
          const mainImage = allPhotoUrls[0];
          const additionalImages = allPhotoUrls.slice(1);
          console.log(`[StorageUnitWebhook] Updating StorageUnitUsage photos for storageUnitId: ${onfleetTask.storageUnitId}, unitNumber: ${onfleetTask.unitNumber}`);
          try {
            await updateStorageUnitPhotosFromWebhook(onfleetTask.storageUnitId, mainImage, additionalImages);
            console.log(`[StorageUnitWebhook] StorageUnitUsage photos updated successfully`);
          } catch (error) {
            console.error(`[StorageUnitWebhook] Error updating StorageUnitUsage photos:`, error);
          }
        } else {
          console.log(`[StorageUnitWebhook] No completion photos found in webhook for storageUnitId: ${onfleetTask.storageUnitId}`);
        }
      }

      // Calculate actual costs for ALL completed tasks (steps 1, 2, 3, 4)
      // Note: TaskCostingService.updateTaskActualCostFromWebhook handles missing records gracefully
      if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(stepNumber)) {
        console.log(`[StorageUnitWebhook] Calculating actual costs for step ${step}`);
        try {
          await TaskCostingService.updateTaskActualCostFromWebhook(taskDetails.shortId, taskDetails.completionDetails);
          console.log('[StorageUnitWebhook] Actual cost updated successfully for task:', taskDetails.shortId);
        } catch (error) {
          console.error('[StorageUnitWebhook] Error updating actual cost for task:', taskDetails.shortId, error);
          // Don't fail the entire webhook if cost calculation fails
        }
      }

      // Only process status changes and notifications for unit 1
      console.log(`[StorageUnitWebhook] Unit number check: ${onfleetTask?.unitNumber} === 1 ? ${onfleetTask?.unitNumber === 1}`);
      
      if (onfleetTask?.unitNumber === 1) {
        console.log(`[StorageUnitWebhook] >>> Processing main unit (unit 1) webhook`);
        await this.processMainUnitWebhook(webhookData, step);
        console.log(`[StorageUnitWebhook] Main unit processing complete`);
      } else {
        console.log(`[StorageUnitWebhook] Skipping billing/notifications - not unit 1 (unitNumber: ${onfleetTask?.unitNumber})`);
      }

      console.log('=== [StorageUnitWebhook] Processing complete - SUCCESS ===');
      return { success: true, message: 'Storage unit webhook processed successfully' };

    } catch (error) {
      console.error('[StorageUnitWebhook] ERROR during processing:', error);
      console.error('[StorageUnitWebhook] Error stack:', error instanceof Error ? error.stack : 'No stack');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process webhook events for the main unit (unitNumber = 1)
   * Routes to appropriate step handlers
   */
  private static async processMainUnitWebhook(
    webhookData: OnfleetWebhookPayload, 
    step: string | null
  ): Promise<void> {
    const { triggerName } = webhookData;

    console.log(`[StorageUnitWebhook:MainUnit] Processing - trigger: ${triggerName}, step: ${step}`);

    if (!step) {
      console.log('[StorageUnitWebhook:MainUnit] WARNING: No step found in metadata, skipping step-specific processing');
      return;
    }

    console.log(`[StorageUnitWebhook:MainUnit] Routing to step ${step} handler for trigger ${triggerName}`);

    // Route to appropriate step handler based on step number and trigger
    switch (step) {
      case '1':
        console.log(`[StorageUnitWebhook:MainUnit] Step 1 - checking trigger: ${triggerName}`);
        if (triggerName === 'taskStarted') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepOneHandler.handleTaskStarted()');
          await StepOneHandler.handleTaskStarted(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepOneHandler.handleTaskStarted() completed');
        } else {
          console.log(`[StorageUnitWebhook:MainUnit] Step 1 - trigger ${triggerName} not handled`);
        }
        break;

      case '2':
        console.log(`[StorageUnitWebhook:MainUnit] Step 2 - checking trigger: ${triggerName}`);
        if (triggerName === 'taskStarted') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepTwoHandler.handleTaskStarted()');
          await StepTwoHandler.handleTaskStarted(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepTwoHandler.handleTaskStarted() completed');
        } else if (triggerName === 'taskArrival') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepTwoHandler.handleTaskArrival()');
          await StepTwoHandler.handleTaskArrival(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepTwoHandler.handleTaskArrival() completed');
        } else if (triggerName === 'taskCompleted') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepTwoHandler.handleTaskCompleted()');
          await StepTwoHandler.handleTaskCompleted(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepTwoHandler.handleTaskCompleted() completed');
        } else {
          console.log(`[StorageUnitWebhook:MainUnit] Step 2 - trigger ${triggerName} not handled`);
        }
        break;

      case '3':
        console.log(`[StorageUnitWebhook:MainUnit] Step 3 - checking trigger: ${triggerName}`);
        if (triggerName === 'taskCompleted') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepThreeHandler.handleTaskCompleted()');
          await StepThreeHandler.handleTaskCompleted(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepThreeHandler.handleTaskCompleted() completed');
        } else {
          console.log(`[StorageUnitWebhook:MainUnit] Step 3 - trigger ${triggerName} not handled`);
        }
        break;

      case '4':
        console.log(`[StorageUnitWebhook:MainUnit] Step 4 - checking trigger: ${triggerName}`);
        if (triggerName === 'taskCompleted') {
          console.log('[StorageUnitWebhook:MainUnit] >>> Calling StepFourHandler.handleTaskCompleted()');
          await StepFourHandler.handleTaskCompleted(webhookData);
          console.log('[StorageUnitWebhook:MainUnit] StepFourHandler.handleTaskCompleted() completed');
        } else {
          console.log(`[StorageUnitWebhook:MainUnit] Step 4 - trigger ${triggerName} not handled`);
        }
        break;

      default:
        console.log(`[StorageUnitWebhook:MainUnit] Unhandled step: ${step} for trigger: ${triggerName}`);
    }
    
    console.log('[StorageUnitWebhook:MainUnit] Step handler routing complete');
  }
} 