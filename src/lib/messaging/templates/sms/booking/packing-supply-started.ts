/**
 * @fileoverview SMS template for packing supply delivery started notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (handlePackingSupplyTaskStarted)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const packingSupplyStartedTemplate: MessageTemplate = {
  text: 'Boombox: ${driverName} is on the way with your packing supplies! Track your delivery: ${trackingUrl}',
  requiredVariables: ['driverName', 'trackingUrl'],
  channel: 'sms',
  domain: 'booking'
}; 