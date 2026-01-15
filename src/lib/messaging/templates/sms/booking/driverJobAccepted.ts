/**
 * @fileoverview SMS template for driver job acceptance confirmation
 * @source boombox-10.0/src/lib/twilio.ts (driver notification patterns)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverJobAcceptedSms: MessageTemplate = {
  text: 'Boombox: Job accepted! ${appointmentType} on ${formattedDate} at ${formattedTime}. Address: ${address}. See you there!',
  requiredVariables: [
    'appointmentType',
    'formattedDate',
    'formattedTime',
    'address',
  ],
  channel: 'sms',
  domain: 'booking',
  description: 'Confirmation sent to driver after accepting a job',
};

