/**
 * @fileoverview No pending mover change request message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 91)
 * @domain customer
 */

import type { MessageTemplate } from '../../types';

export const noPendingMoverChangeTemplate: MessageTemplate = {
  text: 'We could not find any pending moving partner changes for your account. Please contact support if you need assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};