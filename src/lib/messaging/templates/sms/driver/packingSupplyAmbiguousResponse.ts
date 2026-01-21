/**
 * @fileoverview Packing supply ambiguous response message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 269)
 * @domain driver
 */

import type { MessageTemplate } from '../../../types';

export const packingSupplyAmbiguousResponseTemplate: MessageTemplate = {
  text: 'Sorry, we couldn\'t understand your response to the packing supply route offer. Please reply with YES to accept or NO to decline.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};