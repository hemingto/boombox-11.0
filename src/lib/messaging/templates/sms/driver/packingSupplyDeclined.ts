/**
 * @fileoverview Packing supply route declined confirmation message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 324)
 * @domain driver
 */

import type { MessageTemplate } from '../../types';

export const packingSupplyDeclinedTemplate: MessageTemplate = {
  text: 'Thanks for letting us know. We\'ve recorded that you declined the packing supply route. We\'ll continue looking for other available drivers.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'driver'
};