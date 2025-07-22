/**
 * @fileoverview SMS template for moving partner time change notifications
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 797)
 * @refactor Extracted inline message into template-based system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const movingPartnerTimeChangeNotificationSms: MessageTemplate = {
  text: 'Boombox: Job time changed for appointment ${appointmentId}. Changed from ${originalDate} at ${originalTime} to ${newDate} at ${newTime}. Customer: ${customerName}. Address: ${address}',
  requiredVariables: [
    'appointmentId',
    'originalDate',
    'originalTime',
    'newDate', 
    'newTime',
    'customerName',
    'address'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to moving partners when appointment time changes',
}; 