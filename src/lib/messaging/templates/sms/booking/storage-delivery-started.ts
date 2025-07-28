/**
 * @fileoverview SMS template for storage unit delivery started notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (taskStarted step 2)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const storageDeliveryStartedTemplate: MessageTemplate = {
  text: '${crewName} is on their way! Track their eta here: ${trackingUrl}',
  requiredVariables: ['crewName', 'trackingUrl'],
  channel: 'sms',
  domain: 'booking'
}; 