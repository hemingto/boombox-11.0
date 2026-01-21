/**
 * @fileoverview Mover change response handler service
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 60-178)
 * @refactor Extracted mover change logic into centralized service
 */

import {
  findCustomerByPhone,
  findPendingMoverChange,
  parseAppointmentDescription,
} from '@/lib/utils';
import { generateMoverChangeToken } from '@/lib/utils/twilioUtils';
import { MessageService } from '../../messaging/MessageService';
import { config } from '@/lib/config/environment';
import {
  customerNotFoundTemplate,
  noPendingMoverChangeTemplate,
  moverChangeAlreadyProcessedTemplate,
  moverChangeProcessingErrorTemplate,
  moverChangeAcceptedTemplate,
  moverChangeDiyTemplate,
  unexpectedErrorTemplate,
} from '@/lib/messaging/templates/sms/customer';
import type { MessageRouteResult } from './InboundMessageRouter';

export class MoverChangeHandler {
  /**
   * Handle mover change response from customer
   * @param phoneNumber - Customer phone number
   * @param action - 'accept' or 'diy'
   * @returns Promise<MessageRouteResult>
   */
  async handleResponse(
    phoneNumber: string,
    action: 'accept' | 'diy'
  ): Promise<MessageRouteResult> {
    try {
      // Find customer by phone number
      const customer = await findCustomerByPhone(phoneNumber);

      if (!customer) {
        await MessageService.sendSms(phoneNumber, customerNotFoundTemplate, {});
        return { success: false, error: 'Customer not found' };
      }

      // Find pending mover change request
      const pendingAppointment = await findPendingMoverChange(String(customer.id));

      if (!pendingAppointment) {
        await MessageService.sendSms(
          phoneNumber,
          noPendingMoverChangeTemplate,
          {}
        );
        return { success: false, error: 'No pending mover change found' };
      }

      // Parse appointment description to validate mover change status
      const appointmentDescription = parseAppointmentDescription(
        pendingAppointment.description
      );
      const moverChangeRequest = appointmentDescription.moverChangeRequest;

      if (!moverChangeRequest || moverChangeRequest.status !== 'pending') {
        await MessageService.sendSms(
          phoneNumber,
          moverChangeAlreadyProcessedTemplate,
          {}
        );
        return { success: false, error: 'Mover change already processed' };
      }

      // Generate token for API call
      const tokenData = {
        appointmentId: pendingAppointment.id,
        suggestedMovingPartnerId: moverChangeRequest.suggestedMovingPartnerId,
        originalMovingPartnerId: moverChangeRequest.originalMovingPartnerId,
        timestamp: new Date(moverChangeRequest.requestedAt).getTime(),
      };
      const token = generateMoverChangeToken(tokenData);

      // Call the mover change response API
      const response = await fetch(
        `${config.app.url}/api/orders/mover-change-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            action,
            appointmentId: pendingAppointment.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        await MessageService.sendSms(
          phoneNumber,
          moverChangeProcessingErrorTemplate,
          {}
        );
        return { success: false, error: 'Error processing mover change' };
      }

      // Send confirmation message based on action
      if (action === 'accept') {
        await MessageService.sendSms(phoneNumber, moverChangeAcceptedTemplate, {
          newMovingPartner: result.newMovingPartner || '',
        });
      } else {
        await MessageService.sendSms(phoneNumber, moverChangeDiyTemplate, {
          newQuotedPrice: result.newQuotedPrice?.toString() || '0',
        });
      }

      return {
        success: true,
        action,
        type: 'mover_change',
        appointmentId: String(pendingAppointment.id),
      };
    } catch (error) {
      console.error('Error handling mover change response:', error);
      await MessageService.sendSms(phoneNumber, unexpectedErrorTemplate, {});
      return { success: false, error: 'Internal error' };
    }
  }
}
