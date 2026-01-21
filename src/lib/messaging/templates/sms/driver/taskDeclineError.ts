/**
 * @fileoverview Task decline error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 534)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const taskDeclineErrorTemplate: MessageTemplate = {
  text: 'There was an error declining the job. Please try using the app or contact support for assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};