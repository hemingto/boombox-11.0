/**
 * @fileoverview SMS template for notifying drivers of appointment time changes
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (inline SMS messages)
 * @refactor Extracted to centralized template with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverTimeChangeNotificationSms: MessageTemplate = {
  text: 'Boombox: Job time changed for appointment ${appointmentId}. Changed from ${originalDate} at ${originalTime} to ${newDate} at ${newTime}. Customer: ${customerName}. Address: ${address}',
  requiredVariables: [
    'appointmentId',
    'originalDate',
    'originalTime',
    'newDate',
    'newTime',
    'customerName',
    'address',
  ],
  channel: 'sms',
  domain: 'appointment',
};

