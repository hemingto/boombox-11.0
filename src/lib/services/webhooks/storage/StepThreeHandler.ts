/**
 * @fileoverview Step 3 handler for storage unit warehouse arrival webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 3 logic)
 * @refactor Extracted step 3 specific logic for warehouse arrival and payout processing
 */

import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus
} from '@/lib/utils/webhookQueries';
import { AppointmentPayoutService } from '@/lib/services/payments/AppointmentPayoutService';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

export class StepThreeHandler {
  /**
   * Handle taskCompleted event for Step 3 (Warehouse Arrival)
   * Updates appointment status and processes driver payout
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    console.log('=== [StepThreeHandler] handleTaskCompleted START ===');
    
    const { data } = webhookData;
    const taskDetails = data?.task;

    console.log(`[StepThreeHandler] taskDetails exists: ${!!taskDetails}`);

    if (!taskDetails) {
      console.error('[StepThreeHandler] ERROR: No task details found');
      throw new Error('No task details found in webhook data');
    }

    console.log(`[StepThreeHandler] Task shortId: ${taskDetails.shortId}`);

    // Find appointment with necessary includes
    console.log(`[StepThreeHandler] Looking up appointment (stepNumber: 3)`);
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 3 }
    );

    if (!appointment) {
      console.log(`[StepThreeHandler] WARNING: No appointment found for task: ${taskDetails.shortId}`);
      return;
    }

    console.log(`[StepThreeHandler] Appointment found: ${appointment.id}`);

    // Update appointment status to awaiting admin check-in
    console.log(`[StepThreeHandler] Updating appointment ${appointment.id} status to "Awaiting Admin Check In"`);
    await updateAppointmentStatus(appointment.id, 'Awaiting Admin Check In');
    console.log('[StepThreeHandler] Appointment status updated successfully');

    // Process payout for the completed job (full job compensation)
    console.log('[StepThreeHandler] Processing job payout...');
    await this.processJobPayout(appointment);

    console.log('=== [StepThreeHandler] handleTaskCompleted COMPLETE ===');
  }

  /**
   * Process driver payout for completed job
   * Uses AppointmentPayoutService which handles Stripe transfer and SMS notification
   */
  private static async processJobPayout(appointment: any): Promise<void> {
    console.log(`[StepThreeHandler:Payout] Starting payout processing for appointment: ${appointment.id}`);
    
    try {
      const payoutResult = await AppointmentPayoutService.processAppointmentPayout(appointment.id);
      
      if (payoutResult.success) {
        console.log(`[StepThreeHandler:Payout] SUCCESS: Payout completed for appointment ${appointment.id}: $${payoutResult.amount} (Transfer ID: ${payoutResult.transferId})`);
      } else {
        console.error(`[StepThreeHandler:Payout] FAILED: Payout failed for appointment ${appointment.id}:`, payoutResult.error);
      }
    } catch (payoutError) {
      console.error(`[StepThreeHandler:Payout] ERROR: Exception processing payout for appointment ${appointment.id}:`, payoutError);
      // Don't fail the entire webhook if payout fails
    }
  }
} 