/**
 * @fileoverview Step 3 handler for storage unit warehouse arrival webhook events
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (step 3 logic)
 * @refactor Extracted step 3 specific logic for warehouse arrival and payout processing
 */

import {
  findAppointmentByOnfleetTask,
  updateAppointmentStatus
} from '@/lib/utils/webhookQueries';
import type { OnfleetWebhookPayload } from '@/lib/validations/api.validations';

// @REFACTOR-P9-TEMP: Replace with migrated payout service when API_005 completes  
// Priority: High | Est: 2h | Dependencies: API_005_DRIVERS_DOMAIN
const processAppointmentPayout = async (appointmentId: number) => {
  console.log('PLACEHOLDER: processAppointmentPayout called for appointment', appointmentId);
  return { 
    success: false, 
    error: 'Placeholder implementation',
    amount: 0,
    transferId: 'placeholder-transfer-id'
  };
};

// @REFACTOR-P9-TEMP: Replace with migrated SMS notification when API_005 completes
// Priority: High | Est: 30min | Dependencies: API_005_DRIVERS_DOMAIN
const sendPayoutNotificationSMS = async (appointmentId: number, amount: number, appointment: any) => {
  console.log('PLACEHOLDER: sendPayoutNotificationSMS called for appointment', appointmentId, 'amount:', amount);
};

export class StepThreeHandler {
  /**
   * Handle taskCompleted event for Step 3 (Warehouse Arrival)
   * Updates appointment status and processes driver payout
   */
  static async handleTaskCompleted(webhookData: OnfleetWebhookPayload): Promise<void> {
    const { data } = webhookData;
    const taskDetails = data?.task;

    if (!taskDetails) {
      throw new Error('No task details found in webhook data');
    }

    console.log('Processing Step 3 completion webhook with shortId:', taskDetails.shortId);

    // Find appointment with necessary includes
    const appointment = await findAppointmentByOnfleetTask(
      taskDetails.shortId,
      { stepNumber: 3 }
    );

    if (!appointment) {
      console.log('No appointment found for task:', taskDetails.shortId);
      return;
    }

    // Update appointment status to awaiting admin check-in
    await updateAppointmentStatus(appointment.id, 'Awaiting Admin Check In');
    
    console.log('Updated appointment status to Awaiting Admin Check In');

    // Process payout for the completed job (full job compensation)
    await this.processJobPayout(appointment);
  }

  /**
   * Process driver payout for completed job
   * @REFACTOR-P9-TEMP: This will be replaced when API_005_DRIVERS_DOMAIN is completed
   */
  private static async processJobPayout(appointment: any): Promise<void> {
    try {
      console.log(`Processing payout for completed job - Appointment: ${appointment.id}`);
      
      const payoutResult = await processAppointmentPayout(appointment.id);
      
      if (payoutResult.success) {
        console.log(`Payout completed for appointment ${appointment.id}: $${payoutResult.amount} (Transfer ID: ${payoutResult.transferId})`);
        
        // Send SMS notification to worker with earnings
        await sendPayoutNotificationSMS(appointment.id, payoutResult.amount!, appointment);
      } else {
        console.error(`Payout failed for appointment ${appointment.id}:`, payoutResult.error);
      }
    } catch (payoutError) {
      console.error('Error processing payout for completed job:', appointment.id, payoutError);
      // Don't fail the entire webhook if payout fails
    }
  }
} 