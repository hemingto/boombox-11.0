/**
 * @fileoverview Packing supply processing error message template
 * @source boombox-10.0/src/app/api/twilio/inbound/route.ts (line 308)
 * @domain driver
 */

import type { MessageTemplate } from '../../types';

export const packingSupplyProcessingErrorTemplate: MessageTemplate = {
  text: 'There was an error ${action}ing the packing supply route. Please try using the link in your original message or contact support.',
  requiredVariables: ['action'],
  channel: 'sms',
  domain: 'driver'
};