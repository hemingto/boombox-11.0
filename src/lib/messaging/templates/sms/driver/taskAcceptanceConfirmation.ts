/**
 * @fileoverview Task acceptance confirmation message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 461)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const taskAcceptanceConfirmationTemplate: MessageTemplate = {
  text: 'Great! You have been assigned to the job on ${formattedDate} at ${formattedTime}. Please check the Boombox account page for more details.',
  requiredVariables: ['formattedDate', 'formattedTime'],
  channel: 'sms',
  domain: 'driver'
};