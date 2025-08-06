/**
 * @fileoverview Mover change already processed message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 109)
 * @domain customer
 */

import type { MessageTemplate } from '../../types';

export const moverChangeAlreadyProcessedTemplate: MessageTemplate = {
  text: 'Your moving partner change request has already been processed. Please check your account for the latest status.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};