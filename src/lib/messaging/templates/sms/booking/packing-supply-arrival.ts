/**
 * @fileoverview SMS template for packing supply driver arrival notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (handlePackingSupplyTaskArrival)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const packingSupplyArrivalTemplate: MessageTemplate = {
  text: 'Boombox: ${driverName} has arrived with your packing supplies! They\'ll be at your door shortly.',
  requiredVariables: ['driverName'],
  channel: 'sms',
  domain: 'booking'
}; 