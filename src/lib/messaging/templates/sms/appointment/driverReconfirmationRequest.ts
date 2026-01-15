/**
 * @fileoverview SMS template for requesting driver reconfirmation after appointment time change
 * @source boombox-10.0/src/app/api/appointments/[appointmentId]/edit/route.ts (reconfirmation SMS logic)
 * @refactor Extracted to centralized template with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

/**
 * Template for sending reconfirmation request to DIY drivers when appointment time changes.
 * Drivers receive this SMS and can respond YES to confirm or NO to decline.
 */
export const driverReconfirmationRequestSms: MessageTemplate = {
  text: 'Boombox: Job Updated - ${appointmentType} changed from ${originalDate} at ${originalTime} to ${newDate} at ${newTime}. Text YES to Reconfirm or NO to Decline. Details: ${webViewUrl}',
  requiredVariables: [
    'appointmentType',
    'originalDate',
    'originalTime',
    'newDate',
    'newTime',
    'webViewUrl',
  ],
  channel: 'sms',
  domain: 'appointment',
};

