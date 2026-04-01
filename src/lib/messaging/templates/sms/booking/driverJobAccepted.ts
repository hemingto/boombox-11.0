/**
 * @fileoverview SMS template for driver job acceptance confirmation
 * @source boombox-10.0/src/lib/twilio.ts (driver notification patterns)
 * @refactor Extracted into template-based system with variable validation
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const driverJobAcceptedSms: MessageTemplate = {
  text: 'Boombox: Job accepted! ${appointmentType} on ${formattedDate} at ${formattedTime}. Log on to your onfleet driver app to see the details!',
  requiredVariables: ['appointmentType', 'formattedDate', 'formattedTime'],
  channel: 'sms',
  domain: 'booking',
  description: 'Confirmation sent to driver after accepting a job',
};
