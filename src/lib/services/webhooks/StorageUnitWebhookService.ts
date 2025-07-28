/**
 * @fileoverview Storage unit webhook service - orchestrates step-specific handlers
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (storage unit logic)
 * @refactor Extracted storage unit webhook processing into dedicated service with step handlers
 */

import {
  updateTaskCompletionPhoto,
  getMetadataValue
} from '@/lib/utils/onfleetWebhookUtils';
import {
  findOnfleetTaskByShortId,
  updateOnfleetTaskWebhookTime
} from '@/lib/utils/webhookQueries';
import { StepOneHandler } from './storage/StepOneHandler';
import { StepTwoHandler } from './storage/StepTwoHandler';
import { StepThreeHandler } from './storage/StepThreeHandler';
import { StepFourHandler } from './storage/StepFourHandler';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

// @REFACTOR-P9-TEMP: Replace with migrated task costing service when API_008 completes
// Priority: High | Est: 45min | Dependencies: API_008_ADMIN_SYSTEM_DOMAIN
const updateTaskActualCostFromWebhook = async (shortId: string, completionDetails: any) => {
  console.log('PLACEHOLDER: updateTaskActualCostFromWebhook called for', shortId);
};

export class StorageUnitWebhookService {
  /**
   * Handle storage unit webhook events
   * Routes to appropriate step handlers based on step number and trigger type
   */
  static async handle(webhookData: OnfleetWebhookPayload): Promise<{ success: boolean; message?: string }> {
    try {
      const { taskId, time, triggerName, data } = webhookData;
      const taskDetails = data?.task;
      const metadata = taskDetails?.metadata;
      const step = getMetadataValue(metadata, 'step');

      if (!taskDetails) {
        console.error('No task details in webhook data');
        return { success: false, message: 'No task details found' };
      }

      console.log(`Processing storage unit webhook: ${triggerName} for task ${taskDetails.shortId}, step ${step}`);

      // Find the OnfleetTask to get the unitNumber
      const onfleetTask = await findOnfleetTaskByShortId(taskDetails.shortId);

      // Update webhook time for taskStarted triggers on steps 1-4
      if (triggerName === 'taskStarted' && [1, 2, 3, 4].includes(Number(step))) {
        await updateOnfleetTaskWebhookTime(taskDetails.shortId, time.toString());
      }

      // Save completion photo for ALL completed tasks (steps 1, 2, 3, 4)
      if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(Number(step))) {
        await updateTaskCompletionPhoto(taskDetails);
      }

      // Calculate actual costs for ALL completed tasks (steps 1, 2, 3, 4)
      if (triggerName === 'taskCompleted' && [1, 2, 3, 4].includes(Number(step))) {
        try {
          await updateTaskActualCostFromWebhook(taskDetails.shortId, taskDetails.completionDetails);
          console.log('Updated actual cost for completed task:', taskDetails.shortId);
        } catch (error) {
          console.error('Error updating actual cost for task:', taskDetails.shortId, error);
          // Don't fail the entire webhook if cost calculation fails
        }
      }

      // Only process status changes and notifications for unit 1
      if (onfleetTask?.unitNumber === 1) {
        await this.processMainUnitWebhook(webhookData, step);
      } else {
        console.log('Skipping billing/notifications for additional unit:', onfleetTask?.unitNumber);
      }

      return { success: true, message: 'Storage unit webhook processed successfully' };

    } catch (error) {
      console.error('Storage unit webhook processing error:', error);
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

    if (!step) {
      console.log('No step found in metadata, skipping step-specific processing');
      return;
    }

    // Route to appropriate step handler based on step number and trigger
    switch (step) {
      case '1':
        if (triggerName === 'taskStarted') {
          await StepOneHandler.handleTaskStarted(webhookData);
        }
        break;

      case '2':
        if (triggerName === 'taskStarted') {
          await StepTwoHandler.handleTaskStarted(webhookData);
        } else if (triggerName === 'taskArrival') {
          await StepTwoHandler.handleTaskArrival(webhookData);
        } else if (triggerName === 'taskCompleted') {
          await StepTwoHandler.handleTaskCompleted(webhookData);
        }
        break;

      case '3':
        if (triggerName === 'taskCompleted') {
          await StepThreeHandler.handleTaskCompleted(webhookData);
        }
        break;

      case '4':
        if (triggerName === 'taskCompleted') {
          await StepFourHandler.handleTaskCompleted(webhookData);
        }
        break;

      default:
        console.log('Unhandled webhook type or step:', { type: triggerName, step });
    }
  }
} 