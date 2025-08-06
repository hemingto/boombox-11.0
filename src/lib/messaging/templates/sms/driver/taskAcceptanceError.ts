/**
 * @fileoverview Task acceptance error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 438)
 * @domain driver
 */

import type { MessageTemplate } from '../../types';

export const taskAcceptanceErrorTemplate: MessageTemplate = {
  text: 'There was an error accepting the job. Please try using the app or contact support for assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};