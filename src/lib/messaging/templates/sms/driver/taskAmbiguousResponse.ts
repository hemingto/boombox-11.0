/**
 * @fileoverview Task ambiguous response message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 409)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const taskAmbiguousResponseTemplate: MessageTemplate = {
  text: 'Sorry, we couldn\'t understand your response. Please reply with YES to accept or NO to decline the job offer.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};