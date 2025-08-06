/**
 * @fileoverview Mover change processing error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 142)
 * @domain customer
 */

import type { MessageTemplate } from '../../types';

export const moverChangeProcessingErrorTemplate: MessageTemplate = {
  text: 'There was an error processing your response. Please try using the link in your original message or contact support.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};