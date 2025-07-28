/**
 * @fileoverview SMS template for packing supply delivery failure notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (handlePackingSupplyTaskFailed)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const packingSupplyFailedTemplate: MessageTemplate = {
  text: 'Boombox: We encountered an issue with your packing supply delivery. Our team will contact you shortly to reschedule. We apologize for the inconvenience.',
  requiredVariables: [],
  channel: 'sms',
  domain: 'booking'
}; 