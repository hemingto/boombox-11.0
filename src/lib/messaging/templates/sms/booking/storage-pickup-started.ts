/**
 * @fileoverview SMS template for storage unit pickup started notifications
 * @source boombox-10.0/src/app/api/webhooks/onfleet/route.ts (taskStarted step 1)
 * @refactor Extracted from inline SMS message logic
 */

import { MessageTemplate } from '@/lib/messaging/types';

export const storagePickupStartedTemplate: MessageTemplate = {
  text: '${crewName} is picking up your Boombox. Track your delivery here: ${trackingUrl}',
  requiredVariables: ['crewName', 'trackingUrl'],
  channel: 'sms',
  domain: 'booking'
}; 