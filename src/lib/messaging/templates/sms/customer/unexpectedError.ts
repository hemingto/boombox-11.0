/**
 * @fileoverview Unexpected error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 172)
 * @domain customer
 */

import type { MessageTemplate } from '../../../types';

export const unexpectedErrorTemplate: MessageTemplate = {
  text: 'There was an unexpected error processing your response. Please contact support for assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};