/**
 * @fileoverview General customer support message templates
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (lines 226, 395, 401)
 * @domain customer
 */

import type { MessageTemplate } from '../../../types';

export const generalSupportTemplate: MessageTemplate = {
  text: 'We received your message. If you need assistance with your appointment, please contact our support team.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};

export const moverChangeAmbiguousTemplate: MessageTemplate = {
  text: 'Sorry, we couldn\'t understand your response. For moving partner changes, please reply with "ACCEPT" to confirm the new mover or "DIY" to switch to our DIY plan.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};

export const generalAmbiguousTemplate: MessageTemplate = {
  text: 'We received your message but couldn\'t understand what you\'re responding to. Please contact support if you need assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};