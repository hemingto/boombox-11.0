/**
 * @fileoverview Step 4 handler for final storage unit completion webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 4 logic)
 * @refactor Extracted step 4 specific logic for final completion
 */

import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus
} from '@/lib/utils/webhookQueries';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StepFourHandler {
  /**
   * Handle taskCompleted event for Step 4 (Final Completion)
   * Updates appointment status to "Complete"
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { data } = webhookData;
    const taskDetails = data?.task;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    console.log('Processing Step 4 completion webhook with shortId:', taskDetails.shortId);

    // Find appointment
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 4 }
    );

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Update appointment status to complete
    await updateAppointmentStatus(appointment.id, 'Complete');
    
    console.log('Updated appointment status to Complete for appointment:', appointment.id);
  }
} 