/**
 * @fileoverview SMS template for packing supply delivery completion notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (handlePackingSupplyTaskCompleted)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const packingSupplyCompletedTemplate: MessageTemplate = {
  text: 'Boombox: Your packing supplies have been delivered! Share feedback: ${feedbackUrl}',
  requiredVariables: ['feedbackUrl'],
  channel: 'sms',
  domain: 'booking'
}; 