/**
 * @fileoverview SMS template for customer appointment cancellation notifications
 * @refactor New template for notifying drivers/movers when customer cancels appointment
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const customerCancellationNotificationSms: MessageTemplate = {
  text: 'Boombox: Customer cancelled appointment ${appointmentId} scheduled for ${appointmentDate} at ${appointmentTime}. Address: ${address}. Reason: ${cancellationReason}',
  requiredVariables: [
    'appointmentId',
    'appointmentDate',
    'appointmentTime',
    'address',
    'cancellationReason'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers and movers when customer cancels their appointment',
}; 