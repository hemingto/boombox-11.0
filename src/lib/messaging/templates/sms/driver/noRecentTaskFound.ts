/**
 * @fileoverview No recent task notification found message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 361)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const noRecentTaskFoundTemplate: MessageTemplate = {
  text: 'We could not find any recent job offers for you. Please check the Boombox driver app or contact support for assistance.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};