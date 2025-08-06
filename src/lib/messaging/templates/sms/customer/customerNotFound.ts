/**
 * @fileoverview Customer not found error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 69)
 * @domain customer
 */

import type { MessageTemplate } from '../../types';

export const customerNotFoundTemplate: MessageTemplate = {
  text: 'We could not identify you in our system. Please contact support for assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'customer'
};