/**
 * @fileoverview Task decline confirmation message templates
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 510, 544)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const taskDeclineReconfirmationTemplate: MessageTemplate = {
  text: 'Thank you for letting us know. We have unassigned you from this job and will find another driver.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};

export const taskDeclineConfirmationTemplate: MessageTemplate = {
  text: 'Thank you for letting us know. We have recorded that you are not available for this job.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};