/**
 * @fileoverview SMS template for driver reconfirmation on appointment time changes
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (line 680)
 * @refactor Extracted inline message into template-based system
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverReassignmentNotificationSms: MessageTemplate = {
  text: 'Boombox: Job Updated - ${appointmentType} Job changed from ${originalDate} at ${originalTime} to ${newDate} at ${newTime}. Text Yes to Reconfirm or No to Decline. Details: ${webViewUrl}',
  requiredVariables: [
    'appointmentType',
    'originalDate',
    'originalTime', 
    'newDate',
    'newTime',
    'webViewUrl'
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'SMS sent to drivers when appointment time changes requiring reconfirmation',
}; 